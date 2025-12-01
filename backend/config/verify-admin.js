const pool = require('./database');
const bcrypt = require('bcrypt');

async function verifyAdmin() {
  try {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      ['admin@example.com']
    );
    
    if (result.rows.length === 0) {
      console.log('✗ Admin user NOT found in database');
      console.log('Creating admin user now...');
      
      const hash = await bcrypt.hash('password123', 10);
      await pool.query(
        'INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)',
        ['Admin User', 'admin@example.com', hash, '+923001234567', 'admin']
      );
      console.log('✓ Admin user created successfully');
    } else {
      const user = result.rows[0];
      console.log('✓ Admin user found:');
      console.log('  Name:', user.name);
      console.log('  Email:', user.email);
      console.log('  Role:', user.role);
      
      const isValid = await bcrypt.compare('password123', user.password);
      console.log('  Password test:', isValid ? '✓ VALID' : '✗ INVALID');
      
      if (!isValid) {
        console.log('\nPassword mismatch! Updating password...');
        const newHash = await bcrypt.hash('password123', 10);
        await pool.query(
          'UPDATE users SET password = $1 WHERE email = $2',
          [newHash, 'admin@example.com']
        );
        console.log('✓ Password updated successfully');
      }
    }
    
    console.log('\n✓ Admin account ready:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

verifyAdmin();
