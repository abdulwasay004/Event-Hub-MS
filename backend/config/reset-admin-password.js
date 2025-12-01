const pool = require('./database');
const bcrypt = require('bcrypt');

async function resetAdminPassword() {
  try {
    console.log('Generating new hash for password123...');
    const newHash = await bcrypt.hash('password123', 10);
    console.log('New hash generated:', newHash);
    
    console.log('\nUpdating admin password in database...');
    const result = await pool.query(
      'UPDATE users SET password = $1 WHERE email = $2 RETURNING user_id, name, email, role',
      [newHash, 'admin@example.com']
    );
    
    if (result.rows.length > 0) {
      console.log('\n✅ Admin password updated successfully!');
      console.log('Admin user:', result.rows[0]);
      
      // Verify the hash works
      console.log('\nVerifying password...');
      const isValid = await bcrypt.compare('password123', newHash);
      console.log('Password verification:', isValid ? '✅ VALID' : '❌ INVALID');
    } else {
      console.log('\n❌ Admin user not found!');
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
    process.exit();
  }
}

resetAdminPassword();
