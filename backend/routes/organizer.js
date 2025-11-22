const express = require('express');
const pool = require('../config/database');
const { requireAuth, requireOrganizerOrAdmin } = require('../middleware/auth');

const router = express.Router();

// Get organizer's events
router.get('/:id/events', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is the organizer or admin
    if (parseInt(id) !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    const result = await pool.query(`
      SELECT 
        e.*,
        v.name as venue_name,
        v.city as venue_city,
        c.name as category_name,
        COUNT(DISTINCT t.ticket_id) as total_tickets_sold,
        COALESCE(SUM(bi.price_at_purchase * bi.quantity), 0) as total_revenue,
        COUNT(DISTINCT b.booking_id) as total_bookings
      FROM events e
      JOIN venues v ON e.venue_id = v.venue_id
      JOIN categories c ON e.category_id = c.category_id
      LEFT JOIN tickets t ON e.event_id = t.event_id
      LEFT JOIN booking_items bi ON t.ticket_id = bi.ticket_id
      LEFT JOIN bookings b ON bi.booking_id = b.booking_id AND b.status = 'confirmed'
      WHERE e.organizer_id = $1
      GROUP BY e.event_id, v.name, v.city, c.name
      ORDER BY e.start_date DESC
    `, [id]);
    
    res.json({ 
      success: true, 
      events: result.rows 
    });
  } catch (error) {
    console.error('Get organizer events error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch organizer events' 
    });
  }
});

// Get attendees for all organizer's events
router.get('/:id/attendees', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is the organizer or admin
    if (parseInt(id) !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    const result = await pool.query(`
      SELECT 
        e.event_id,
        e.title as event_title,
        e.start_date,
        u.name as attendee_name,
        u.email as attendee_email,
        u.phone as attendee_phone,
        t.category as ticket_type,
        bi.quantity,
        bi.price_at_purchase,
        bi.quantity * bi.price_at_purchase as total_amount,
        b.booking_date,
        p.status as payment_status,
        p.payment_method
      FROM events e
      JOIN tickets t ON e.event_id = t.event_id
      JOIN booking_items bi ON t.ticket_id = bi.ticket_id
      JOIN bookings b ON bi.booking_id = b.booking_id
      JOIN users u ON b.user_id = u.user_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE e.organizer_id = $1 AND b.status = 'confirmed'
      ORDER BY e.start_date DESC, b.booking_date DESC
    `, [id]);
    
    res.json({ 
      success: true, 
      attendees: result.rows 
    });
  } catch (error) {
    console.error('Get organizer attendees error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch attendees' 
    });
  }
});

// Get attendees for a specific event
router.get('/:id/events/:eventId/attendees', requireAuth, async (req, res) => {
  try {
    const { id, eventId } = req.params;
    
    // Check if user is the organizer of this event or admin
    const eventCheck = await pool.query(
      'SELECT organizer_id FROM events WHERE event_id = $1',
      [eventId]
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
    
    const result = await pool.query(`
      SELECT 
        e.title as event_title,
        e.start_date,
        e.end_date,
        u.name as attendee_name,
        u.email as attendee_email,
        u.phone as attendee_phone,
        t.category as ticket_type,
        tt.price as ticket_price,
        b.booking_id,
        bi.quantity,
        bi.price_at_purchase,
        bi.quantity * bi.price_at_purchase as total_amount,
        b.booking_date,
        b.status as booking_status,
        p.status as payment_status,
        p.payment_method,
        p.payment_date
      FROM events e
      JOIN tickets t ON e.event_id = t.event_id
      JOIN ticket_types tt ON t.event_id = tt.event_id AND t.category = tt.category
      JOIN booking_items bi ON t.ticket_id = bi.ticket_id
      JOIN bookings b ON bi.booking_id = b.booking_id
      JOIN users u ON b.user_id = u.user_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE e.event_id = $1 AND b.status = 'confirmed'
      ORDER BY b.booking_date DESC
    `, [eventId]);
    
    res.json({ 
      success: true, 
      attendees: result.rows 
    });
  } catch (error) {
    console.error('Get event attendees error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch event attendees' 
    });
  }
});

// Get organizer dashboard statistics
router.get('/:id/stats', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user is the organizer or admin
    if (parseInt(id) !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }

    const overallStats = await pool.query(`
      SELECT 
        COUNT(DISTINCT e.event_id) as total_events,
        COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.event_id END) as active_events,
        COUNT(DISTINCT CASE WHEN e.status = 'completed' THEN e.event_id END) as completed_events,
        COUNT(DISTINCT b.booking_id) as total_bookings,
        COUNT(DISTINCT t.ticket_id) as total_tickets_sold,
        COALESCE(SUM(bi.price_at_purchase * bi.quantity), 0) as total_revenue,
        COALESCE(AVG(r.rating), 0) as average_rating,
        COUNT(DISTINCT r.review_id) as total_reviews
      FROM events e
      LEFT JOIN tickets t ON e.event_id = t.event_id
      LEFT JOIN booking_items bi ON t.ticket_id = bi.ticket_id
      LEFT JOIN bookings b ON bi.booking_id = b.booking_id AND b.status = 'confirmed'
      LEFT JOIN reviews r ON e.event_id = r.event_id
      WHERE e.organizer_id = $1
    `, [id]);
    

    
    // Get upcoming events
    const upcomingEvents = await pool.query(`
      SELECT 
        e.event_id,
        e.title,
        e.start_date,
        e.end_date,
        v.name as venue_name,
        COUNT(DISTINCT t.ticket_id) as tickets_sold
      FROM events e
      JOIN venues v ON e.venue_id = v.venue_id
      LEFT JOIN tickets t ON e.event_id = t.event_id
      WHERE e.organizer_id = $1 AND e.start_date > NOW() AND e.status = 'active'
      GROUP BY e.event_id, v.name
      ORDER BY e.start_date ASC
      LIMIT 5
    `, [id]);
    
    // Get recent bookings
    const recentBookings = await pool.query(`
      SELECT 
        b.booking_id,
        b.booking_date,
        SUM(bi.quantity) as quantity,
        SUM(bi.price_at_purchase * bi.quantity) as total_amount,
        e.title as event_title,
        u.name as attendee_name,
        STRING_AGG(DISTINCT t.category, ', ') as ticket_types
      FROM bookings b
      JOIN booking_items bi ON b.booking_id = bi.booking_id
      JOIN tickets t ON bi.ticket_id = t.ticket_id
      JOIN events e ON t.event_id = e.event_id
      JOIN users u ON b.user_id = u.user_id
      WHERE e.organizer_id = $1 AND b.status = 'confirmed'
      GROUP BY b.booking_id, b.booking_date, e.title, u.name
      ORDER BY b.booking_date DESC
      LIMIT 10
    `, [id]);
    
    // Get monthly revenue for the last 12 months
    const monthlyRevenue = await pool.query(`
      SELECT 
        DATE_TRUNC('month', b.booking_date) as month,
        COALESCE(SUM(bi.price_at_purchase * bi.quantity), 0) as revenue,
        COUNT(DISTINCT b.booking_id) as bookings
      FROM bookings b
      JOIN booking_items bi ON b.booking_id = bi.booking_id
      JOIN tickets t ON bi.ticket_id = t.ticket_id
      JOIN events e ON t.event_id = e.event_id
      WHERE e.organizer_id = $1 
        AND b.status = 'confirmed'
        AND b.booking_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '11 months')
      GROUP BY DATE_TRUNC('month', b.booking_date)
      ORDER BY month DESC
    `, [id]);
    
    const stats = {
      overall: overallStats.rows[0],
      upcoming_events: upcomingEvents.rows,
      recent_bookings: recentBookings.rows,
      monthly_revenue: monthlyRevenue.rows
    };
    
    res.json({ 
      success: true, 
      stats 
    });
  } catch (error) {
    console.error('Get organizer stats error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch organizer statistics' 
    });
  }
});

// Get revenue breakdown by event
router.get('/:id/revenue', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { start_date, end_date } = req.query;
    
    // Check if user is the organizer or admin
    if (parseInt(id) !== req.session.user.user_id && req.session.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        message: 'Access denied' 
      });
    }
    
    let dateCondition = '';
    const values = [id];
    let paramCount = 1;
    
    if (start_date && end_date) {
      dateCondition = `AND e.start_date BETWEEN $${++paramCount} AND $${++paramCount}`;
      values.push(start_date, end_date);
    }
    
    const result = await pool.query(`
      SELECT 
        e.event_id,
        e.title as event_title,
        e.start_date,
        e.end_date,
        e.status,
        v.name as venue_name,
        COALESCE(SUM(bi.price_at_purchase * bi.quantity), 0) as total_revenue,
        COUNT(DISTINCT b.booking_id) as total_bookings,
        COUNT(DISTINCT t.ticket_id) as total_tickets_sold,
        (
          SELECT JSON_AGG(
            JSON_BUILD_OBJECT(
              'ticket_category', tt.category,
              'ticket_price', tt.price,
              'sold_quantity', (
                SELECT COUNT(t2.ticket_id)
                FROM tickets t2
                WHERE t2.event_id = tt.event_id AND t2.category = tt.category
              ),
              'revenue', COALESCE((
                SELECT SUM(bi2.price_at_purchase * bi2.quantity)
                FROM tickets t2
                JOIN booking_items bi2 ON t2.ticket_id = bi2.ticket_id
                JOIN bookings b2 ON bi2.booking_id = b2.booking_id
                WHERE t2.event_id = tt.event_id AND t2.category = tt.category AND b2.status = 'confirmed'
              ), 0)
            )
          )
          FROM ticket_types tt
          WHERE tt.event_id = e.event_id
        ) as ticket_breakdown
      FROM events e
      JOIN venues v ON e.venue_id = v.venue_id
      LEFT JOIN tickets t ON e.event_id = t.event_id
      LEFT JOIN booking_items bi ON t.ticket_id = bi.ticket_id
      LEFT JOIN bookings b ON bi.booking_id = b.booking_id AND b.status = 'confirmed'
      WHERE e.organizer_id = $1 ${dateCondition}
      GROUP BY e.event_id, v.name
      ORDER BY total_revenue DESC
    `, values);
    
    res.json({ 
      success: true, 
      revenue_breakdown: result.rows 
    });
  } catch (error) {
    console.error('Get organizer revenue error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch revenue breakdown' 
    });
  }
});

module.exports = router;