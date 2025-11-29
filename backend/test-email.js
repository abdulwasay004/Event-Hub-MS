require('dotenv').config();
const emailService = require('./services/emailService');

async function testEmail() {
  console.log('Testing email service...');
  console.log('From:', process.env.EMAIL_USER);
  
  // Replace with your actual email to test
  const testRecipient = 'YOUR_EMAIL@gmail.com';  // <-- CHANGE THIS
  
  try {
    const result = await emailService.sendEmail({
      to: testRecipient,
      from: process.env.EMAIL_FROM,
      subject: '✅ EventHub Email Test',
      text: 'This is a test email from EventHub. If you received this, your email configuration is working!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10B981;">✅ Email Test Successful!</h2>
          <p>This is a test email from EventHub.</p>
          <p>If you received this, your email configuration is working correctly!</p>
          <p><strong>Configuration:</strong></p>
          <ul>
            <li>Email Service: Gmail</li>
            <li>From: ${process.env.EMAIL_USER}</li>
            <li>To: ${testRecipient}</li>
          </ul>
          <p style="margin-top: 30px;">Best regards,<br><strong>The EventHub Team</strong></p>
        </div>
      `
    });
    
    if (result.success) {
      console.log('✅ Email sent successfully!');
      console.log('Message ID:', result.messageId);
      console.log(`\nCheck ${testRecipient} inbox for the test email.`);
    } else {
      console.log('❌ Email failed:', result.error);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Email test failed:', error.message);
    process.exit(1);
  }
}

// Wait a moment for transporter to initialize
setTimeout(testEmail, 2000);
