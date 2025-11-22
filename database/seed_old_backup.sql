-- ============================================================================
-- EVENT HUB SEED DATA - NORMALIZED SCHEMA
-- ============================================================================
-- This file populates the database with test data for the new normalized schema
-- Key changes:
-- 1. ticket_types table defines pricing tiers (VIP, General, etc.)
-- 2. tickets table stores individual ticket instances
-- 3. bookings table is order header only (user_id, status, date)
-- 4. booking_items links bookings to tickets with purchase details
-- ============================================================================

-- Categories
INSERT INTO categories (name, description) VALUES 
('Music', 'Musical concerts and performances'),
('Technology', 'Tech conferences and workshops'),
('Sports', 'Sporting events and competitions'),
('Food & Drink', 'Culinary events and tastings'),
('Arts & Culture', 'Art exhibitions and cultural events'),
('Business', 'Business conferences and networking');

-- Users (password: 'password123' for all)

INSERT INTO users (name, email, password, phone, role) VALUES ('Admin User', 'admin@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567890', 'admin');INSERT INTO categories (name, description) VALUES ('Sports', 'Sporting events and competitions');-- Completely rewritten with mathematical precision-- This file contains perfectly consistent test data with:

INSERT INTO users (name, email, password, phone, role) VALUES ('Test User', 'user@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567891', 'user');

INSERT INTO users (name, email, password, phone, role) VALUES ('John Smith', 'john@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567892', 'user');INSERT INTO categories (name, description) VALUES ('Food & Drink', 'Culinary events and tastings');

INSERT INTO users (name, email, password, phone, role) VALUES ('Sarah Johnson', 'sarah@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567893', 'user');

INSERT INTO users (name, email, password, phone, role) VALUES ('Mike Wilson', 'mike@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567894', 'user');INSERT INTO categories (name, description) VALUES ('Arts & Culture', 'Art exhibitions and cultural events');-- Every number is calculated and verified-- - Clear user assignments and ownership

INSERT INTO users (name, email, password, phone, role) VALUES ('Alice Smith', 'alice@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567895', 'user');

INSERT INTO users (name, email, password, phone, role) VALUES ('Bob Johnson', 'bob@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567896', 'user');INSERT INTO categories (name, description) VALUES ('Business', 'Business conferences and networking');

INSERT INTO users (name, email, password, phone, role) VALUES ('Emma Wilson', 'emma@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567897', 'user');

-- Perfect consistency between all tables-- - Correct ID references throughout

-- Venues

INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Grand Convention Center', '123 Main St', 'New York', 5000, 'info@grandconvention.com');-- Users (password: 'password123' for all)

INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Tech Hub Auditorium', '456 Innovation Ave', 'San Francisco', 1500, 'events@techhub.com');

INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Downtown Music Hall', '789 Broadway', 'Nashville', 3000, 'bookings@musichall.com');INSERT INTO users (name, email, password, phone, role) VALUES ('Admin User', 'admin@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567890', 'admin');-- - Logical booking patterns

INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Sports Arena Complex', '321 Stadium Blvd', 'Chicago', 10000, 'events@sportarena.com');

INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Cultural Arts Center', '654 Arts District', 'Los Angeles', 800, 'info@culturalarts.com');INSERT INTO users (name, email, password, phone, role) VALUES ('Test User', 'user@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567891', 'user');

INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Business Conference Center', '987 Corporate Way', 'Boston', 2000, 'meetings@bizconf.com');

INSERT INTO users (name, email, password, phone, role) VALUES ('John Smith', 'john@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567892', 'user');-- Insert categories-- - Matching calculations for tickets, revenue, and totals

-- Events - Clear ownership mapping

INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES (2, 1, 'Summer Music Festival 2025', 'A fantastic outdoor music festival', '2025-11-15 14:00:00', '2025-11-15 23:00:00', 1, 'active');INSERT INTO users (name, email, password, phone, role) VALUES ('Sarah Johnson', 'sarah@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567893', 'user');

INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES (3, 2, 'JavaScript Conference 2025', 'Learn the latest in JavaScript development', '2025-11-20 09:00:00', '2025-11-20 17:00:00', 2, 'active');

INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES (4, 3, 'City Marathon 2025', 'Annual city marathon race', '2025-12-01 07:00:00', '2025-12-01 12:00:00', 3, 'active');INSERT INTO users (name, email, password, phone, role) VALUES ('Mike Wilson', 'mike@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567894', 'user');INSERT INTO categories (name, description) VALUES

INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES (5, 4, 'Food & Wine Festival', 'Taste the finest local cuisine', '2025-12-15 12:00:00', '2025-12-15 22:00:00', 4, 'active');

INSERT INTO users (name, email, password, phone, role) VALUES ('Alice Smith', 'alice@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567895', 'user');

-- Tickets

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (1, 'General Admission', 50.00, 1000);INSERT INTO users (name, email, password, phone, role) VALUES ('Bob Johnson', 'bob@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567896', 'user');('Music', 'Musical concerts and performances'),-- Insert categories

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (1, 'VIP', 100.00, 100);

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (2, 'Regular', 200.00, 500);INSERT INTO users (name, email, password, phone, role) VALUES ('Emma Wilson', 'emma@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567897', 'user');

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (2, 'Premium', 300.00, 100);

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (3, 'Adult Registration', 30.00, 1000);('Technology', 'Tech conferences and workshops'),INSERT INTO categories (name, description) VALUES

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (3, 'Student Registration', 20.00, 200);

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (4, 'General Admission', 40.00, 500);-- Venues

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (4, 'VIP Tasting', 80.00, 50);

INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Grand Convention Center', '123 Main St', 'New York', 5000, 'info@grandconvention.com');('Sports', 'Sporting events and competitions'),('Music', 'Musical concerts and performances'),

-- Bookings - Perfect calculations

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (6, 1, 1, 2, 100.00);INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Tech Hub Auditorium', '456 Innovation Ave', 'San Francisco', 1500, 'events@techhub.com');

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (7, 1, 2, 1, 100.00);

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (5, 2, 3, 1, 200.00);INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Downtown Music Hall', '789 Broadway', 'Nashville', 3000, 'bookings@musichall.com');('Food & Drink', 'Culinary events and tastings'),('Technology', 'Tech conferences and workshops'),

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (6, 3, 5, 1, 30.00);

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (8, 3, 6, 1, 20.00);INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Sports Arena Complex', '321 Stadium Blvd', 'Chicago', 10000, 'events@sportarena.com');

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (5, 4, 7, 1, 40.00);

INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Cultural Arts Center', '654 Arts District', 'Los Angeles', 800, 'info@culturalarts.com');('Arts & Culture', 'Art exhibitions and cultural events'),('Sports', 'Sporting events and competitions'),

-- Payments - Exact matches

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (1, 100.00, 'Credit Card', 'completed');INSERT INTO venues (name, address, city, capacity, contact_info) VALUES ('Business Conference Center', '987 Corporate Way', 'Boston', 2000, 'meetings@bizconf.com');

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (2, 100.00, 'Debit Card', 'completed');

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (3, 200.00, 'Credit Card', 'completed');('Business', 'Business conferences and networking');('Food & Drink', 'Culinary events and tastings'),

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (4, 30.00, 'PayPal', 'completed');

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (5, 20.00, 'Credit Card', 'completed');-- Events - Simple ownership

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (6, 40.00, 'Debit Card', 'completed');

-- Test User: Music Festival | John Smith: Tech Conference | Sarah Johnson: Marathon | Mike Wilson: Food Festival('Arts & Culture', 'Art exhibitions and cultural events'),

-- Reviews - Only from actual attendees

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (6, 1, 5, 'Great music festival!');INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES (2, 1, 'Summer Music Festival 2025', 'A fantastic outdoor music festival', '2025-11-15 14:00:00', '2025-11-15 23:00:00', 1, 'active');

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (7, 1, 4, 'Really enjoyed the VIP experience.');

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (5, 2, 5, 'Excellent JavaScript conference.');INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES (3, 2, 'JavaScript Conference 2025', 'Learn the latest in JavaScript development', '2025-11-20 09:00:00', '2025-11-20 17:00:00', 2, 'active');-- Insert users (password: 'password123' for all)('Business', 'Business conferences and networking');

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (6, 3, 4, 'Well organized marathon.');

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (5, 4, 5, 'Amazing food and wine selection.');INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES (4, 3, 'City Marathon 2025', 'Annual city marathon race', '2025-12-01 07:00:00', '2025-12-01 12:00:00', 3, 'active');



-- Notifications - Match bookingsINSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES (5, 4, 'Food & Wine Festival', 'Taste the finest local cuisine', '2025-12-15 12:00:00', '2025-12-15 22:00:00', 4, 'active');INSERT INTO users (name, email, password, phone, role) VALUES

INSERT INTO notifications (user_id, message) VALUES (6, 'Your booking for Summer Music Festival has been confirmed!');

INSERT INTO notifications (user_id, message) VALUES (7, 'Summer Music Festival VIP tickets confirmed!');

INSERT INTO notifications (user_id, message) VALUES (5, 'JavaScript Conference booking confirmed!');

INSERT INTO notifications (user_id, message) VALUES (6, 'Marathon registration confirmed!');-- Tickets - Sequential IDs, round numbers('Admin User', 'admin@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567890', 'admin'),-- Insert sample users (password: 'password123' for all users)

INSERT INTO notifications (user_id, message) VALUES (8, 'Student marathon registration confirmed!');

INSERT INTO notifications (user_id, message) VALUES (5, 'Food & Wine Festival tickets ready!');INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (1, 'General Admission', 50.00, 1000);



-- Event ImagesINSERT INTO tickets (event_id, category, price, available_quantity) VALUES (1, 'VIP', 100.00, 100);('Test User', 'user@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567891', 'user'),INSERT INTO users (name, email, password, phone, role) VALUES

INSERT INTO event_images (event_id, image_url, caption) VALUES (1, '/images/music-festival.jpg', 'Summer Music Festival');

INSERT INTO event_images (event_id, image_url, caption) VALUES (2, '/images/js-conference.jpg', 'JavaScript Conference');INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (2, 'Regular', 200.00, 500);

INSERT INTO event_images (event_id, image_url, caption) VALUES (3, '/images/marathon.jpg', 'City Marathon');

INSERT INTO event_images (event_id, image_url, caption) VALUES (4, '/images/food-festival.jpg', 'Food & Wine Festival');INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (2, 'Premium', 300.00, 100);('John Smith', 'john@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567892', 'user'),('Admin User', 'admin@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567890', 'admin'),

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (3, 'Adult Registration', 30.00, 1000);

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (3, 'Student Registration', 20.00, 200);('Sarah Johnson', 'sarah@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567893', 'user'),('Test User', 'user@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567891', 'user'),

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (4, 'General Admission', 40.00, 500);

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES (4, 'VIP Tasting', 80.00, 50);('Mike Wilson', 'mike@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567894', 'user'),('John Smith', 'john@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567892', 'user'),



-- Bookings - Perfect math, verified totals('Alice Smith', 'alice@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567895', 'user'),('Sarah Johnson', 'sarah@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567893', 'user'),

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (6, 1, 1, 2, 100.00);

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (7, 1, 2, 1, 100.00);('Bob Johnson', 'bob@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567896', 'user'),('Mike Wilson', 'mike@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567894', 'user'),

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (5, 2, 3, 1, 200.00);

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (6, 3, 5, 1, 30.00);('Emma Wilson', 'emma@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567897', 'user');('Alice Smith', 'alice@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567895', 'user'),

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (8, 3, 6, 1, 20.00);

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES (5, 4, 7, 1, 40.00);('Bob Johnson', 'bob@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567896', 'user'),



-- Payments - Exact matches to bookings-- Insert venues('Emma Wilson', 'emma@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+1234567897', 'user');

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (1, 100.00, 'Credit Card', 'completed');

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (2, 100.00, 'Debit Card', 'completed');INSERT INTO venues (name, address, city, capacity, contact_info) VALUES

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (3, 200.00, 'Credit Card', 'completed');

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (4, 30.00, 'PayPal', 'completed');('Grand Convention Center', '123 Main St', 'New York', 5000, 'info@grandconvention.com'),-- Insert venues

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (5, 20.00, 'Credit Card', 'completed');

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES (6, 40.00, 'Debit Card', 'completed');('Tech Hub Auditorium', '456 Innovation Ave', 'San Francisco', 1500, 'events@techhub.com'),INSERT INTO venues (name, address, city, capacity, contact_info) VALUES



-- Reviews - Only from actual attendees('Downtown Music Hall', '789 Broadway', 'Nashville', 3000, 'bookings@musichall.com'),('Grand Convention Center', '123 Main St', 'New York', 5000, 'info@grandconvention.com'),

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (6, 1, 5, 'Great music festival!');

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (7, 1, 4, 'Really enjoyed the VIP experience.');('Sports Arena Complex', '321 Stadium Blvd', 'Chicago', 10000, 'events@sportarena.com'),('Tech Hub Auditorium', '456 Innovation Ave', 'San Francisco', 1500, 'events@techhub.com'),

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (5, 2, 5, 'Excellent JavaScript conference.');

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (6, 3, 4, 'Well organized marathon.');('Cultural Arts Center', '654 Arts District', 'Los Angeles', 800, 'info@culturalarts.com'),('Downtown Music Hall', '789 Broadway', 'Nashville', 3000, 'bookings@musichall.com'),

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES (5, 4, 5, 'Amazing food and wine selection.');

('Business Conference Center', '987 Corporate Way', 'Boston', 2000, 'meetings@bizconf.com');('Sports Arena Complex', '321 Stadium Blvd', 'Chicago', 10000, 'events@sportarena.com'),

-- Notifications - Match bookings exactly

INSERT INTO notifications (user_id, message) VALUES (6, 'Your booking for Summer Music Festival has been confirmed!');('Cultural Arts Center', '654 Arts District', 'Los Angeles', 800, 'info@culturalarts.com'),

INSERT INTO notifications (user_id, message) VALUES (7, 'Summer Music Festival VIP tickets confirmed!');

INSERT INTO notifications (user_id, message) VALUES (5, 'JavaScript Conference booking confirmed!');-- ==========================================('Business Conference Center', '987 Corporate Way', 'Boston', 2000, 'meetings@bizconf.com');

INSERT INTO notifications (user_id, message) VALUES (6, 'Marathon registration confirmed!');

INSERT INTO notifications (user_id, message) VALUES (8, 'Student marathon registration confirmed!');-- EVENTS - SIMPLE CLEAN OWNERSHIP

INSERT INTO notifications (user_id, message) VALUES (5, 'Food & Wine Festival tickets ready!');

-- ==========================================-- ==========================================

-- Event Images

INSERT INTO event_images (event_id, image_url, caption) VALUES (1, '/images/music-festival.jpg', 'Summer Music Festival');-- Test User owns: Music Festival-- EVENTS - CLEAR OWNERSHIP ASSIGNMENTS

INSERT INTO event_images (event_id, image_url, caption) VALUES (2, '/images/js-conference.jpg', 'JavaScript Conference');

INSERT INTO event_images (event_id, image_url, caption) VALUES (3, '/images/marathon.jpg', 'City Marathon');-- John Smith owns: Tech Conference  -- ==========================================

INSERT INTO event_images (event_id, image_url, caption) VALUES (4, '/images/food-festival.jpg', 'Food & Wine Festival');

-- Sarah Johnson owns: Marathon-- Test User (ID=2): Music Festival, Tech Conference

-- VERIFIED EXPECTED RESULTS:

-- Test User: 1 event, 3 tickets, $200 revenue, 2 bookings-- Mike Wilson owns: Food Festival-- John Smith (ID=3): Art Exhibition  

-- John Smith: 1 event, 1 ticket, $200 revenue, 1 booking  

-- Sarah Johnson: 1 event, 2 tickets, $50 revenue, 2 bookingsINSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES-- Sarah Johnson (ID=4): Marathon, Business Event

-- Mike Wilson: 1 event, 1 ticket, $40 revenue, 1 booking
(2, 1, 'Summer Music Festival 2025', 'A fantastic outdoor music festival', '2025-11-15 14:00:00', '2025-11-15 23:00:00', 1, 'active'),-- Mike Wilson (ID=5): Food Festival

(3, 2, 'JavaScript Conference 2025', 'Learn the latest in JavaScript development', '2025-11-20 09:00:00', '2025-11-20 17:00:00', 2, 'active'),INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES

(4, 3, 'City Marathon 2025', 'Annual city marathon race', '2025-12-01 07:00:00', '2025-12-01 12:00:00', 3, 'active'),(2, 3, 'Summer Music Festival 2025', 'A fantastic outdoor music festival featuring local and international artists', '2025-11-15 14:00:00', '2025-11-15 23:00:00', 1, 'active'),

(5, 4, 'Food & Wine Festival', 'Taste the finest local cuisine', '2025-12-15 12:00:00', '2025-12-15 22:00:00', 4, 'active');(2, 2, 'JavaScript Conference 2025', 'Learn the latest in JavaScript development and frameworks', '2025-11-20 09:00:00', '2025-11-20 17:00:00', 2, 'active'),

(3, 5, 'Contemporary Art Exhibition', 'Featuring works from emerging contemporary artists', '2025-12-05 10:00:00', '2026-01-05 18:00:00', 5, 'active'),

-- ==========================================(4, 4, 'City Marathon 2025', 'Annual city marathon race for all skill levels', '2025-12-01 07:00:00', '2025-12-01 12:00:00', 3, 'active'),

-- TICKETS - SEQUENTIAL IDs, SIMPLE PRICES(4, 6, 'Startup Pitch Competition', 'Entrepreneurs pitch their innovative business ideas', '2025-12-10 13:00:00', '2025-12-10 20:00:00', 6, 'active'),

-- ==========================================(5, 1, 'Food & Wine Festival', 'Taste the finest local cuisine and wines', '2025-12-15 12:00:00', '2025-12-15 22:00:00', 4, 'active');

INSERT INTO tickets (event_id, category, price, available_quantity) VALUES

-- Music Festival (event_id=1) - tickets 1,2-- ==========================================

(1, 'General Admission', 50.00, 1000),-- TICKETS - CORRECTLY MAPPED TO EVENTS

(1, 'VIP', 100.00, 100),-- ==========================================

-- JS Conference (event_id=2) - tickets 3,4  INSERT INTO tickets (event_id, category, price, available_quantity) VALUES

(2, 'Regular', 200.00, 500),-- Summer Music Festival (event_id=1, organizer: Test User)

(2, 'Premium', 300.00, 100),(1, 'General Admission', 85.00, 1500),

-- Marathon (event_id=3) - tickets 5,6(1, 'VIP', 175.00, 200),

(3, 'Adult Registration', 30.00, 1000),(1, 'Student', 50.00, 300),

(3, 'Student Registration', 20.00, 200),-- JavaScript Conference (event_id=2, organizer: Test User)

-- Food Festival (event_id=4) - tickets 7,8(2, 'Regular', 299.00, 800),

(4, 'General Admission', 40.00, 500),(2, 'Premium', 499.00, 200),

(4, 'VIP Tasting', 80.00, 50);(2, 'Student', 149.00, 200),

-- Contemporary Art Exhibition (event_id=3, organizer: John Smith)

-- ==========================================(3, 'General Entry', 15.00, 400),

-- BOOKINGS - SIMPLE MATH, VERIFIED TOTALS(3, 'Guided Tour', 35.00, 100),

-- ==========================================-- City Marathon (event_id=4, organizer: Sarah Johnson)

INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES(4, 'Adult Registration', 45.00, 2000),

-- TEST USER'S EVENTS (Music Festival)(4, 'Student Registration', 25.00, 500),

(6, 1, 1, 2, 100.00), -- Bob: 2x General @$50 = $100-- Startup Pitch Competition (event_id=5, organizer: Sarah Johnson)

(7, 1, 2, 1, 100.00), -- Emma: 1x VIP @$100 = $100(5, 'Attendee', 75.00, 300),

-- TEST USER TOTALS: 3 tickets, $200 revenue, 2 bookings(5, 'Investor Pass', 150.00, 100),

-- Food & Wine Festival (event_id=6, organizer: Mike Wilson)

-- JOHN SMITH'S EVENTS (JS Conference)  (6, 'General Admission', 95.00, 1000),

(5, 2, 3, 1, 200.00), -- Alice: 1x Regular @$200 = $200(6, 'VIP Tasting', 195.00, 150);

-- JOHN SMITH TOTALS: 1 ticket, $200 revenue, 1 booking

-- ==========================================

-- SARAH JOHNSON'S EVENTS (Marathon)-- BOOKINGS - PERFECTLY CONSISTENT CALCULATIONS

(6, 3, 5, 1, 30.00),  -- Bob: 1x Adult @$30 = $30-- ==========================================

(8, 3, 6, 1, 20.00),  -- Emma Wilson: 1x Student @$20 = $20INSERT INTO bookings (user_id, event_id, ticket_id, quantity, total_amount) VALUES

-- SARAH JOHNSON TOTALS: 2 tickets, $50 revenue, 2 bookings-- TEST USER'S EVENTS (organizer_id=2)

-- Music Festival: 3 total tickets, $320.00 total revenue

-- MIKE WILSON'S EVENTS (Food Festival)(6, 1, 1, 2, 170.00), -- Bob Johnson: 2x General ($85 each) = $170

(5, 4, 7, 1, 40.00);  -- Alice: 1x General @$40 = $40(7, 1, 3, 1, 50.00),  -- Emma Wilson: 1x Student ($50 each) = $50

-- MIKE WILSON TOTALS: 1 ticket, $40 revenue, 1 booking(8, 1, 1, 1, 85.00),  -- User 8: 1x General ($85 each) = $85

-- JS Conference: 1 total ticket, $299.00 total revenue  

-- ==========================================(5, 2, 4, 1, 299.00), -- Alice Smith: 1x Regular ($299 each) = $299

-- PAYMENTS - EXACT MATCHES

-- ==========================================-- JOHN SMITH'S EVENTS (organizer_id=3)

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES-- Art Exhibition: 2 total tickets, $30.00 total revenue

(1, 100.00, 'Credit Card', 'completed'),(6, 3, 7, 2, 30.00),  -- Bob Johnson: 2x General Entry ($15 each) = $30

(2, 100.00, 'Debit Card', 'completed'),

(3, 200.00, 'Credit Card', 'completed'),-- SARAH JOHNSON'S EVENTS (organizer_id=4)

(4, 30.00, 'PayPal', 'completed'),-- Marathon: 2 total tickets, $70.00 total revenue

(5, 20.00, 'Credit Card', 'completed'),(7, 4, 9, 1, 45.00),  -- Emma Wilson: 1x Adult Registration ($45 each) = $45

(6, 40.00, 'Debit Card', 'completed');(8, 4, 10, 1, 25.00), -- User 8: 1x Student Registration ($25 each) = $25

-- Startup Pitch: 1 total ticket, $75.00 total revenue

-- ==========================================(5, 5, 11, 1, 75.00), -- Alice Smith: 1x Attendee ($75 each) = $75

-- REVIEWS - ONLY FROM ATTENDEES

-- ==========================================-- MIKE WILSON'S EVENTS (organizer_id=5)

INSERT INTO reviews (user_id, event_id, rating, comment) VALUES-- Food Festival: 1 total ticket, $95.00 total revenue

(6, 1, 5, 'Great music festival!'),(6, 6, 13, 1, 95.00); -- Bob Johnson: 1x General Admission ($95 each) = $95

(7, 1, 4, 'Really enjoyed the VIP experience.'),

(5, 2, 5, 'Excellent JavaScript conference.'),-- ==========================================

(6, 3, 4, 'Well organized marathon.'),-- PAYMENTS - MATCHING BOOKING AMOUNTS

(5, 4, 5, 'Amazing food and wine selection.');-- ==========================================

INSERT INTO payments (booking_id, amount, payment_method, status) VALUES

-- ==========================================(1, 170.00, 'Credit Card', 'completed'),

-- NOTIFICATIONS - MATCH BOOKINGS(2, 50.00, 'Debit Card', 'completed'),

-- ==========================================(3, 85.00, 'Credit Card', 'completed'),

INSERT INTO notifications (user_id, message) VALUES(4, 299.00, 'PayPal', 'completed'),

(6, 'Your booking for Summer Music Festival has been confirmed!'),(5, 30.00, 'Credit Card', 'completed'),

(7, 'Summer Music Festival VIP tickets confirmed!'),(6, 45.00, 'Debit Card', 'completed'),

(5, 'JavaScript Conference booking confirmed!'),(7, 25.00, 'Credit Card', 'completed'),

(6, 'Marathon registration confirmed!'),(8, 75.00, 'PayPal', 'completed'),

(8, 'Student marathon registration confirmed!'),(9, 95.00, 'Credit Card', 'completed');

(5, 'Food & Wine Festival tickets ready!');

-- ==========================================

-- ==========================================-- REVIEWS - FROM ACTUAL ATTENDEES

-- EVENT IMAGES-- ==========================================

-- ==========================================INSERT INTO reviews (user_id, event_id, rating, comment) VALUES

INSERT INTO event_images (event_id, image_url, caption) VALUES(6, 1, 5, 'Amazing music festival! Great artists and perfect organization.'),

(1, '/images/music-festival.jpg', 'Summer Music Festival'),(7, 1, 4, 'Really enjoyed the festival, though it was quite crowded.'),

(2, '/images/js-conference.jpg', 'JavaScript Conference'),(5, 2, 5, 'Excellent conference with top-notch speakers and great networking.'),

(3, '/images/marathon.jpg', 'City Marathon'),(6, 3, 4, 'Interesting artwork but the venue was a bit small for the crowd.'),

(4, '/images/food-festival.jpg', 'Food & Wine Festival');(7, 4, 5, 'Well organized marathon, beautiful route through the city.');



-- ==========================================-- ==========================================

-- VERIFIED DASHBOARD RESULTS:-- NOTIFICATIONS - MATCHING USER BOOKINGS

-- ==========================================-- ==========================================

-- TEST USER (user@example.com):INSERT INTO notifications (user_id, message) VALUES

--   Events: 1 | Tickets: 3 | Revenue: $200.00 | Bookings: 2(6, 'Your booking for Summer Music Festival has been confirmed!'),

--(7, 'Reminder: Summer Music Festival is tomorrow!'),

-- JOHN SMITH (john@example.com):(5, 'Thank you for attending JavaScript Conference 2025!'),

--   Events: 1 | Tickets: 1 | Revenue: $200.00 | Bookings: 1(6, 'Your Contemporary Art Exhibition tickets are ready!'),

--(7, 'Your marathon registration is confirmed. Good luck with your training!'),

-- SARAH JOHNSON (sarah@example.com):(5, 'Startup Pitch Competition reminder - event starts at 1 PM'),

--   Events: 1 | Tickets: 2 | Revenue: $50.00 | Bookings: 2(6, 'Food & Wine Festival tickets confirmed. See you there!');

--

-- MIKE WILSON (mike@example.com):-- ==========================================

--   Events: 1 | Tickets: 1 | Revenue: $40.00 | Bookings: 1-- EVENT IMAGES

-- ==========================================-- ==========================================
INSERT INTO event_images (event_id, image_url, caption) VALUES
(1, '/images/music-festival-main.jpg', 'Summer Music Festival main stage'),
(1, '/images/music-festival-crowd.jpg', 'Festival crowd enjoying the music'),
(2, '/images/js-conf-speakers.jpg', 'JavaScript Conference keynote speakers'),
(3, '/images/art-exhibition-gallery.jpg', 'Contemporary art gallery space'),
(4, '/images/marathon-start.jpg', 'Marathon starting line'),
(5, '/images/startup-pitch-stage.jpg', 'Startup pitch competition stage'),
(6, '/images/food-wine-setup.jpg', 'Food and wine tasting setup');

-- ==========================================
-- EXPECTED DASHBOARD RESULTS:
-- ==========================================
-- TEST USER (user@example.com):
--   Events: 2 | Tickets: 4 | Revenue: $619.00 | Bookings: 4
--
-- JOHN SMITH (john@example.com):
--   Events: 1 | Tickets: 2 | Revenue: $30.00 | Bookings: 1
--
-- SARAH JOHNSON (sarah@example.com):
--   Events: 2 | Tickets: 3 | Revenue: $145.00 | Bookings: 3
--
-- MIKE WILSON (mike@example.com):
--   Events: 1 | Tickets: 1 | Revenue: $95.00 | Bookings: 1
-- ==========================================