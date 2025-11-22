const express = require('express');
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

// Get user's notifications
router.get('/', requireAuth, async (req, res) => {
  try {
    const { unread_only = false, limit = 50 } = req.query;
    
    let query = 'SELECT * FROM notifications WHERE user_id = $1';
    const values = [req.session.user.user_id];
    
    if (unread_only === 'true') {
      query += ' AND is_read = false';
    }
    
    query += ` ORDER BY created_at DESC LIMIT $2`;
    values.push(limit);
    
    const result = await pool.query(query, values);
    
    res.json({ 
      success: true, 
      notifications: result.rows 
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notifications' 
    });
  }
});

// Get notification by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'SELECT * FROM notifications WHERE notification_id = $1 AND user_id = $2',
      [id, req.session.user.user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    
    res.json({ 
      success: true, 
      notification: result.rows[0] 
    });
  } catch (error) {
    console.error('Get notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch notification' 
    });
  }
});

// Mark notification as read
router.put('/:id/read', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE notification_id = $1 AND user_id = $2 RETURNING *',
      [id, req.session.user.user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Notification marked as read',
      notification: result.rows[0] 
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark notification as read' 
    });
  }
});

// Mark all notifications as read
router.put('/read/all', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'UPDATE notifications SET is_read = true WHERE user_id = $1 AND is_read = false RETURNING COUNT(*)',
      [req.session.user.user_id]
    );
    
    res.json({ 
      success: true, 
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to mark all notifications as read' 
    });
  }
});

// Delete notification
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(
      'DELETE FROM notifications WHERE notification_id = $1 AND user_id = $2 RETURNING notification_id',
      [id, req.session.user.user_id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Notification not found' 
      });
    }
    
    res.json({ 
      success: true, 
      message: 'Notification deleted successfully' 
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete notification' 
    });
  }
});

// Create notification (for system use - could be used by admins)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { user_id, message } = req.body;
    
    if (!user_id || !message) {
      return res.status(400).json({ 
        success: false, 
        message: 'User ID and message are required' 
      });
    }
    
    // Only admin can create notifications for other users
    if (user_id !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    const result = await pool.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2) RETURNING *',
      [user_id, message]
    );
    
    res.status(201).json({ 
      success: true, 
      message: 'Notification created successfully',
      notification: result.rows[0] 
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create notification' 
    });
  }
});

// Get unread count
router.get('/count/unread', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [req.session.user.user_id]
    );
    
    res.json({ 
      success: true, 
      unread_count: parseInt(result.rows[0].count)
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch unread count' 
    });
  }
});

// Delete all read notifications
router.delete('/read/all', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM notifications WHERE user_id = $1 AND is_read = true RETURNING COUNT(*)',
      [req.session.user.user_id]
    );
    
    res.json({ 
      success: true, 
      message: 'All read notifications deleted successfully'
    });
  } catch (error) {
    console.error('Delete all read notifications error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to delete read notifications' 
    });
  }
});

module.exports = router;