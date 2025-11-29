const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../config/database');
const { requireAuth } = require('../middleware/auth');
const emailService = require('../services/emailService'); 


const router = express.Router();

// Register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, phone, role = 'user' } = req.body;
    
    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, email, and password are required' 
      });
    }
    
    // Check if user exists
    const existingUser = await pool.query(
      'SELECT user_id FROM users WHERE email = $1',
      [email]
    );
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'User with this email already exists' 
      });
    }
    
    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create user
    const result = await pool.query(
      'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5) RETURNING user_id, name, email, phone, role, date_created',
      [name, email, hashedPassword, phone, role]
    );
    
    const user = result.rows[0];
    
    // Create session
    req.session.user = user;

    // send welcome email (best-effort, won't block response)
    if (user && user.email) {
      emailService.sendEmail({
        to: user.email,
        from: process.env.EMAIL_FROM || 'eventhub@gmail.com',
        subject: '🎉 Welcome to EventHub!',
        text: `Hello ${user.name},\n\nWelcome to EventHub!\n\nYour account has been successfully created. You can now:\n• Browse and discover exciting events\n• Book tickets for your favorite events\n• Create and manage your own events (as an organizer)\n• Track your bookings and event history\n\nThank you for joining our community!\n\nBest regards,\nThe EventHub Team`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4F46E5;">🎉 Welcome to EventHub!</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Your account has been successfully created.</p>
            <div style="background-color: #F3F4F6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0;">What you can do now:</h3>
              <ul style="line-height: 1.8;">
                <li>Browse and discover exciting events</li>
                <li>Book tickets for your favorite events</li>
                <li>Create and manage your own events (as an organizer)</li>
                <li>Track your bookings and event history</li>
              </ul>
            </div>
            <p>Thank you for joining our community!</p>
            <p style="margin-top: 30px;">Best regards,<br><strong>The EventHub Team</strong></p>
          </div>
        `
      }).catch(err => console.error('Welcome email error:', err));
    }
    
    
    res.status(201).json({ 
      success: true, 
      message: 'User registered successfully',
      user 
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
    }
    
    // Find user
    const result = await pool.query(
      'SELECT user_id, name, email, password, phone, role, date_created FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    const user = result.rows[0];
    
    // Check password
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ 
        success: false, 
        message: 'Invalid email or password' 
      });
    }
    
    // Remove password from user object
    delete user.password;
    
    // Create session
    req.session.user = user;

    
    // send sign-in notification (best-effort)
    if (user && user.email) {
      emailService.sendEmail({
        to: user.email,
        from: 'eventhub@gmail.com',
        subject: 'Sign-in to EventHub',
        text: `Hello ${user.name || ''},\n\nYou have just signed in to EventHub. If this wasn't you, please secure your account.`
      }).catch(err => console.error('Sign-in email error:', err));
    }
    
    
    res.json({ 
      success: true, 
      message: 'Login successful',
      user 
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ 
        success: false, 
        message: 'Logout failed' 
      });
    }
    
    res.clearCookie('connect.sid');
    res.json({ 
      success: true, 
      message: 'Logout successful' 
    });
  });
});

// Get current user
router.get('/me', requireAuth, (req, res) => {
  res.json({ 
    success: true, 
    user: req.session.user 
  });
});

// Check authentication status
router.get('/status', (req, res) => {
  res.json({ 
    success: true,
    authenticated: !!req.session.user,
    user: req.session.user || null
  });
});

module.exports = router;