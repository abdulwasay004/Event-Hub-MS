const express = require('express');
const session = require('express-session');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');
const cron = require('node-cron');
const pool = require('./config/database');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Import routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const eventRoutes = require('./routes/events');
const bookingRoutes = require('./routes/bookings');
const ticketRoutes = require('./routes/tickets');
const reviewRoutes = require('./routes/reviews');
const venueRoutes = require('./routes/venues');
const paymentRoutes = require('./routes/payments');
const notificationRoutes = require('./routes/notifications');
const organizerRoutes = require('./routes/organizer');

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key-change-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false, // Set to true if using HTTPS
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/venues', venueRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/organizer', organizerRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    success: false, 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'Route not found' 
  });
});

// Auto-complete events when their end date has passed
const autoCompleteEvents = async () => {
  try {
    const result = await pool.query(`
      UPDATE events 
      SET status = 'completed' 
      WHERE end_date < NOW() 
      AND status = 'active'
      RETURNING event_id, title
    `);
    
    if (result.rows.length > 0) {
      console.log(`✅ Auto-completed ${result.rows.length} event(s):`);
      result.rows.forEach(event => {
        console.log(`   - Event #${event.event_id}: ${event.title}`);
      });
    }
  } catch (error) {
    console.error('❌ Error auto-completing events:', error.message);
  }
};

// Run auto-complete check every hour
cron.schedule('0 * * * *', () => {
  console.log('🔄 Running auto-complete check for events...');
  autoCompleteEvents();
});

// Run once on startup
autoCompleteEvents();

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});