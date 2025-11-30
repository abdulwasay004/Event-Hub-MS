const express = require('express');
const pool = require('../config/database');
const { requireAuth, requireAdmin } = require('../middleware/auth');

const router = express.Router();

// Get user's payments
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        p.*,
        b.booking_id,
        b.quantity,
        b.total_amount as booking_amount,
        e.title as event_title,
        e.start_date,
        t.category as ticket_category
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN events e ON b.event_id = e.event_id
      JOIN tickets t ON b.ticket_id = t.ticket_id
      WHERE b.user_id = $1
      ORDER BY p.payment_date DESC
    `, [req.session.user.user_id]);
    
    res.json({ 
      success: true, 
      payments: result.rows 
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payments' 
    });
  }
});

// Get payment by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        p.*,
        b.booking_id,
        b.user_id,
        b.quantity,
        b.total_amount as booking_amount,
        b.booking_date,
        b.status as booking_status,
        e.title as event_title,
        e.start_date,
        e.end_date,
        t.category as ticket_category,
        t.price as ticket_price,
        v.name as venue_name,
        u.name as attendee_name,
        u.email as attendee_email
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN events e ON b.event_id = e.event_id
      JOIN tickets t ON b.ticket_id = t.ticket_id
      JOIN venues v ON e.venue_id = v.venue_id
      JOIN users u ON b.user_id = u.user_id
      WHERE p.payment_id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    const payment = result.rows[0];
    
    // Check if user owns this payment or is admin
    if (payment.user_id !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    res.json({ 
      success: true, 
      payment 
    });
  } catch (error) {
    console.error('Get payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment' 
    });
  }
});

// Get all payments (admin only)
router.get('/admin/all', requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, status, payment_method, event_id } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT 
        p.*,
        b.booking_id,
        SUM(bi.quantity) as quantity,
        SUM(bi.price_at_purchase * bi.quantity) as booking_amount,
        e.title as event_title,
        e.start_date,
        string_agg(DISTINCT t.category, ', ') as ticket_category,
        u.name as attendee_name,
        u.email as attendee_email,
        org.name as organizer_name
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN booking_items bi ON b.booking_id = bi.booking_id
      JOIN tickets t ON bi.ticket_id = t.ticket_id
      JOIN events e ON t.event_id = e.event_id
      JOIN users u ON b.user_id = u.user_id
      JOIN users org ON e.organizer_id = org.user_id
    `;
    
    const conditions = [];
    const values = [];
    let paramCount = 0;
    
    if (status) {
      conditions.push(`p.status = $${++paramCount}`);
      values.push(status);
    }
    
    if (payment_method) {
      conditions.push(`p.payment_method = $${++paramCount}`);
      values.push(payment_method);
    }
    
    if (event_id) {
      conditions.push(`e.event_id = $${++paramCount}`);
      values.push(event_id);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ` 
      GROUP BY p.payment_id, b.booking_id, e.title, e.start_date, u.name, u.email, org.name
      ORDER BY p.payment_date DESC 
      LIMIT $${++paramCount} OFFSET $${++paramCount}
    `;
    values.push(limit, offset);
    
    const result = await pool.query(query, values);
    
    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT p.payment_id) 
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN booking_items bi ON b.booking_id = bi.booking_id
      JOIN tickets t ON bi.ticket_id = t.ticket_id
      JOIN events e ON t.event_id = e.event_id
    `;
    
    if (conditions.length > 0) {
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }
    
    const countResult = await pool.query(countQuery, values.slice(0, -2));
    const totalCount = parseInt(countResult.rows[0].count);
    
    res.json({ 
      success: true, 
      payments: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: totalCount,
        pages: Math.ceil(totalCount / limit)
      }
    });
  } catch (error) {
    console.error('Get all payments error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payments' 
    });
  }
});

// Update payment status (admin only)
router.put('/:id/status', requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!['pending', 'completed', 'failed', 'refunded'].includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid payment status' 
      });
    }
    
    const result = await pool.query(
      'UPDATE payments SET payment_status = $1 WHERE payment_id = $2 RETURNING *',
      [status, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    // If payment is being refunded, update booking status
    if (status === 'refunded') {
      await pool.query(
        'UPDATE bookings SET status = $1 WHERE booking_id = $2',
        ['refunded', result.rows[0].booking_id]
      );
    }
    
    res.json({ 
      success: true, 
      message: 'Payment status updated successfully',
      payment: result.rows[0] 
    });
  } catch (error) {
    console.error('Update payment status error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to update payment status' 
    });
  }
});

// Process refund (admin only)
router.post('/:id/refund', requireAdmin, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    const { reason } = req.body;
    
    // Get payment details
    const paymentResult = await client.query(`
      SELECT 
        p.*,
        b.user_id,
        b.booking_id,
        b.quantity,
        b.ticket_id,
        e.title as event_title
      FROM payments p
      JOIN bookings b ON p.booking_id = b.booking_id
      JOIN events e ON b.event_id = e.event_id
      WHERE p.payment_id = $1
    `, [id]);
    
    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Payment not found' 
      });
    }
    
    const payment = paymentResult.rows[0];
    
    if (payment.payment_status === 'refunded') {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment has already been refunded' 
      });
    }
    
    // Update payment status
    await client.query(
      'UPDATE payments SET payment_status = $1 WHERE payment_id = $2',
      ['refunded', id]
    );
    
    // Update booking status
    await client.query(
      'UPDATE bookings SET status = $1 WHERE booking_id = $2',
      ['refunded', payment.booking_id]
    );
    
    // Create notification
    const notificationMessage = reason 
      ? `Your payment for "${payment.event_title}" has been refunded. Reason: ${reason}`
      : `Your payment for "${payment.event_title}" has been refunded.`;
    
    await client.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [payment.user_id, notificationMessage]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Refund processed successfully' 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Process refund error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to process refund' 
    });
  } finally {
    client.release();
  }
});

// Get payment statistics (admin only)
router.get('/admin/stats', requireAdmin, async (req, res) => {
  try {
    const { start_date, end_date } = req.query;
    
    let dateCondition = '';
    const values = [];
    let paramCount = 0;
    
    if (start_date && end_date) {
      dateCondition = `WHERE p.payment_date BETWEEN $${++paramCount} AND $${++paramCount}`;
      values.push(start_date, end_date);
    } else if (start_date) {
      dateCondition = `WHERE p.payment_date >= $${++paramCount}`;
      values.push(start_date);
    } else if (end_date) {
      dateCondition = `WHERE p.payment_date <= $${++paramCount}`;
      values.push(end_date);
    }
    
    // Get overall statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_payments,
        COUNT(CASE WHEN payment_status = 'completed' THEN 1 END) as completed_payments,
        COUNT(CASE WHEN payment_status = 'pending' THEN 1 END) as pending_payments,
        COUNT(CASE WHEN payment_status = 'failed' THEN 1 END) as failed_payments,
        COUNT(CASE WHEN payment_status = 'refunded' THEN 1 END) as refunded_payments,
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN amount END), 0) as total_revenue,
        COALESCE(SUM(CASE WHEN payment_status = 'refunded' THEN amount END), 0) as total_refunded,
        COALESCE(AVG(CASE WHEN payment_status = 'completed' THEN amount END), 0) as average_payment
      FROM payments p
      ${dateCondition}
    `, values);
    
    // Get payment methods breakdown
    const methodsResult = await pool.query(`
      SELECT 
        payment_method,
        COUNT(*) as count,
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN amount END), 0) as revenue
      FROM payments p
      ${dateCondition}
      GROUP BY payment_method
      ORDER BY revenue DESC
    `, values);
    
    // Get daily revenue for the last 30 days
    const dailyResult = await pool.query(`
      SELECT 
        DATE(payment_date) as date,
        COUNT(*) as payment_count,
        COALESCE(SUM(CASE WHEN payment_status = 'completed' THEN amount END), 0) as daily_revenue
      FROM payments p
      WHERE payment_date >= CURRENT_DATE - INTERVAL '30 days'
      GROUP BY DATE(payment_date)
      ORDER BY date DESC
    `);
    
    const stats = {
      overview: statsResult.rows[0],
      payment_methods: methodsResult.rows,
      daily_revenue: dailyResult.rows
    };
    
    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Get payment stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch payment statistics' 
    });
  }
});

module.exports = router;