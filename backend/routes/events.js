const express = require('express');
const pool = require('../config/database');
const { requireAuth, requireUserOrAdmin } = require('../middleware/auth');
const emailService = require('../services/emailService'); 

const router = express.Router();

// Get all events with filters
router.get('/', async (req, res) => {
  try {
    const { category, city, search, organizer_id, status = 'active' } = req.query;
    
    // First get basic event info
    let baseQuery = `
      SELECT 
        e.event_id,
        e.title,
        e.description,
        e.start_date,
        e.end_date,
        e.status,
        e.created_at,
        e.cover_image,
        u.name as organizer_name,
        v.name as venue_name,
        v.city as venue_city,
        v.address as venue_address,
        c.name as category_name
      FROM events e
      JOIN users u ON e.organizer_id = u.user_id
      JOIN venues v ON e.venue_id = v.venue_id
      JOIN categories c ON e.category_id = c.category_id
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 0;
    
    if (status) {
      conditions.push(`e.status = $${++paramCount}`);
      values.push(status);
    }
    
    if (category) {
      conditions.push(`c.name ILIKE $${++paramCount}`);
      values.push(`%${category}%`);
    }
    
    if (city) {
      conditions.push(`v.city ILIKE $${++paramCount}`);
      values.push(`%${city}%`);
    }
    
    if (search) {
      conditions.push(`(e.title ILIKE $${++paramCount} OR e.description ILIKE $${paramCount})`);
      values.push(`%${search}%`);
    }
    
    if (organizer_id) {
      conditions.push(`e.organizer_id = $${++paramCount}`);
      values.push(organizer_id);
    }
    
    if (conditions.length > 0) {
      baseQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    baseQuery += ' ORDER BY e.start_date ASC';
    
    const baseResult = await pool.query(baseQuery, values);
    
    // Enhance each event with ticket and review data
    const enhancedEvents = await Promise.all(baseResult.rows.map(async (event) => {
      // Get ticket data with sold quantity calculated from confirmed bookings only
      const ticketResult = await pool.query(`
        SELECT 
          tt.category,
          tt.price,
          tt.max_quantity,
          COUNT(CASE WHEN b.status = 'confirmed' THEN t.ticket_id END)::integer as sold_quantity,
          (tt.max_quantity - COUNT(CASE WHEN b.status = 'confirmed' THEN t.ticket_id END))::integer as available_quantity
        FROM ticket_types tt
        LEFT JOIN tickets t ON tt.event_id = t.event_id AND tt.category = t.category
        LEFT JOIN booking_items bi ON t.ticket_id = bi.ticket_id
        LEFT JOIN bookings b ON bi.booking_id = b.booking_id
        WHERE tt.event_id = $1
        GROUP BY tt.event_id, tt.category, tt.price, tt.max_quantity
        ORDER BY tt.price ASC
      `, [event.event_id]);
      
      // Get review data
      const reviewResult = await pool.query(`
        SELECT 
          COALESCE(AVG(rating), 0) as avg_rating,
          COUNT(*) as review_count
        FROM reviews 
        WHERE event_id = $1
      `, [event.event_id]);
      
      // Calculate min price and total sold tickets
      const tickets = ticketResult.rows;
      const minPrice = tickets.length > 0 ? Math.min(...tickets.map(t => parseFloat(t.price))) : null;
      const totalSoldTickets = tickets.reduce((sum, t) => sum + parseInt(t.sold_quantity), 0);
      
      return {
        ...event,
        tickets,
        min_price: minPrice,
        total_sold_tickets: totalSoldTickets,
        avg_rating: parseFloat(reviewResult.rows[0].avg_rating),
        review_count: parseInt(reviewResult.rows[0].review_count)
      };
    }));
    
    res.json({ 
      success: true, 
      events: enhancedEvents 
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch events' 
    });
  }
});

// Get event by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        e.*,
        u.name as organizer_name,
        u.email as organizer_email,
        v.name as venue_name,
        v.address as venue_address,
        v.city as venue_city,
        v.capacity as venue_capacity,
        c.name as category_name,
        COALESCE(AVG(r.rating), 0) as avg_rating,
        COUNT(r.review_id) as review_count
      FROM events e
      JOIN users u ON e.organizer_id = u.user_id
      JOIN venues v ON e.venue_id = v.venue_id
      JOIN categories c ON e.category_id = c.category_id
      LEFT JOIN reviews r ON e.event_id = r.event_id
      WHERE e.event_id = $1
      GROUP BY e.event_id, u.name, u.email, v.name, v.address, v.city, v.capacity, c.name
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }
    
    // Get ticket types for this event with sold count from confirmed bookings only
    const ticketsResult = await pool.query(`
      SELECT 
        tt.category,
        tt.price,
        tt.max_quantity,
        COUNT(CASE WHEN b.status = 'confirmed' THEN t.ticket_id END)::integer as sold_quantity,
        (tt.max_quantity - COUNT(CASE WHEN b.status = 'confirmed' THEN t.ticket_id END))::integer as available_quantity
      FROM ticket_types tt
      LEFT JOIN tickets t ON tt.event_id = t.event_id AND tt.category = t.category
      LEFT JOIN booking_items bi ON t.ticket_id = bi.ticket_id
      LEFT JOIN bookings b ON bi.booking_id = b.booking_id
      WHERE tt.event_id = $1
      GROUP BY tt.event_id, tt.category, tt.price, tt.max_quantity
      ORDER BY tt.price ASC
    `, [id]);
    
    // Get event images
    const imagesResult = await pool.query(
      'SELECT * FROM event_images WHERE event_id = $1',
      [id]
    );
    
    const event = {
      ...result.rows[0],
      tickets: ticketsResult.rows,
      images: imagesResult.rows
    };
    
    res.json({ 
      success: true, 
      event 
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch event' 
    });
  }
});

// Create event
router.post('/', requireUserOrAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { 
      title, 
      description, 
      start_date, 
      end_date, 
      venue_id, 
      category_id,
      cover_image,
      tickets = [] 
    } = req.body;
    
    if (!title || !start_date || !end_date || !venue_id || !category_id) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title, dates, venue, and category are required' 
      });
    }
    
    // Create event
    const eventResult = await client.query(
      'INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, cover_image) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [req.session.user.user_id, venue_id, title, description, start_date, end_date, category_id, cover_image || null]
    );
    
    const event = eventResult.rows[0];
    
    // Create ticket types if provided
    const createdTicketTypes = [];
    for (const ticket of tickets) {
      const ticketTypeResult = await client.query(
        'INSERT INTO ticket_types (event_id, category, price, max_quantity) VALUES ($1, $2, $3, $4) RETURNING *',
        [event.event_id, ticket.category, ticket.price, ticket.max_quantity || 100]
      );
      createdTicketTypes.push(ticketTypeResult.rows[0]);
    }
    
    await client.query('COMMIT');

    // send event-creation confirmation email to the organizer (best-effort, won't block response)
    try {
      const organizerEmail = req.session?.user?.email || null;
      if (organizerEmail) {
        const startDate = new Date(event.start_date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
        const endDate = new Date(event.end_date).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'short' });
        
        emailService.sendEmail({
          to: organizerEmail,
          from: process.env.EMAIL_FROM || 'eventhub@gmail.com',
          subject: `✅ Event Created: ${event.title}`,
          text: `Hello ${req.session?.user?.name || ''},\n\nYour event "${event.title}" has been successfully created on EventHub!\n\nEvent Details:\n• Title: ${event.title}\n• Start: ${startDate}\n• End: ${endDate}\n• Status: ${event.status}\n• Ticket Types: ${createdTicketTypes.length}\n\nYour event is now live and attendees can start booking tickets.\n\nManage your event: [Event Dashboard Link]\n\nBest regards,\nThe EventHub Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #10B981;">✅ Event Successfully Created!</h2>
              <p>Hello <strong>${req.session?.user?.name || ''}</strong>,</p>
              <p>Your event <strong>"${event.title}"</strong> has been successfully created on EventHub!</p>
              <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="margin-top: 0; color: #4F46E5;">Event Details</h3>
                <table style="width: 100%; line-height: 1.8;">
                  <tr><td style="color: #6B7280;"><strong>Title:</strong></td><td>${event.title}</td></tr>
                  <tr><td style="color: #6B7280;"><strong>Start:</strong></td><td>${startDate}</td></tr>
                  <tr><td style="color: #6B7280;"><strong>End:</strong></td><td>${endDate}</td></tr>
                  <tr><td style="color: #6B7280;"><strong>Status:</strong></td><td><span style="color: #10B981;">${event.status}</span></td></tr>
                  <tr><td style="color: #6B7280;"><strong>Ticket Types:</strong></td><td>${createdTicketTypes.length}</td></tr>
                </table>
              </div>
              <p style="background-color: #DBEAFE; padding: 15px; border-left: 4px solid #3B82F6; border-radius: 4px;">
                <strong>📢 Your event is now live!</strong><br>
                Attendees can start booking tickets right away.
              </p>
              <p style="margin-top: 30px;">Best regards,<br><strong>The EventHub Team</strong></p>
            </div>
          `
        }).catch(err => console.error('Event creation email error:', err));
      }
    } catch (err) {
      console.error('Event creation email handling error:', err);
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Event created successfully',
      event: {
        ...event,
        ticket_types: createdTicketTypes
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create event error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create event' 
    });
  } finally {
    client.release();
  }
});

// Update event
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, start_date, end_date, venue_id, category_id, status } = req.body;
    
    // Check if user owns this event or is admin
    const eventCheck = await pool.query(
      'SELECT organizer_id FROM events WHERE event_id = $1',
      [id]
    );
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }
    
    if (eventCheck.rows[0].organizer_id !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    const result = await pool.query(
      'UPDATE events SET title = $1, description = $2, start_date = $3, end_date = $4, venue_id = $5, category_id = $6, status = $7 WHERE event_id = $8 RETURNING *',
      [title, description, start_date, end_date, venue_id, category_id, status, id]
    );
    
    res.json({ 
      success: true, 
      message: 'Event updated successfully',
      event: result.rows[0] 
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update event' 
    });
  }
});

// Delete event
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user owns this event or is admin
    const eventCheck = await pool.query(
      'SELECT organizer_id FROM events WHERE event_id = $1',
      [id]
    );
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }
    
    if (eventCheck.rows[0].organizer_id !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    await pool.query('DELETE FROM events WHERE event_id = $1', [id]);
    
    res.json({ 
      success: true, 
      message: 'Event deleted successfully' 
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete event' 
    });
  }
});

// Get event reviews
router.get('/:id/reviews', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        r.*,
        u.name as reviewer_name
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.event_id = $1
      ORDER BY r.review_date DESC
    `, [id]);
    
    res.json({ 
      success: true, 
      reviews: result.rows 
    });
  } catch (error) {
    console.error('Get event reviews error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch event reviews' 
    });
  }
});

// Update event - only organizer or admin can update
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      start_date,
      end_date,
      venue_id,
      category_id,
      status,
      cover_image
    } = req.body;

    // Check if event exists and user is the organizer or admin
    const checkResult = await pool.query(
      'SELECT organizer_id FROM events WHERE event_id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const isOrganizer = checkResult.rows[0].organizer_id === req.session.user.user_id;
    const isAdmin = req.session.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to update this event'
      });
    }

    // Update event
    const result = await pool.query(
      `UPDATE events 
       SET title = COALESCE($1, title),
           description = COALESCE($2, description),
           start_date = COALESCE($3, start_date),
           end_date = COALESCE($4, end_date),
           venue_id = COALESCE($5, venue_id),
           category_id = COALESCE($6, category_id),
           status = COALESCE($7, status),
           cover_image = COALESCE($8, cover_image)
       WHERE event_id = $9
       RETURNING *`,
      [title, description, start_date, end_date, venue_id, category_id, status, cover_image, id]
    );

    res.json({
      success: true,
      message: 'Event updated successfully',
      event: result.rows[0]
    });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event'
    });
  }
});

// Delete event - only organizer or admin can delete
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if event exists and user is the organizer or admin
    const checkResult = await pool.query(
      'SELECT organizer_id FROM events WHERE event_id = $1',
      [id]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    const isOrganizer = checkResult.rows[0].organizer_id === req.session.user.user_id;
    const isAdmin = req.session.user.role === 'admin';

    if (!isOrganizer && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to delete this event'
      });
    }

    // Delete event (cascade will handle related records)
    await pool.query('DELETE FROM events WHERE event_id = $1', [id]);

    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event'
    });
  }
});

module.exports = router;