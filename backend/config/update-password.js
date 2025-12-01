const bcrypt = require('bcrypt');
const pool = require('./database');

async function updatePassword() {
  try {
    const hash = await bcrypt.hash('1234', 10);
    console.log('Generated hash for password "1234"');
    
    await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2',
      [hash, 'pafabdulwasay04@gmail.com']
    );
    
    console.log('✓ Password updated for pafabdulwasay04@gmail.com');
    console.log('You can now login with:');
    console.log('  Email: pafabdulwasay04@gmail.com');
    console.log('  Password: 1234');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

updatePassword();
