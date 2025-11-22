const express = require('express');
const pool = require('../config/database');
const { requireAuth, requireUserOrAdmin } = require('../middleware/auth');

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
      // Get ticket data with sold quantity calculated from tickets table
      const ticketResult = await pool.query(`
        SELECT 
          tt.category,
          tt.price,
          tt.max_quantity,
          COUNT(t.ticket_id)::integer as sold_quantity,
          (tt.max_quantity - COUNT(t.ticket_id))::integer as available_quantity
        FROM ticket_types tt
        LEFT JOIN tickets t ON tt.event_id = t.event_id AND tt.category = t.category
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
    
    // Get ticket types for this event with sold count
    const ticketsResult = await pool.query(`
      SELECT 
        tt.category,
        tt.price,
        tt.max_quantity,
        COUNT(t.ticket_id)::integer as sold_quantity,
        (tt.max_quantity - COUNT(t.ticket_id))::integer as available_quantity
      FROM ticket_types tt
      LEFT JOIN tickets t ON tt.event_id = t.event_id AND tt.category = t.category
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
      'INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [req.session.user.user_id, venue_id, title, description, start_date, end_date, category_id]
    );
    
    const event = eventResult.rows[0];
    
    // Create ticket types if provided
    const createdTicketTypes = [];
    for (const ticket of tickets) {
      const ticketTypeResult = await client.query(
        'INSERT INTO ticket_types (event_id, category, price) VALUES ($1, $2, $3) RETURNING *',
        [event.event_id, ticket.category, ticket.price]
      );
      createdTicketTypes.push(ticketTypeResult.rows[0]);
    }
    
    await client.query('COMMIT');
    
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

module.exports = router;