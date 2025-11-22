const express = require('express');
const pool = require('../config/database');
const { requireAuth, requireAdmin, requireOwnerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, name, email, phone, role, date_created FROM users ORDER BY date_created DESC'
    );
    
    res.json({ 
      success: true, 
      users: result.rows 
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch users' 
    });
  }
});

// Get user by ID
router.get('/:id', requireOwnerOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT user_id, name, email, phone, role, date_created FROM users WHERE user_id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user' 
    });
  }
});

// Update user
router.put('/:id', requireOwnerOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone } = req.body;
    
    if (!name || !email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name and email are required' 
      });
    }
    
    // Check if email is taken by another user
    const emailCheck = await pool.query(
      'SELECT user_id FROM users WHERE email = $1 AND user_id != $2',
      [email, id]
    );
    
    if (emailCheck.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is already taken' 
      });
    }
    
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, phone = $3 WHERE user_id = $4 RETURNING user_id, name, email, phone, role, date_created',
      [name, email, phone, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Update session if user is updating their own profile
    if (req.session.user.user_id === parseInt(id)) {
      req.session.user = { ...req.session.user, ...result.rows[0] };
    }
    
    res.json({ 
      success: true, 
      message: 'User updated successfully',
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user' 
    });
  }
});

// Update user role (admin only)
router.put('/:id/role', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!['admin', 'organizer', 'attendee'].includes(role)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid role' 
      });
    }
    
    const result = await pool.query(
      'UPDATE users SET role = $1 WHERE user_id = $2 RETURNING user_id, name, email, phone, role, date_created',
      [role, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'User role updated successfully',
      user: result.rows[0] 
    });
  } catch (error) {
    console.error('Update user role error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update user role' 
    });
  }
});

// Delete user (admin only)
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM users WHERE user_id = $1 RETURNING user_id',
      [id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'User deleted successfully' 
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete user' 
    });
  }
});

// Get user's bookings
router.get('/:id/bookings', requireOwnerOrAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.quantity,
        b.booking_date,
        b.total_amount,
        b.status,
        e.title as event_title,
        e.start_date,
        t.category as ticket_category,
        t.price as ticket_price,
        v.name as venue_name,
        p.status as payment_status
      FROM bookings b
      JOIN events e ON b.event_id = e.event_id
      JOIN tickets t ON b.ticket_id = t.ticket_id
      JOIN venues v ON e.venue_id = v.venue_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE b.user_id = $1
      ORDER BY b.booking_date DESC
    `, [id]);
    
    res.json({ 
      success: true, 
      bookings: result.rows 
    });
  } catch (error) {
    console.error('Get user bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch user bookings' 
    });
  }
});

module.exports = router;