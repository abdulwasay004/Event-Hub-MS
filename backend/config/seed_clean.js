const fs = require('fs');
const path = require('path');
const pool = require('./database');

async function runSeeder() {
  const client = await pool.connect();
  
  try {
    console.log('Starting database seeding with transaction...');
    
    // Start transaction
    await client.query('BEGIN');
    
    // Clear all data
    console.log('Clearing existing data...');
    await client.query('DROP SCHEMA public CASCADE;');
    await client.query('CREATE SCHEMA public;');
    console.log('✓ Database cleared successfully');
    
    // Create schema
    const schemaSQL = fs.readFileSync(path.join(__dirname, '../../database/schema.sql'), 'utf8');
    await client.query(schemaSQL);
    console.log('✓ Schema created successfully');
    
    // Insert seed data
    console.log('Inserting seed data...');
    
    // Categories
    await client.query("INSERT INTO categories (name, description) VALUES ('Music', 'Musical concerts and performances')");
    await client.query("INSERT INTO categories (name, description) VALUES ('Technology', 'Tech conferences and workshops')");
    await client.query("INSERT INTO categories (name, description) VALUES ('Sports', 'Sporting events and competitions')");
    await client.query("INSERT INTO categories (name, description) VALUES ('Food & Drink', 'Culinary events and tastings')");
    await client.query("INSERT INTO categories (name, description) VALUES ('Arts & Culture', 'Art exhibitions and cultural events')");
    await client.query("INSERT INTO categories (name, description) VALUES ('Business', 'Business conferences and networking')");
    console.log('✓ Categories inserted');
    
    // Users (password: 'password123' for all)
    const bcryptHash = '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C';
    await client.query("INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)", ['Admin User', 'admin@example.com', bcryptHash, '+1234567890', 'admin']);
    await client.query("INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)", ['Test User', 'user@example.com', bcryptHash, '+1234567891', 'user']);
    await client.query("INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)", ['John Smith', 'john@example.com', bcryptHash, '+1234567892', 'user']);
    await client.query("INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)", ['Sarah Johnson', 'sarah@example.com', bcryptHash, '+1234567893', 'user']);
    await client.query("INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)", ['Mike Wilson', 'mike@example.com', bcryptHash, '+1234567894', 'user']);
    await client.query("INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)", ['Alice Smith', 'alice@example.com', bcryptHash, '+1234567895', 'user']);
    await client.query("INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)", ['Bob Johnson', 'bob@example.com', bcryptHash, '+1234567896', 'user']);
    await client.query("INSERT INTO users (name, email, password, phone, role) VALUES ($1, $2, $3, $4, $5)", ['Emma Wilson', 'emma@example.com', bcryptHash, '+1234567897', 'user']);
    console.log('✓ Users inserted');
    
    // Venues
    await client.query("INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ($1, $2, $3, $4, $5)", ['Grand Convention Center', '123 Main St', 'New York', 5000, 'info@grandconvention.com']);
    await client.query("INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ($1, $2, $3, $4, $5)", ['Tech Hub Auditorium', '456 Innovation Ave', 'San Francisco', 1500, 'events@techhub.com']);
    await client.query("INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ($1, $2, $3, $4, $5)", ['Downtown Music Hall', '789 Broadway', 'Nashville', 3000, 'bookings@musichall.com']);
    await client.query("INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ($1, $2, $3, $4, $5)", ['Sports Arena Complex', '321 Stadium Blvd', 'Chicago', 10000, 'events@sportarena.com']);
    console.log('✓ Venues inserted');
    
    // Events
    await client.query("INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [2, 1, 'Summer Music Festival 2025', 'A fantastic outdoor music festival', '2025-11-15 14:00:00', '2025-11-15 23:00:00', 1, 'active']);
    await client.query("INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [3, 2, 'JavaScript Conference 2025', 'Learn the latest in JavaScript development', '2025-11-20 09:00:00', '2025-11-20 17:00:00', 2, 'active']);
    await client.query("INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [4, 3, 'City Marathon 2025', 'Annual city marathon race', '2025-12-01 07:00:00', '2025-12-01 12:00:00', 3, 'active']);
    await client.query("INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)", [5, 4, 'Food & Wine Festival', 'Taste the finest local cuisine', '2025-12-15 12:00:00', '2025-12-15 22:00:00', 4, 'active']);
    console.log('✓ Events inserted');
    
    // Tickets
    await client.query("INSERT INTO tickets (event_id, category, price, available_quantity) VALUES ($1, $2, $3, $4)", [1, 'General Admission', 50.00, 1000]);
    await client.query("INSERT INTO tickets (event_id, category, price, available_quantity) VALUES ($1, $2, $3, $4)", [1, 'VIP', 100.00, 100]);
    await client.query("INSERT INTO tickets (event_id, category, price, available_quantity) VALUES ($1, $2, $3, $4)", [2, 'Regular', 200.00, 500]);
    await client.query("INSERT INTO tickets (event_id, category, price, available_quantity) VALUES ($1, $2, $3, $4)", [2, 'Premium', 300.00, 100]);
    await client.query("INSERT INTO tickets (event_id, category, price, available_quantity) VALUES ($1, $2, $3, $4)", [3, 'Adult Registration', 30.00, 1000]);
    await client.query("INSERT INTO tickets (event_id, category, price, available_quantity) VALUES ($1, $2, $3, $4)", [3, 'Student Registration', 20.00, 200]);
    await client.query("INSERT INTO tickets (event_id, category, price, available_quantity) VALUES ($1, $2, $3, $4)", [4, 'General Admission', 40.00, 500]);
    await client.query("INSERT INTO tickets (event_id, category, price, available_quantity) VALUES ($1, $2, $3, $4)", [4, 'VIP Tasting', 80.00, 50]);
    console.log('✓ Tickets inserted');
    
    // Bookings - Perfect calculations
    await client.query("INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES ($1, $2, $3, $4, $5)", [6, 1, 1, 2, 100.00]);
    await client.query("INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES ($1, $2, $3, $4, $5)", [7, 1, 2, 1, 100.00]);
    await client.query("INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES ($1, $2, $3, $4, $5)", [5, 2, 3, 1, 200.00]);
    await client.query("INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES ($1, $2, $3, $4, $5)", [6, 3, 5, 1, 30.00]);
    await client.query("INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES ($1, $2, $3, $4, $5)", [8, 3, 6, 1, 20.00]);
    await client.query("INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES ($1, $2, $3, $4, $5)", [5, 4, 7, 1, 40.00]);
    console.log('✓ Bookings inserted');
    
    // Payments
    await client.query("INSERT INTO payments (booking_id, amount, payment_method, status) VALUES ($1, $2, $3, $4)", [1, 100.00, 'Credit Card', 'completed']);
    await client.query("INSERT INTO payments (booking_id, amount, payment_method, status) VALUES ($1, $2, $3, $4)", [2, 100.00, 'Debit Card', 'completed']);
    await client.query("INSERT INTO payments (booking_id, amount, payment_method, status) VALUES ($1, $2, $3, $4)", [3, 200.00, 'Credit Card', 'completed']);
    await client.query("INSERT INTO payments (booking_id, amount, payment_method, status) VALUES ($1, $2, $3, $4)", [4, 30.00, 'PayPal', 'completed']);
    await client.query("INSERT INTO payments (booking_id, amount, payment_method, status) VALUES ($1, $2, $3, $4)", [5, 20.00, 'Credit Card', 'completed']);
    await client.query("INSERT INTO payments (booking_id, amount, payment_method, status) VALUES ($1, $2, $3, $4)", [6, 40.00, 'Debit Card', 'completed']);
    console.log('✓ Payments inserted');
    
    // Commit transaction
    await client.query('COMMIT');
    console.log('✓ All data committed successfully');
    
    console.log('\n=== SEED DATA SUMMARY ===');
    console.log('✓ Test User (ID: 2): 1 event, 3 tickets sold, $200 revenue');
    console.log('✓ John Smith (ID: 3): 1 event, 1 ticket sold, $200 revenue');
    console.log('✓ Sarah Johnson (ID: 4): 1 event, 2 tickets sold, $50 revenue');
    console.log('✓ Mike Wilson (ID: 5): 1 event, 1 ticket sold, $40 revenue');
    console.log('\nDatabase seeding completed successfully!');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error seeding database, rolling back:', error);
    process.exit(1);
  } finally {
    client.release();
    process.exit(0);
  }
}

runSeeder();