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
INSERT INTO users (name, email, password, phone, role) VALUES 
('Admin User', 'admin@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234567', 'admin'),
('Ali Ahmed', 'ali.ahmed@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234568', 'user'),
('Fatima Khan', 'fatima.khan@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234569', 'user'),
('Hassan Malik', 'hassan.malik@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234570', 'user'),
('Ayesha Siddiqui', 'ayesha.siddiqui@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234571', 'user'),
('Bilal Hussain', 'bilal.hussain@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234572', 'user'),
('Zainab Ali', 'zainab.ali@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234573', 'user'),
('Usman Sheikh', 'usman.sheikh@example.com', '$2b$10$rr2gz/EaevroR2G3w007F.hn9qtBDN2E9gdIdGg4GFA0539SPDm3C', '+923001234574', 'user');

-- Venues
INSERT INTO venues (name, address, city, capacity, contact_info) VALUES 
('Grand Convention Center', 'Teen Talwar', 'Karachi', 5000, 'info@grandconvention.com'),
('Tech Hub Auditorium', 'Shaheen complex', 'Karachi', 1500, 'events@techhub.com'),
('Downtown Music Hall', 'Tariq road', 'Karachi', 3000, 'bookings@musichall.com'),
('Sports Arena Complex', 'Millinium mall', 'Karachi', 10000, 'events@sportarena.com'),
('Cultural Arts Center', 'Bahria Town', 'Rawalpindi', 800, 'info@culturalarts.com'),
('Business Conference Center', 'Sector -14A', 'Islamabad', 2000, 'meetings@bizconf.com');

-- Events
INSERT INTO events (organizer_id, venue_id, title, description, start_date, end_date, category_id, status) VALUES 
(2, 1, 'Summer Music Festival 2025', 'A fantastic outdoor music festival', '2025-12-20 14:00:00', '2025-12-20 23:00:00', 1, 'active'),
(3, 2, 'JavaScript Conference 2025', 'Learn the latest in JavaScript development', '2025-12-25 09:00:00', '2025-12-25 17:00:00', 2, 'active'),
(4, 3, 'City Marathon 2025', 'Annual city marathon race', '2026-01-10 07:00:00', '2026-01-10 12:00:00', 3, 'active'),
(5, 4, 'Food & Wine Festival', 'Taste the finest local cuisine', '2026-01-15 12:00:00', '2026-01-15 22:00:00', 4, 'active');

-- ============================================================================
-- TICKET TYPES - Define pricing tiers for each event
-- ============================================================================
INSERT INTO ticket_types (event_id, category, price, max_quantity) VALUES 
-- Music Festival (event_id=1)
(1, 'General Admission', 50.00, 1000),
(1, 'VIP', 100.00, 100),
-- JavaScript Conference (event_id=2)
(2, 'Regular', 200.00, 500),
(2, 'Premium', 300.00, 100),
-- Marathon (event_id=3)
(3, 'Adult Registration', 30.00, 1000),
(3, 'Student Registration', 20.00, 200),
-- Food & Wine Festival (event_id=4)
(4, 'General Admission', 40.00, 500),
(4, 'VIP Tasting', 80.00, 50);

-- ============================================================================
-- TICKETS - Individual ticket instances (representing sold tickets)
-- ============================================================================
-- For demo purposes, we'll create tickets as part of bookings below
-- In a real application, tickets would be created when users book

-- ============================================================================
-- BOOKINGS - Order headers
-- ============================================================================
INSERT INTO bookings (user_id, booking_date, status) VALUES 
-- Alice's bookings
(6, '2025-10-01 10:00:00', 'confirmed'),  -- booking_id=1
-- Bob's bookings  
(7, '2025-10-01 11:00:00', 'confirmed'),  -- booking_id=2
-- Mike's bookings
(5, '2025-10-02 09:00:00', 'confirmed'),  -- booking_id=3
-- Alice's second booking
(6, '2025-10-02 14:00:00', 'confirmed'),  -- booking_id=4
-- Emma's bookings
(8, '2025-10-03 10:00:00', 'confirmed'),  -- booking_id=5
-- Mike's second booking
(5, '2025-10-03 15:00:00', 'confirmed');  -- booking_id=6

-- ============================================================================
-- TICKETS - Create individual ticket instances for bookings
-- ============================================================================
INSERT INTO tickets (event_id, category) VALUES 
-- Booking 1: Alice - Music Festival, 2x General
(1, 'General Admission'),  -- ticket_id=1
(1, 'General Admission'),  -- ticket_id=2
-- Booking 2: Bob - Music Festival, 1x VIP
(1, 'VIP'),                -- ticket_id=3
-- Booking 3: Mike - JS Conference, 1x Regular
(2, 'Regular'),            -- ticket_id=4
-- Booking 4: Alice - Marathon, 1x Adult
(3, 'Adult Registration'), -- ticket_id=5
-- Booking 5: Emma - Marathon, 1x Student  
(3, 'Student Registration'),  -- ticket_id=6
-- Booking 6: Mike - Food Festival, 1x General
(4, 'General Admission');  -- ticket_id=7

-- ============================================================================
-- BOOKING ITEMS - Link bookings to tickets with purchase details
-- ============================================================================
INSERT INTO booking_items (booking_id, ticket_id, quantity, price_at_purchase) VALUES 
-- Booking 1: Alice - Music Festival, 2x General @ $50 = $100
(1, 1, 1, 50.00),
(1, 2, 1, 50.00),
-- Booking 2: Bob - Music Festival, 1x VIP @ $100 = $100
(2, 3, 1, 100.00),
-- Booking 3: Mike - JS Conference, 1x Regular @ $200 = $200
(3, 4, 1, 200.00),
-- Booking 4: Alice - Marathon, 1x Adult @ $30 = $30
(4, 5, 1, 30.00),
-- Booking 5: Emma - Marathon, 1x Student @ $20 = $20
(5, 6, 1, 20.00),
-- Booking 6: Mike - Food Festival, 1x General @ $40 = $40
(6, 7, 1, 40.00);

-- ============================================================================
-- PAYMENTS - One payment per booking
-- ============================================================================
INSERT INTO payments (booking_id, amount, payment_method, status) VALUES 
(1, 100.00, 'Credit Card', 'completed'),
(2, 100.00, 'Debit Card', 'completed'),
(3, 200.00, 'Credit Card', 'completed'),
(4, 30.00, 'PayPal', 'completed'),
(5, 20.00, 'Credit Card', 'completed'),
(6, 40.00, 'Debit Card', 'completed');

-- ============================================================================
-- REVIEWS - Only from attendees
-- ============================================================================
INSERT INTO reviews (user_id, event_id, rating, comment) VALUES 
(6, 1, 5, 'Great music festival!'),
(7, 1, 4, 'Really enjoyed the VIP experience.'),
(5, 2, 5, 'Excellent JavaScript conference.'),
(6, 3, 4, 'Well organized marathon.'),
(5, 4, 5, 'Amazing food and wine selection.');

-- ============================================================================
-- EVENT IMAGES
-- ============================================================================
INSERT INTO event_images (event_id, image_url, caption) VALUES 
(1, '/images/music-festival.jpg', 'Summer Music Festival'),
(2, '/images/js-conference.jpg', 'JavaScript Conference'),
(3, '/images/marathon.jpg', 'City Marathon'),
(4, '/images/food-festival.jpg', 'Food & Wine Festival');

-- ============================================================================
-- EXPECTED DASHBOARD RESULTS:
-- ============================================================================
-- TEST USER (user_id=2, user@example.com) - Organizer of Music Festival:
--   Events: 1
--   Tickets Sold: 3 (Alice:2, Bob:1)
--   Revenue: $200.00
--
-- JOHN SMITH (user_id=3, john@example.com) - Organizer of JS Conference:
--   Events: 1
--   Tickets Sold: 1 (Mike:1)
--   Revenue: $200.00
--
-- SARAH JOHNSON (user_id=4, sarah@example.com) - Organizer of Marathon:
--   Events: 1
--   Tickets Sold: 2 (Alice:1, Emma:1)
--   Revenue: $50.00
--
-- MIKE WILSON (user_id=5, mike@example.com) - Organizer of Food Festival:
--   Events: 1
--   Tickets Sold: 1 (Mike himself:1)
--   Revenue: $40.00
-- ============================================================================
