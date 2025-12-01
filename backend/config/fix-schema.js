const pool = require('./database');

async function addMissingColumns() {
  try {
    // Add cover_image column if it doesn't exist
    await pool.query(`
      ALTER TABLE events 
      ADD COLUMN IF NOT EXISTS cover_image TEXT;
    `);
    console.log('✓ Added cover_image column to events table');
    
    // Add your user account if it doesn't exist
    const checkUser = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['pafabdulwasay04@gmail.com']
    );
    
    if (checkUser.rows.length === 0) {
      // Password '1234' hashed with bcrypt
      await pool.query(`
        INSERT INTO users (name, email, password, phone, role) 
        VALUES ($1, $2, $3, $4, $5)
      `, ['Abdul Wasay', 'pafabdulwasay04@gmail.com', '$2b$10$8Z5L5z5Z5L5z5Z5L5z5Z5udqJ5KqH5qH5qH5qH5qH5qH5qH5qH5qH5O', '+923001111111', 'user']);
      console.log('✓ Added user account: pafabdulwasay04@gmail.com');
    } else {
      console.log('✓ User account already exists: pafabdulwasay04@gmail.com');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addMissingColumns();
