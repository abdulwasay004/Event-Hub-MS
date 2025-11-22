const express = require('express');
const pool = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get reviews for an event
router.get('/event/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    const result = await pool.query(`
      SELECT 
        r.*,
        u.name as reviewer_name
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      WHERE r.event_id = $1
      ORDER BY r.review_date DESC
    `, [eventId]);
    
    res.json({ 
      success: true, 
      reviews: result.rows 
    });
  } catch (error) {
    console.error('Get event reviews error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reviews' 
    });
  }
});

// Get user's reviews
router.get('/user', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        r.*,
        e.title as event_title,
        e.start_date
      FROM reviews r
      JOIN events e ON r.event_id = e.event_id
      WHERE r.user_id = $1
      ORDER BY r.review_date DESC
    `, [req.session.user.user_id]);
    
    res.json({ 
      success: true, 
      reviews: result.rows 
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user reviews' 
    });
  }
});

// Get review by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        r.*,
        u.name as reviewer_name,
        e.title as event_title
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN events e ON r.event_id = e.event_id
      WHERE r.review_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }
    
    res.json({ 
      success: true, 
      review: result.rows[0] 
    });
  } catch (error) {
    console.error('Get review error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch review' 
    });
  }
});

// Create review
router.post('/', requireAuth, async (req, res) => {
  try {
    const { event_id, rating, comment } = req.body;
    
    if (!event_id || !rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event ID and rating are required' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }
    
    // Check if user has attended the event
    const bookingCheck = await pool.query(
      'SELECT booking_id FROM bookings WHERE user_id = $1 AND event_id = $2 AND status = $3',
      [req.session.user.user_id, event_id, 'confirmed']
    );
    
    if (bookingCheck.rows.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only review events you have attended' 
      });
    }
    
    // Check if event has ended
    const eventCheck = await pool.query(
      'SELECT end_date FROM events WHERE event_id = $1',
      [event_id]
    );
    
    if (eventCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Event not found' 
      });
    }
    
    const eventEndDate = new Date(eventCheck.rows[0].end_date);
    if (eventEndDate > new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'You can only review events that have ended' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO reviews (user_id, event_id, rating, comment) VALUES ($1, $2, $3, $4) RETURNING *',
      [req.session.user.user_id, event_id, rating, comment]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Review created successfully',
      review: result.rows[0] 
    });
  } catch (error) {
    console.error('Create review error:', error);
    if (error.code === '23505') { // Unique constraint violation
      res.status(400).json({ 
        success: false, 
        message: 'You have already reviewed this event' 
      });
    } else {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to create review' 
      });
    }
  }
});

// Update review
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;
    
    if (!rating) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating is required' 
      });
    }
    
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ 
        success: false, 
        message: 'Rating must be between 1 and 5' 
      });
    }
    
    // Check if user owns this review
    const reviewCheck = await pool.query(
      'SELECT user_id FROM reviews WHERE review_id = $1',
      [id]
    );
    
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }
    
    if (reviewCheck.rows[0].user_id !== req.session.user.user_id) {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    const result = await pool.query(
      'UPDATE reviews SET rating = $1, comment = $2 WHERE review_id = $3 RETURNING *',
      [rating, comment, id]
    );
    
    res.json({ 
      success: true, 
      message: 'Review updated successfully',
      review: result.rows[0] 
    });
  } catch (error) {
    console.error('Update review error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update review' 
    });
  }
});

// Delete review
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user owns this review or is admin
    const reviewCheck = await pool.query(
      'SELECT user_id FROM reviews WHERE review_id = $1',
      [id]
    );
    
    if (reviewCheck.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Review not found' 
      });
    }
    
    if (reviewCheck.rows[0].user_id !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    await pool.query('DELETE FROM reviews WHERE review_id = $1', [id]);
    
    res.json({ 
      success: true, 
      message: 'Review deleted successfully' 
    });
  } catch (error) {
    console.error('Delete review error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete review' 
    });
  }
});

// Get all reviews (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, event_id, user_id } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        r.*,
        u.name as reviewer_name,
        u.email as reviewer_email,
        e.title as event_title
      FROM reviews r
      JOIN users u ON r.user_id = u.user_id
      JOIN events e ON r.event_id = e.event_id
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 0;
    
    if (event_id) {
      conditions.push(`r.event_id = $${++paramCount}`);
      values.push(event_id);
    }
    
    if (user_id) {
      conditions.push(`r.user_id = $${++paramCount}`);
      values.push(user_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` ORDER BY r.review_date DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count
    let countQuery = 'SELECT COUNT(*) FROM reviews r';
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({ 
      success: true, 
      reviews: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all reviews error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch reviews' 
    });
  }
});

module.exports = router;