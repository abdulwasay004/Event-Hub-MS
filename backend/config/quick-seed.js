const pool = require('./database');

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');
    
    // Insert Categories
    await pool.query(`
      INSERT INTO categories (name, description) VALUES 
      ('Music', 'Musical concerts and performances'),
      ('Technology', 'Tech conferences and workshops'),
      ('Sports', 'Sporting events and competitions'),
      ('Food & Drink', 'Culinary events and tastings'),
      ('Arts & Culture', 'Art exhibitions and cultural events'),
      ('Business', 'Business conferences and networking')
      ON CONFLICT DO NOTHING
    `);
    console.log('✓ Categories inserted');
    
    // Insert Venues
    await pool.query(`
      INSERT INTO venues (name, address, city, capacity, contact_info) VALUES 
      ('Grand Convention Center', 'Teen Talwar', 'Karachi', 5000, 'info@grandconvention.com'),
      ('Tech Hub Auditorium', 'Shaheen complex', 'Karachi', 1500, 'events@techhub.com'),
      ('Downtown Music Hall', 'Tariq road', 'Karachi', 3000, 'bookings@musichall.com'),
      ('Sports Arena Complex', 'Millinium mall', 'Karachi', 10000, 'events@sportarena.com'),
      ('Cultural Arts Center', 'Bahria Town', 'Rawalpindi', 800, 'info@culturalarts.com'),
      ('Business Conference Center', 'Sector -14A', 'Islamabad', 2000, 'meetings@bizconf.com')
      ON CONFLICT DO NOTHING
    `);
    console.log('✓ Venues inserted');
    
    // Check if users exist (other than your account)
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(userCount.rows[0].count) < 8) {
      // Password: 'password123' for all test users
      await pool.query(`
        INSERT INTO users (name, email, password, phone, role) VALUES 
        ('Ali Ahmed', 'ali.ahmed@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234568', 'user'),
        ('Fatima Khan', 'fatima.khan@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234569', 'user'),
        ('Hassan Malik', 'hassan.malik@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234570', 'user'),
        ('Ayesha Siddiqui', 'ayesha.siddiqui@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234571', 'user'),
        ('Bilal Hussain', 'bilal.hussain@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234572', 'user'),
        ('Zainab Ali', 'zainab.ali@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234573', 'user'),
        ('Usman Sheikh', 'usman.sheikh@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234574', 'user')
        ON CONFLICT DO NOTHING
      `);
      console.log('✓ Users inserted');
    }
    
    // Insert Events with future dates
    await pool.query(`
      INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) 
      SELECT 
        (SELECT user_id FROM users WHERE email = 'ali.ahmed@example.com'),
        1,
        'Summer Music Festival 2025',
        'A fantastic outdoor music festival',
        '2025-12-20 14:00:00',
        '2025-12-20 23:00:00',
        (SELECT category_id FROM categories WHERE name = 'Music'),
        'active'
      WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Summer Music Festival 2025')
    `);
    
    await pool.query(`
      INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) 
      SELECT 
        (SELECT user_id FROM users WHERE email = 'fatima.khan@example.com'),
        2,
        'JavaScript Conference 2025',
        'Learn the latest in JavaScript development',
        '2025-12-25 09:00:00',
        '2025-12-25 17:00:00',
        (SELECT category_id FROM categories WHERE name = 'Technology'),
        'active'
      WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'JavaScript Conference 2025')
    `);
    
    await pool.query(`
      INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) 
      SELECT 
        (SELECT user_id FROM users WHERE email = 'hassan.malik@example.com'),
        3,
        'City Marathon 2025',
        'Annual city marathon race',
        '2026-01-10 07:00:00',
        '2026-01-10 12:00:00',
        (SELECT category_id FROM categories WHERE name = 'Sports'),
        'active'
      WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'City Marathon 2025')
    `);
    
    await pool.query(`
      INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) 
      SELECT 
        (SELECT user_id FROM users WHERE email = 'ayesha.siddiqui@example.com'),
        4,
        'Food & Wine Festival',
        'Taste the finest local cuisine',
        '2026-01-15 12:00:00',
        '2026-01-15 22:00:00',
        (SELECT category_id FROM categories WHERE name = 'Food & Drink'),
        'active'
      WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = 'Food & Wine Festival')
    `);
    console.log('✓ Events inserted');
    
    // Insert Ticket Types
    const events = await pool.query('SELECT event_id, title FROM events ORDER BY event_id');
    
    for (const event of events.rows) {
      const existingTickets = await pool.query(
        'SELECT COUNT(*) FROM ticket_types WHERE event_id = $1',
        [event.event_id]
      );
      
      if (parseInt(existingTickets.rows[0].count) === 0) {
        if (event.title.includes('Music Festival')) {
          await pool.query(`
            INSERT INTO ticket_types (event_id, category, price, max_quantity) VALUES 
            ($1, 'General Admission', 50.00, 1000),
            ($1, 'VIP', 100.00, 100)
          `, [event.event_id]);
        } else if (event.title.includes('JavaScript Conference')) {
          await pool.query(`
            INSERT INTO ticket_types (event_id, category, price, max_quantity) VALUES 
            ($1, 'Regular', 200.00, 500),
            ($1, 'Premium', 300.00, 100)
          `, [event.event_id]);
        } else if (event.title.includes('Marathon')) {
          await pool.query(`
            INSERT INTO ticket_types (event_id, category, price, max_quantity) VALUES 
            ($1, 'Adult Registration', 30.00, 1000),
            ($1, 'Student Registration', 20.00, 200)
          `, [event.event_id]);
        } else if (event.title.includes('Food & Wine')) {
          await pool.query(`
            INSERT INTO ticket_types (event_id, category, price, max_quantity) VALUES 
            ($1, 'General Admission', 40.00, 500),
            ($1, 'VIP Tasting', 80.00, 50)
          `, [event.event_id]);
        }
      }
    }
    console.log('✓ Ticket types inserted');
    
    console.log('✓ Database seeding completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
}

seedDatabase();
