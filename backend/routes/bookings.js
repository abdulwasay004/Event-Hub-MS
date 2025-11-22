const express = require('express');
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const { sendBookingConfirmation } = require('../services/emailService');

const router = express.Router();

// Get all bookings for current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        b.booking_id,
        b.booking_date,
        b.status,
        e.event_id,
        e.title as event_title,
        e.start_date,
        e.end_date,
        v.name as venue_name,
        v.city as venue_city,
        p.status as payment_status,
        p.payment_method,
        p.amount as payment_amount,
        COALESCE(SUM(bi.quantity * bi.price_at_purchase), 0) as total_amount,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'ticket_id', t.ticket_id,
            'category', t.category,
            'quantity', bi.quantity,
            'price', bi.price_at_purchase
          )
        ) as items
      FROM bookings b
      JOIN booking_items bi ON b.booking_id = bi.booking_id
      JOIN tickets t ON bi.ticket_id = t.ticket_id
      JOIN events e ON t.event_id = e.event_id
      JOIN venues v ON e.venue_id = v.venue_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE b.user_id = $1
      GROUP BY b.booking_id, e.event_id, e.title, e.start_date, e.end_date, 
               v.name, v.city, p.status, p.payment_method, p.amount
      ORDER BY b.booking_date DESC
    `, [req.session.user.user_id]);
    
    res.json({ 
      success: true, 
      bookings: result.rows 
    });
  } catch (error) {
    console.error('Get bookings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch bookings' 
    });
  }
});

// Get booking by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query(`
      SELECT 
        b.*,
        e.event_id,
        e.title as event_title,
        e.start_date,
        e.end_date,
        e.description as event_description,
        v.name as venue_name,
        v.address as venue_address,
        v.city as venue_city,
        u.name as organizer_name,
        p.payment_id,
        p.payment_date,
        p.amount as payment_amount,
        p.payment_method,
        p.status as payment_status,
        COALESCE(SUM(bi.quantity * bi.price_at_purchase), 0) as total_amount,
        JSON_AGG(
          JSON_BUILD_OBJECT(
            'ticket_id', t.ticket_id,
            'category', t.category,
            'quantity', bi.quantity,
            'price', bi.price_at_purchase
          )
        ) as items
      FROM bookings b
      JOIN booking_items bi ON b.booking_id = bi.booking_id
      JOIN tickets t ON bi.ticket_id = t.ticket_id
      JOIN events e ON t.event_id = e.event_id
      JOIN venues v ON e.venue_id = v.venue_id
      JOIN users u ON e.organizer_id = u.user_id
      LEFT JOIN payments p ON b.booking_id = p.booking_id
      WHERE b.booking_id = $1 AND b.user_id = $2
      GROUP BY b.booking_id, e.event_id, e.title, e.start_date, e.end_date,
               e.description, v.name, v.address, v.city, u.name,
               p.payment_id, p.payment_date, p.amount, p.payment_method, p.status
    `, [id, req.session.user.user_id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    res.json({ 
      success: true, 
      booking: result.rows[0] 
    });
  } catch (error) {
    console.error('Get booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch booking' 
    });
  }
});

// Create booking
router.post('/', requireAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { event_id, items, payment_method } = req.body;
    // items = [{category: 'VIP', quantity: 2}, {category: 'General', quantity: 1}]
    
    if (!event_id || !items || !Array.isArray(items) || items.length === 0 || !payment_method) {
      return res.status(400).json({ 
        success: false, 
        message: 'Event ID, items array, and payment method are required' 
      });
    }
    
    // Check if event is still active
    const eventResult = await client.query(
      'SELECT status, start_date, title FROM events WHERE event_id = $1',
      [event_id]
    );
    
    if (eventResult.rows.length === 0 || eventResult.rows[0].status !== 'active') {
      return res.status(400).json({ 
        success: false, 
        message: 'Event is not available for booking' 
      });
    }
    
    // Check if event has already started
    const eventStartDate = new Date(eventResult.rows[0].start_date);
    if (eventStartDate <= new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot book tickets for events that have already started' 
      });
    }
    
    // Validate all ticket types exist and get prices
    let totalAmount = 0;
    const ticketInstances = [];
    
    for (const item of items) {
      // Get ticket type price
      const ticketTypeResult = await client.query(
        'SELECT price FROM ticket_types WHERE event_id = $1 AND category = $2',
        [event_id, item.category]
      );
      
      if (ticketTypeResult.rows.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: `Ticket category '${item.category}' not found for this event` 
        });
      }
      
      const price = parseFloat(ticketTypeResult.rows[0].price);
      const itemTotal = price * item.quantity;
      totalAmount += itemTotal;
      
      // Create individual ticket instances for this item
      for (let i = 0; i < item.quantity; i++) {
        const ticketResult = await client.query(
          'INSERT INTO tickets (event_id, category) VALUES ($1, $2) RETURNING ticket_id',
          [event_id, item.category]
        );
        ticketInstances.push({
          ticket_id: ticketResult.rows[0].ticket_id,
          price: price,
          quantity: 1
        });
      }
    }
    
    // Create booking header
    const bookingResult = await client.query(
      'INSERT INTO bookings (user_id, booking_date, status) VALUES ($1, NOW(), $2) RETURNING *',
      [req.session.user.user_id, 'confirmed']
    );
    
    const booking = bookingResult.rows[0];
    
    // Create booking items
    for (const ticketInstance of ticketInstances) {
      await client.query(
        'INSERT INTO booking_items (booking_id, ticket_id, quantity, price_at_purchase) VALUES ($1, $2, $3, $4)',
        [booking.booking_id, ticketInstance.ticket_id, ticketInstance.quantity, ticketInstance.price]
      );
    }
    
    // Create payment record
    const paymentResult = await client.query(
      'INSERT INTO payments (booking_id, amount, payment_method, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [booking.booking_id, totalAmount, payment_method, 'completed']
    );
    
    await client.query('COMMIT');
    
    // Send booking confirmation email
    try {
      const ticketDetails = ticketInstances.map((ti, idx) => {
        const correspondingItem = items.find((item, itemIdx) => {
          // Find which category this ticket belongs to
          const ticketCategory = ticketInstances.slice(0, idx).reduce((acc, curr, i) => {
            if (i === idx) return acc;
            return acc;
          }, 0);
          return true; // We'll get category from the ticket_id query
        });
        
        return {
          ticket_id: ti.ticket_id,
          category: items[Math.floor(idx / (ticketInstances.length / items.length))].category,
          quantity: 1,
          price: ti.price
        };
      });
      
      await sendBookingConfirmation({
        userEmail: req.session.user.email,
        userName: req.session.user.name,
        bookingId: booking.booking_id,
        eventTitle: eventResult.rows[0].title,
        eventDate: eventResult.rows[0].start_date,
        tickets: ticketInstances.map(ti => ({
          ticket_id: ti.ticket_id,
          price: ti.price
        })),
        totalAmount: totalAmount,
        paymentMethod: payment_method
      });
    } catch (emailError) {
      console.error('Failed to send booking confirmation email:', emailError);
      // Don't fail the booking if email fails
    }
    
    res.status(201).json({ 
      success: true, 
      message: 'Booking created successfully',
      booking: {
        ...booking,
        total_amount: totalAmount,
        payment: paymentResult.rows[0],
        event_title: eventResult.rows[0].title
      }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to create booking' 
    });
  } finally {
    client.release();
  }
});

// Cancel booking
router.put('/:id/cancel', requireAuth, async (req, res) => {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    const { id } = req.params;
    
    // Check if booking exists and belongs to user
    const bookingResult = await client.query(
      'SELECT * FROM bookings WHERE booking_id = $1 AND user_id = $2',
      [id, req.session.user.user_id]
    );
    
    if (bookingResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        message: 'Booking not found' 
      });
    }
    
    const booking = bookingResult.rows[0];
    
    if (booking.status === 'cancelled') {
      return res.status(400).json({ 
        success: false, 
        message: 'Booking is already cancelled' 
      });
    }
    
    // Check if event hasn't started yet (allow cancellation up to event start)
    const eventResult = await client.query(`
      SELECT e.start_date 
      FROM events e
      JOIN tickets t ON e.event_id = t.event_id
      JOIN booking_items bi ON t.ticket_id = bi.ticket_id
      WHERE bi.booking_id = $1
      LIMIT 1
    `, [booking.booking_id]);
    
    const eventStartDate = new Date(eventResult.rows[0].start_date);
    if (eventStartDate <= new Date()) {
      return res.status(400).json({ 
        success: false, 
        message: 'Cannot cancel booking for events that have already started' 
      });
    }
    
    // Update booking status
    await client.query(
      'UPDATE bookings SET status = $1 WHERE booking_id = $2',
      ['cancelled', id]
    );
    
    // Update payment status
    await client.query(
      'UPDATE payments SET status = $1 WHERE booking_id = $2',
      ['refunded', id]
    );
    
    // Create notification
    await client.query(
      'INSERT INTO notifications (user_id, message) VALUES ($1, $2)',
      [req.session.user.user_id, `Your booking (ID: ${id}) has been cancelled and refund will be processed.`]
    );
    
    await client.query('COMMIT');
    
    res.json({ 
      success: true, 
      message: 'Booking cancelled successfully' 
    });
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Cancel booking error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to cancel booking' 
    });
  } finally {
    client.release();
  }
});

module.exports = router;