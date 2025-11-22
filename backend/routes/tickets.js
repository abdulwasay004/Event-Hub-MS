const express = require('express');
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get ticket types for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        tt.event_id,
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
    `, [eventId]);
    
    res.json({ 
      success: true, 
      tickets: result.rows 
    });
  } catch (error) {
    console.error('Get tickets error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch tickets' 
    });
  }
});

// Get ticket type by event and category
router.get('/:eventId/:category', async (req, res) => {
  try {
    const { eventId, category } = req.params;
    
    const result = await pool.query(`
      SELECT 
        tt.event_id,
        tt.category,
        tt.price,
        e.title as event_title,
        e.start_date,
        e.end_date,
        COUNT(t.ticket_id) as sold_quantity
      FROM ticket_types tt
      JOIN events e ON tt.event_id = e.event_id
      LEFT JOIN tickets t ON tt.event_id = t.event_id AND tt.category = t.category
      WHERE tt.event_id = $1 AND tt.category = $2
      GROUP BY tt.event_id, tt.category, tt.price, e.title, e.start_date, e.end_date
    `, [eventId, category]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket type not found' 
      });
    }
    
    res.json({ 
      success: true, 
      ticket: result.rows[0] 
    });
  } catch (error) {
    console.error('Get ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ticket' 
    });
  }
});

// Create ticket type (organizer only)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { event_id, category, price } = req.body;
    
    if (!event_id || !category || price === undefined) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event ID, category, and price are required' 
      });
    }
    
    // Check if user owns the event
    const eventCheck = await pool.query(
      'SELECT organizer_id FROM events WHERE event_id = $1',
      [event_id]
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
      'INSERT INTO ticket_types (event_id, category, price) VALUES ($1, $2, $3) RETURNING *',
      [event_id, category, price]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Ticket type created successfully',
      ticket: result.rows[0] 
    });
  } catch (error) {
    console.error('Create ticket error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ 
        success: false, 
        message: 'Ticket category already exists for this event' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create ticket type' 
      });
    }
  }
});

// Update ticket type
router.put('/:eventId/:category', requireAuth, async (req, res) => {
  try {
    const { eventId, category } = req.params;
    const { new_category, price } = req.body;
    
    // Check if user owns the event
    const ticketCheck = await pool.query(`
      SELECT 
        tt.*, 
        e.organizer_id,
        COUNT(t.ticket_id) as sold_quantity
      FROM ticket_types tt
      JOIN events e ON tt.event_id = e.event_id
      LEFT JOIN tickets t ON tt.event_id = t.event_id AND tt.category = t.category
      WHERE tt.event_id = $1 AND tt.category = $2
      GROUP BY tt.event_id, tt.category, tt.price, e.organizer_id
    `, [eventId, category]);
    
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket type not found' 
      });
    }
    
    const ticket = ticketCheck.rows[0];
    
    if (ticket.organizer_id !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    // Update ticket type (category and/or price)
    const updateCategory = new_category || category;
    const updatePrice = price !== undefined ? price : ticket.price;
    
    const result = await pool.query(
      'UPDATE ticket_types SET category = $1, price = $2 WHERE event_id = $3 AND category = $4 RETURNING *',
      [updateCategory, updatePrice, eventId, category]
    );
    
    // If category changed, also update tickets table
    if (new_category && new_category !== category) {
      await pool.query(
        'UPDATE tickets SET category = $1 WHERE event_id = $2 AND category = $3',
        [new_category, eventId, category]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Ticket type updated successfully',
      ticket: result.rows[0] 
    });
  } catch (error) {
    console.error('Update ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update ticket type' 
    });
  }
});

// Delete ticket type
router.delete('/:eventId/:category', requireAuth, async (req, res) => {
  try {
    const { eventId, category } = req.params;
    
    // Check if user owns the event and if ticket has sales
    const ticketCheck = await pool.query(`
      SELECT 
        tt.*, 
        e.organizer_id,
        COUNT(t.ticket_id) as sold_quantity
      FROM ticket_types tt
      JOIN events e ON tt.event_id = e.event_id
      LEFT JOIN tickets t ON tt.event_id = t.event_id AND tt.category = t.category
      WHERE tt.event_id = $1 AND tt.category = $2
      GROUP BY tt.event_id, tt.category, tt.price, e.organizer_id
    `, [eventId, category]);
    
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket type not found' 
      });
    }
    
    const ticket = ticketCheck.rows[0];
    
    if (ticket.organizer_id !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    if (parseInt(ticket.sold_quantity) > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete ticket type with existing sales' 
      });
    }
    
    await pool.query(
      'DELETE FROM ticket_types WHERE event_id = $1 AND category = $2',
      [eventId, category]
    );
    
    res.json({ 
      success: true, 
      message: 'Ticket type deleted successfully' 
    });
  } catch (error) {
    console.error('Delete ticket error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete ticket type' 
    });
  }
});

// Get ticket type sales statistics
router.get('/:eventId/:category/stats', requireAuth, async (req, res) => {
  try {
    const { eventId, category } = req.params;
    
    // Check if user owns the event
    const ticketCheck = await pool.query(`
      SELECT 
        tt.*, 
        e.organizer_id, 
        e.title as event_title,
        COUNT(t.ticket_id) as sold_quantity
      FROM ticket_types tt
      JOIN events e ON tt.event_id = e.event_id
      LEFT JOIN tickets t ON tt.event_id = t.event_id AND tt.category = t.category
      WHERE tt.event_id = $1 AND tt.category = $2
      GROUP BY tt.event_id, tt.category, tt.price, e.organizer_id, e.title
    `, [eventId, category]);
    
    if (ticketCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Ticket type not found' 
      });
    }
    
    const ticket = ticketCheck.rows[0];
    
    if (ticket.organizer_id !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    // Get booking statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT b.booking_id) as total_bookings,
        COUNT(t.ticket_id) as total_tickets_sold,
        SUM(bi.price_at_purchase * bi.quantity) as total_revenue,
        AVG(bi.price_at_purchase) as average_price
      FROM tickets t
      JOIN booking_items bi ON t.ticket_id = bi.ticket_id
      JOIN bookings b ON bi.booking_id = b.booking_id
      WHERE t.event_id = $1 AND t.category = $2 AND b.status = 'confirmed'
    `, [eventId, category]);
    
    const stats = {
      ticket: {
        event_id: ticket.event_id,
        event_title: ticket.event_title,
        category: ticket.category,
        price: ticket.price,
        sold_quantity: ticket.sold_quantity
      },
      sales: statsResult.rows[0]
    };
    
    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Get ticket stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch ticket statistics' 
    });
  }
});

module.exports = router;