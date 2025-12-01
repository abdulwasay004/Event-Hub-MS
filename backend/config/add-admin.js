const pool = require('./database');

async function addAdminUser() {
  try {
    await pool.query(`
      INSERT INTO users (name, email, password, phone, role) 
      VALUES ('Admin User', 'admin@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234567', 'admin')
      ON CONFLICT (email) DO NOTHING
    `);
    
    console.log('✓ Admin user added successfully');
    console.log('Admin login credentials:');
    console.log('  Email: admin@example.com');
    console.log('  Password: password123');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

addAdminUser();
