const nodemailer = require('nodemailer');

// Create reusable transporter
let transporter;

// Initialize transporter with Ethereal (test email service)
async function createEtherealTransporter() {
  try {
    const testAccount = await nodemailer.createTestAccount();
    
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass
      }
    });
    
    console.log('📧 Using Ethereal test email service');
    console.log('📧 Test email account:', testAccount.user);
    console.log('💡 View sent emails at: https://ethereal.email/messages');
    
    return transporter;
  } catch (error) {
    console.error('Failed to create Ethereal account:', error.message);
    return null;
  }
}

// For production with real Gmail
function createGmailTransporter() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
}

// Initialize transporter based on environment
if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
  transporter = createGmailTransporter();
  console.log('📧 Using Gmail email service: ' + process.env.EMAIL_USER);
} else {
  console.log('⚠️  Gmail credentials not configured. Using Ethereal test service...');
  createEtherealTransporter().then(t => {
    if (t) transporter = t;
  });
}

const sendEmail = async ({ to, from, subject, text, html }) => {
  const mailOptions = {
    from: from || process.env.EMAIL_USER || 'eventhub@gmail.com',
    to,
    subject,
    text,
    html
  };

  try {
    // Wait for transporter to be initialized
    if (!transporter) {
      transporter = await createEtherealTransporter();
    }
    
    if (!transporter) {
      console.log('\n📧 ===== EMAIL (No Transporter Available) =====');
      console.log('From:', mailOptions.from);
      console.log('To:', mailOptions.to);
      console.log('Subject:', mailOptions.subject);
      console.log('================================================\n');
      return { success: false, message: 'Email transporter not available' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    
    // For Ethereal, provide preview URL
    if (info.messageId && nodemailer.getTestMessageUrl(info)) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📧 Preview email: ' + previewUrl);
    }
    
    return { success: true, messageId: info.messageId, previewUrl: nodemailer.getTestMessageUrl(info) };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

/**
 * Send booking confirmation email
 */
const sendBookingConfirmation = async (bookingDetails) => {
  const {
    userEmail,
    userName,
    bookingId,
    eventTitle,
    eventDate,
    tickets,
    totalAmount,
    paymentMethod
  } = bookingDetails;

  const ticketList = tickets.map(t => 
    `- ${t.quantity}x ${t.category} (Ticket ID: ${t.ticket_id}) - $${t.price}`
  ).join('\n');

  const mailOptions = {
    from: process.env.EMAIL_USER || 'eventhub@example.com',
    to: userEmail,
    subject: `Booking Confirmation - ${eventTitle}`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
          .booking-info { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .booking-number { font-size: 24px; color: #667eea; font-weight: bold; margin: 10px 0; }
          .ticket-item { background: #f0f0f0; padding: 10px; margin: 5px 0; border-radius: 5px; }
          .total { font-size: 20px; color: #22c55e; font-weight: bold; margin-top: 20px; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎉 Booking Confirmed!</h1>
          </div>
          <div class="content">
            <p>Hi ${userName},</p>
            <p>Thank you for booking with EventHub! Your booking has been confirmed.</p>
            
            <div class="booking-info">
              <div class="booking-number">Booking #${bookingId}</div>
              
              <h3>📅 Event Details</h3>
              <p><strong>${eventTitle}</strong></p>
              <p>Date: ${new Date(eventDate).toLocaleString()}</p>
              
              <h3>🎫 Your Tickets</h3>
              ${tickets.map(t => `
                <div class="ticket-item">
                  <strong>${t.quantity}x ${t.category}</strong><br>
                  Ticket ID: ${t.ticket_id}<br>
                  Price: $${t.price} each
                </div>
              `).join('')}
              
              <div class="total">
                Total Amount: $${totalAmount}
              </div>
              
              <p><strong>Payment Method:</strong> ${paymentMethod}</p>
              <p><strong>Status:</strong> ✅ Confirmed</p>
            </div>
            
            <p>Please save this email for your records. You will need your Booking ID and Ticket IDs for entry.</p>
            
            <p>If you have any questions, please contact our support team.</p>
            
            <p>We look forward to seeing you at the event!</p>
          </div>
          <div class="footer">
            <p>EventHub - Your Gateway to Amazing Events</p>
            <p>This is an automated message, please do not reply.</p>
          </div>
        </div>
      </body>
      </html>
    `,
    text: `
Booking Confirmation - ${eventTitle}

Hi ${userName},

Thank you for booking with EventHub! Your booking has been confirmed.

Booking Number: ${bookingId}

Event Details:
${eventTitle}
Date: ${new Date(eventDate).toLocaleString()}

Your Tickets:
${ticketList}

Total Amount: $${totalAmount}
Payment Method: ${paymentMethod}
Status: Confirmed

Please save this email for your records. You will need your Booking ID and Ticket IDs for entry.

If you have any questions, please contact our support team.

We look forward to seeing you at the event!

EventHub - Your Gateway to Amazing Events
    `
  };

  try {
    // If no email credentials, just log to console
    if (!process.env.EMAIL_USER) {
      console.log('\n📧 ===== EMAIL WOULD BE SENT =====');
      console.log('To:', userEmail);
      console.log('Subject:', mailOptions.subject);
      console.log('Booking #:', bookingId);
      console.log('Tickets:', tickets.map(t => `${t.ticket_id}`).join(', '));
      console.log('================================\n');
      return { success: true, message: 'Email logged to console (no credentials set)' };
    }

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Email send error:', error.message);
    // Don't throw error - booking should succeed even if email fails
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendBookingConfirmation,
  sendEmail
};
