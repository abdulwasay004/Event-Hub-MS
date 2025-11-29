require('dotenv').config();
const pool = require('./config/database');

async function testConnection() {
  try {
    console.log('Testing database connection...');
    console.log('DB Config:', {
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT
    });
    
    const result = await pool.query('SELECT NOW()');
    console.log('✅ Database connected successfully!');
    console.log('Current time from DB:', result.rows[0]);
    
    const eventsResult = await pool.query('SELECT COUNT(*) FROM events');
    console.log('Events count:', eventsResult.rows[0].count);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    process.exit(1);
  }
}

testConnection();
