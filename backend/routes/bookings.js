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
    
    // Check if event is still active and get full event details
    const eventResult = await client.query(
      `SELECT e.event_id, e.status, e.start_date, e.end_date, e.title, e.description,
              v.name as venue_name, v.address as venue_address, v.city as venue_city
       FROM events e
       JOIN venues v ON e.venue_id = v.venue_id
       WHERE e.event_id = $1`,
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
    
    // Send ticket purchase confirmation email with complete event details
    try {
      const userEmail = req.session.user.email;
      const userName = req.session.user.name;
      const event = eventResult.rows[0];
      
      const eventStartDate = new Date(event.start_date).toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      });
      
      const eventEndDate = new Date(event.end_date).toLocaleString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      });
      
      const bookingDate = new Date(booking.booking_date).toLocaleString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric', 
        hour: '2-digit', 
        minute: '2-digit'
      });
      
      const venueFullAddress = `${event.venue_name}, ${event.venue_address}, ${event.venue_city}`;
      
      if (userEmail) {
        // Build detailed ticket list with ticket IDs
        const ticketDetailsText = ticketInstances.map((ticket, idx) => {
          const item = items.find(i => i.category === items[Math.floor(idx / (ticketInstances.length / items.length))].category);
          return `  • Ticket ID: ${ticket.ticket_id} | Category: ${items[Math.floor(idx / (ticketInstances.length / items.length))].category} | Price: $${ticket.price.toFixed(2)}`;
        }).join('\n');
        
        const ticketDetailsHtml = ticketInstances.map((ticket, idx) => {
          return `<tr style="border-bottom: 1px solid #E5E7EB;">
            <td style="padding: 8px;">${ticket.ticket_id}</td>
            <td style="padding: 8px;">${items[Math.floor(idx / (ticketInstances.length / items.length))].category}</td>
            <td style="padding: 8px; text-align: right;">$${ticket.price.toFixed(2)}</td>
          </tr>`;
        }).join('');
        
        const emailService = require('../services/emailService');
        await emailService.sendEmail({
          to: userEmail,
          from: process.env.EMAIL_FROM || 'eventhub@gmail.com',
          subject: `🎫 Tickets Confirmed for ${event.title}`,
          text: `Hello ${userName},\n\nYour tickets for "${event.title}" have been successfully booked!\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nBOOKING CONFIRMATION\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nBooking Number: #${booking.booking_id}\nBooking Date: ${bookingDate}\nPayment Method: ${payment_method.toUpperCase()}\nPayment Status: CONFIRMED\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nEVENT DETAILS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nEvent: ${event.title}\n\nDate & Time:\n  Start: ${eventStartDate}\n  End: ${eventEndDate}\n\nVenue:\n  ${venueFullAddress}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nYOUR TICKETS\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n${ticketDetailsText}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\nPAYMENT SUMMARY\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\nTotal Tickets: ${ticketInstances.length}\nTotal Amount Paid: $${totalAmount.toFixed(2)}\n\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n📱 IMPORTANT INSTRUCTIONS:\n\n1. Save this email for your records\n2. Present Booking ID #${booking.booking_id} at venue entrance\n3. Arrive 30 minutes before event start time\n4. Bring valid photo ID for verification\n\nNeed help? Contact us at support@eventhub.com\n\nSee you at the event! 🎉\n\nBest regards,\nThe EventHub Team`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 650px; margin: 0 auto; background-color: #ffffff;">
              <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; color: white;">
                <h1 style="margin: 0; font-size: 28px;">🎫 Booking Confirmed!</h1>
                <p style="margin: 10px 0 0 0; font-size: 16px;">Your tickets are ready</p>
              </div>
              
              <div style="padding: 30px;">
                <p style="font-size: 16px; color: #333;">Hello <strong>${userName}</strong>,</p>
                <p style="font-size: 16px; color: #333;">Your tickets for <strong>"${event.title}"</strong> have been successfully booked!</p>
                
                <!-- Booking Confirmation -->
                <div style="background-color: #F9FAFB; border-left: 4px solid #10B981; padding: 20px; margin: 25px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 15px 0; color: #10B981; font-size: 18px;">✅ Booking Confirmation</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; color: #6B7280; width: 180px;"><strong>Booking Number:</strong></td><td style="padding: 8px 0; color: #111827; font-weight: bold;">#${booking.booking_id}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;"><strong>Booking Date:</strong></td><td style="padding: 8px 0; color: #111827;">${bookingDate}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;"><strong>Payment Method:</strong></td><td style="padding: 8px 0; color: #111827;">${payment_method.toUpperCase()}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280;"><strong>Payment Status:</strong></td><td style="padding: 8px 0;"><span style="background-color: #D1FAE5; color: #065F46; padding: 4px 12px; border-radius: 12px; font-size: 13px; font-weight: bold;">CONFIRMED</span></td></tr>
                  </table>
                </div>
                
                <!-- Event Details -->
                <div style="background-color: #EEF2FF; border-left: 4px solid #4F46E5; padding: 20px; margin: 25px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 15px 0; color: #4F46E5; font-size: 18px;">📅 Event Details</h3>
                  <table style="width: 100%; border-collapse: collapse;">
                    <tr><td style="padding: 8px 0; color: #6B7280; width: 180px;"><strong>Event Name:</strong></td><td style="padding: 8px 0; color: #111827; font-weight: bold;">${event.title}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280; vertical-align: top;"><strong>Start Date & Time:</strong></td><td style="padding: 8px 0; color: #111827;">${eventStartDate}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280; vertical-align: top;"><strong>End Date & Time:</strong></td><td style="padding: 8px 0; color: #111827;">${eventEndDate}</td></tr>
                    <tr><td style="padding: 8px 0; color: #6B7280; vertical-align: top;"><strong>Venue:</strong></td><td style="padding: 8px 0; color: #111827;">${event.venue_name}<br>${event.venue_address}<br>${event.venue_city}</td></tr>
                  </table>
                </div>
                
                <!-- Ticket Details -->
                <div style="background-color: #FEF3C7; border-left: 4px solid #F59E0B; padding: 20px; margin: 25px 0; border-radius: 4px;">
                  <h3 style="margin: 0 0 15px 0; color: #D97706; font-size: 18px;">🎟️ Your Tickets</h3>
                  <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 4px; overflow: hidden;">
                    <thead>
                      <tr style="background-color: #F59E0B; color: white;">
                        <th style="padding: 12px; text-align: left;">Ticket ID</th>
                        <th style="padding: 12px; text-align: left;">Category</th>
                        <th style="padding: 12px; text-align: right;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${ticketDetailsHtml}
                    </tbody>
                    <tfoot>
                      <tr style="background-color: #FEF3C7; font-weight: bold; font-size: 16px;">
                        <td colspan="2" style="padding: 15px; text-align: left;">Total (${ticketInstances.length} ticket${ticketInstances.length > 1 ? 's' : ''})</td>
                        <td style="padding: 15px; text-align: right; color: #D97706;">$${totalAmount.toFixed(2)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
                
                <!-- Important Instructions -->
                <div style="background-color: #DBEAFE; border: 2px solid #3B82F6; padding: 20px; margin: 25px 0; border-radius: 8px;">
                  <h3 style="margin: 0 0 15px 0; color: #1E40AF; font-size: 18px;">📱 Important Instructions</h3>
                  <ul style="margin: 0; padding-left: 20px; color: #1F2937; line-height: 1.8;">
                    <li>Save this email for your records</li>
                    <li>Present <strong>Booking ID #${booking.booking_id}</strong> at venue entrance</li>
                    <li>Arrive <strong>30 minutes</strong> before event start time</li>
                    <li>Bring valid <strong>photo ID</strong> for verification</li>
                    <li>Each ticket holder must present their individual Ticket ID</li>
                  </ul>
                </div>
                
                <div style="text-align: center; margin: 30px 0;">
                  <p style="font-size: 20px; color: #10B981; font-weight: bold; margin: 0;">See you at the event! 🎉</p>
                </div>
                
                <div style="border-top: 2px solid #E5E7EB; padding-top: 20px; margin-top: 30px; text-align: center; color: #6B7280; font-size: 14px;">
                  <p style="margin: 5px 0;">Need help? Contact us at <a href="mailto:support@eventhub.com" style="color: #4F46E5; text-decoration: none;">support@eventhub.com</a></p>
                  <p style="margin: 15px 0 5px 0;">Best regards,<br><strong style="color: #111827;">The EventHub Team</strong></p>
                </div>
              </div>
            </div>
          `
        });
      }
    } catch (emailError) {
      console.error('Failed to send ticket purchase confirmation email:', emailError);
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