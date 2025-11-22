const express = require('express');
const pool = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all venues
router.get('/', async (req, res) => {
  try {
    const { city, capacity_min, capacity_max, search } = req.query;
    
    let query = 'SELECT * FROM venues';
    const conditions = [];
    const values = [];
    let paramCount = 0;
    
    if (city) {
      conditions.push(`city ILIKE $${++paramCount}`);
      values.push(`%${city}%`);
    }
    
    if (capacity_min) {
      conditions.push(`capacity >= $${++paramCount}`);
      values.push(capacity_min);
    }
    
    if (capacity_max) {
      conditions.push(`capacity <= $${++paramCount}`);
      values.push(capacity_max);
    }
    
    if (search) {
      conditions.push(`(name ILIKE $${++paramCount} OR address ILIKE $${paramCount})`);
      values.push(`%${search}%`);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY name ASC';
    
    const result = await pool.query(query, values);
    
    res.json({ 
      success: true, 
      venues: result.rows 
    });
  } catch (error) {
    console.error('Get venues error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch venues' 
    });
  }
});

// Get venue by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM venues WHERE venue_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
      });
    }
    
    // Get upcoming events at this venue
    const eventsResult = await pool.query(`
      SELECT 
        e.event_id,
        e.title,
        e.start_date,
        e.end_date,
        u.name as organizer_name
      FROM events e
      JOIN users u ON e.organizer_id = u.user_id
      WHERE e.venue_id = $1 AND e.start_date > NOW() AND e.status = 'active'
      ORDER BY e.start_date ASC
      LIMIT 10
    `, [id]);
    
    const venue = {
      ...result.rows[0],
      upcoming_events: eventsResult.rows
    };
    
    res.json({ 
      success: true, 
      venue 
    });
  } catch (error) {
    console.error('Get venue error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch venue' 
    });
  }
});

// Create venue (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, address, city, capacity, contact_info } = req.body;
    
    if (!name || !address || !city || !capacity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, address, city, and capacity are required' 
      });
    }
    
    if (capacity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Capacity must be greater than 0' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, address, city, capacity, contact_info]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Venue created successfully',
      venue: result.rows[0] 
    });
  } catch (error) {
    console.error('Create venue error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ 
        success: false, 
        message: 'A venue with this name and address already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create venue' 
      });
    }
  }
});

// Update venue (admin only)
router.put('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, address, city, capacity, contact_info } = req.body;
    
    if (!name || !address || !city || !capacity) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, address, city, and capacity are required' 
      });
    }
    
    if (capacity <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Capacity must be greater than 0' 
      });
    }
    
    const result = await pool.query(
      'UPDATE venues SET name = $1, address = $2, city = $3, capacity = $4, contact_info = $5 WHERE venue_id = $6 RETURNING *',
      [name, address, city, capacity, contact_info, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Venue updated successfully',
      venue: result.rows[0] 
    });
  } catch (error) {
    console.error('Update venue error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ 
        success: false, 
        message: 'A venue with this name and address already exists' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update venue' 
      });
    }
  }
});

// Delete venue (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if venue has any events
    const eventsCheck = await pool.query(
      'SELECT COUNT(*) FROM events WHERE venue_id = $1',
      [id]
    );
    
    if (parseInt(eventsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot delete venue with existing events' 
      });
    }
    
    const result = await pool.query(
      'DELETE FROM venues WHERE venue_id = $1 RETURNING venue_id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Venue deleted successfully' 
    });
  } catch (error) {
    console.error('Delete venue error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete venue' 
    });
  }
});

// Get venue statistics (admin only)
router.get('/:id/stats', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if venue exists
    const venueCheck = await pool.query(
      'SELECT * FROM venues WHERE venue_id = $1',
      [id]
    );
    
    if (venueCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Venue not found' 
      });
    }
    
    const venue = venueCheck.rows[0];
    
    // Get venue statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(DISTINCT e.event_id) as total_events,
        COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.event_id END) as active_events,
        COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.event_id END) as completed_events,
        COUNT(DISTINCT CASE WHEN e.status = 'cancelled' THEN e.event_id END) as cancelled_events,
        COUNT(DISTINCT t.ticket_id) as total_tickets_sold,
        COALESCE(SUM(bi.price_at_purchase * bi.quantity), 0) as total_revenue
      FROM events e
      LEFT JOIN tickets t ON e.event_id = t.event_id
      LEFT JOIN booking_items bi ON t.ticket_id = bi.ticket_id
      LEFT JOIN bookings b ON bi.booking_id = b.booking_id AND b.status = 'confirmed'
      WHERE e.venue_id = $1
    `, [id]);
    
    // Get upcoming events
    const upcomingResult = await pool.query(`
      SELECT 
        e.event_id,
        e.title,
        e.start_date,
        e.end_date,
        u.name as organizer_name,
        COUNT(DISTINCT t.ticket_id) as tickets_sold
      FROM events e
      JOIN users u ON e.organizer_id = u.user_id
      LEFT JOIN tickets t ON e.event_id = t.event_id
      WHERE e.venue_id = $1 AND e.start_date > NOW() AND e.status = 'active'
      GROUP BY e.event_id, e.title, e.start_date, e.end_date, u.name
      ORDER BY e.start_date ASC
      LIMIT 5
    `, [id]);
    
    const stats = {
      venue,
      statistics: statsResult.rows[0],
      upcoming_events: upcomingResult.rows
    };
    
    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Get venue stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch venue statistics' 
    });
  }
});

// Get cities with venues
router.get('/cities/list', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT DISTINCT city FROM venues ORDER BY city ASC'
    );
    
    res.json({ 
      success: true, 
      cities: result.rows.map(row => row.city)
    });
  } catch (error) {
    console.error('Get cities error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch cities' 
    });
  }
});

module.exports = router;