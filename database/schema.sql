-- ============================================================================
-- EVENT HUB DATABASE SCHEMA - FULLY NORMALIZED (BCNF)
-- ============================================================================
-- 
-- KEY CHANGES FROM PREVIOUS SCHEMA:
-- 1. Split tickets into ticket_types (pricing) and tickets (individual ticket instances)
-- 2. Split bookings into bookings (order header) and booking_items (line items)
-- 3. Removed redundant sold_quantity - calculated from tickets table
-- 4. Cleaner separation of concerns
-- ============================================================================

-- Drop existing tables if they exist (in reverse dependency order)
DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS event_images CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS booking_items CASCADE;
DROP TABLE IF EXISTS bookings CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS ticket_types CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS venues CASCADE;
DROP TABLE IF EXISTS categories CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ============================================================================
-- TABLE: users
-- BCNF: {user_id} → {name, email, password, phone, role, date_created}
-- ============================================================================
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraints
    CONSTRAINT chk_email_format CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'),
    CONSTRAINT chk_phone_format CHECK (phone IS NULL OR phone ~* '^\+?[0-9]{10,15}$')
);

-- ============================================================================
-- TABLE: categories
-- BCNF: {category_id} → {name, description}
-- ============================================================================
CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_category_name_not_empty CHECK (TRIM(name) <> '')
);

-- ============================================================================
-- TABLE: venues
-- BCNF: {venue_id} → {name, address, city, capacity, contact_info}
-- ============================================================================
CREATE TABLE venues (
    venue_id SERIAL PRIMARY KEY,
    name VARCHAR(200) NOT NULL,
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    capacity INTEGER NOT NULL CHECK (capacity > 0),
    contact_info VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_venue_location UNIQUE (name, address),
    CONSTRAINT chk_venue_name_not_empty CHECK (TRIM(name) <> ''),
    CONSTRAINT chk_city_not_empty CHECK (TRIM(city) <> '')
);

-- ============================================================================
-- TABLE: events
-- BCNF: {event_id} → {organizer_id, venue_id, title, description, 
--                      start_date, end_date, category_id, status, created_at}
-- ============================================================================
CREATE TABLE events (
    event_id SERIAL PRIMARY KEY,
    organizer_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    venue_id INTEGER NOT NULL REFERENCES venues(venue_id) ON DELETE RESTRICT,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE RESTRICT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'completed')),
    cover_image TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_event_dates CHECK (end_date > start_date),
    CONSTRAINT chk_title_not_empty CHECK (TRIM(title) <> '')
);

-- ============================================================================
-- TABLE: ticket_types
-- BCNF: {event_id, category} → {price, max_quantity}
-- Defines pricing tiers for each event (e.g., VIP, General, Student)
-- ============================================================================
CREATE TABLE ticket_types (
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL,
    price DECIMAL(10,2) NOT NULL CHECK (price >= 0),
    max_quantity INTEGER NOT NULL DEFAULT 1000 CHECK (max_quantity > 0),
    
    PRIMARY KEY (event_id, category),
    CONSTRAINT chk_ticket_category_not_empty CHECK (TRIM(category) <> ''),
    CONSTRAINT chk_price_reasonable CHECK (price <= 100000.00)
);

-- ============================================================================
-- TABLE: tickets
-- BCNF: {ticket_id} → {event_id, category, created_at}
-- Individual ticket instances - one row per ticket sold
-- ============================================================================
CREATE TABLE tickets (
    ticket_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL,
    category VARCHAR(50) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (event_id, category) REFERENCES ticket_types(event_id, category) ON DELETE CASCADE
);

-- ============================================================================
-- TABLE: bookings
-- BCNF: {booking_id} → {user_id, booking_date, status}
-- Order header - represents a booking transaction
-- ============================================================================
CREATE TABLE bookings (
    booking_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    booking_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'refunded'))
);

-- ============================================================================
-- TABLE: booking_items
-- BCNF: {booking_id, ticket_id} → {quantity, price_at_purchase}
-- Order line items - links bookings to tickets with purchase details
-- ============================================================================
CREATE TABLE booking_items (
    booking_id INTEGER NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    ticket_id INTEGER NOT NULL REFERENCES tickets(ticket_id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    price_at_purchase DECIMAL(10,2) NOT NULL CHECK (price_at_purchase >= 0),
    
    PRIMARY KEY (booking_id, ticket_id)
);

-- ============================================================================
-- TABLE: payments
-- BCNF: {payment_id} → {booking_id, payment_date, amount, payment_method, status}
-- ============================================================================
CREATE TABLE payments (
    payment_id SERIAL PRIMARY KEY,
    booking_id INTEGER UNIQUE NOT NULL REFERENCES bookings(booking_id) ON DELETE CASCADE,
    payment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    payment_method VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    
    CONSTRAINT chk_payment_method_valid CHECK (payment_method IN ('Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash'))
);

-- ============================================================================
-- TABLE: reviews
-- BCNF: {review_id} → {user_id, event_id, rating, comment, review_date}
-- ============================================================================
CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    review_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_user_event_review UNIQUE (user_id, event_id)
);

-- ============================================================================
-- TABLE: event_images
-- BCNF: {image_id} → {event_id, image_url, caption, created_at}
-- ============================================================================
CREATE TABLE event_images (
    image_id SERIAL PRIMARY KEY,
    event_id INTEGER NOT NULL REFERENCES events(event_id) ON DELETE CASCADE,
    image_url VARCHAR(500) NOT NULL,
    caption VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_event_image_url UNIQUE (event_id, image_url),
    CONSTRAINT chk_image_url_not_empty CHECK (TRIM(image_url) <> '')
);

-- ============================================================================
-- PERFORMANCE INDEXES
-- ============================================================================

-- User queries
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);

-- Event queries
CREATE INDEX idx_events_organizer ON events(organizer_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_date_range ON events(start_date, end_date);
CREATE INDEX idx_events_status ON events(status);

-- Ticket queries
CREATE INDEX idx_tickets_event_category ON tickets(event_id, category);

-- Booking queries
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_booking_items_ticket ON booking_items(ticket_id);

-- Payment queries
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_date ON payments(payment_date);

-- Review queries
CREATE INDEX idx_reviews_event ON reviews(event_id);
CREATE INDEX idx_reviews_user ON reviews(user_id);
CREATE INDEX idx_reviews_rating ON reviews(rating);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger: Validate review eligibility (user must have booked the event)
CREATE OR REPLACE FUNCTION validate_review_eligibility()
RETURNS TRIGGER AS $$
DECLARE
    has_booking BOOLEAN;
BEGIN
    SELECT EXISTS(
        SELECT 1 
        FROM bookings b
        JOIN booking_items bi ON b.booking_id = bi.booking_id
        JOIN tickets t ON bi.ticket_id = t.ticket_id
        WHERE b.user_id = NEW.user_id 
        AND t.event_id = NEW.event_id
        AND b.status = 'confirmed'
    ) INTO has_booking;
    
    IF NOT has_booking THEN
        RAISE EXCEPTION 'User must have a confirmed booking to review this event';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_review_eligibility
    BEFORE INSERT ON reviews
    FOR EACH ROW EXECUTE FUNCTION validate_review_eligibility();

-- Trigger: Validate payment amount matches booking total
CREATE OR REPLACE FUNCTION validate_payment_amount()
RETURNS TRIGGER AS $$
DECLARE
    booking_total DECIMAL(10,2);
BEGIN
    SELECT COALESCE(SUM(bi.price_at_purchase * bi.quantity), 0) INTO booking_total
    FROM booking_items bi
    WHERE bi.booking_id = NEW.booking_id;
    
    IF NEW.amount != booking_total THEN
        RAISE EXCEPTION 'Payment amount (%) does not match booking total (%)', NEW.amount, booking_total;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_validate_payment_amount
    BEFORE INSERT OR UPDATE ON payments
    FOR EACH ROW EXECUTE FUNCTION validate_payment_amount();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View: Event statistics with ticket counts
CREATE OR REPLACE VIEW view_event_statistics AS
SELECT 
    e.event_id,
    e.title,
    e.organizer_id,
    u.name AS organizer_name,
    c.name AS category,
    v.name AS venue_name,
    v.city,
    e.start_date,
    e.end_date,
    e.status,
    COUNT(DISTINCT t.ticket_id) AS total_tickets_sold,
    COALESCE(SUM(bi.price_at_purchase * bi.quantity), 0) AS total_revenue,
    COALESCE(AVG(r.rating), 0) AS average_rating,
    COUNT(DISTINCT r.review_id) AS total_reviews,
    COUNT(DISTINCT b.user_id) AS unique_attendees
FROM events e
LEFT JOIN users u ON e.organizer_id = u.user_id
LEFT JOIN categories c ON e.category_id = c.category_id
LEFT JOIN venues v ON e.venue_id = v.venue_id
LEFT JOIN tickets t ON e.event_id = t.event_id
LEFT JOIN booking_items bi ON t.ticket_id = bi.ticket_id
LEFT JOIN bookings b ON bi.booking_id = b.booking_id AND b.status = 'confirmed'
LEFT JOIN reviews r ON e.event_id = r.event_id
GROUP BY e.event_id, e.title, e.organizer_id, u.name, c.name, v.name, v.city, 
         e.start_date, e.end_date, e.status;

-- View: Organizer dashboard statistics
CREATE OR REPLACE VIEW view_organizer_statistics AS
SELECT 
    u.user_id AS organizer_id,
    u.name AS organizer_name,
    COUNT(DISTINCT e.event_id) AS total_events,
    COUNT(DISTINCT CASE WHEN e.status = 'active' THEN e.event_id END) AS active_events,
    COUNT(DISTINCT t.ticket_id) AS total_tickets_sold,
    COALESCE(SUM(bi.price_at_purchase * bi.quantity), 0) AS total_revenue
FROM users u
LEFT JOIN events e ON u.user_id = e.organizer_id
LEFT JOIN tickets t ON e.event_id = t.event_id
LEFT JOIN booking_items bi ON t.ticket_id = bi.ticket_id
LEFT JOIN bookings b ON bi.booking_id = b.booking_id AND b.status = 'confirmed'
GROUP BY u.user_id, u.name;

-- View: Available tickets per event per category
CREATE OR REPLACE VIEW view_ticket_availability AS
SELECT 
    tt.event_id,
    e.title AS event_title,
    tt.category,
    tt.price,
    COUNT(t.ticket_id) AS tickets_sold
FROM ticket_types tt
JOIN events e ON tt.event_id = e.event_id
LEFT JOIN tickets t ON tt.event_id = t.event_id AND tt.category = t.category
GROUP BY tt.event_id, e.title, tt.category, tt.price;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts with role-based access control';
COMMENT ON TABLE categories IS 'Event categories for classification';
COMMENT ON TABLE venues IS 'Physical locations where events are held';
COMMENT ON TABLE events IS 'Main events table';
COMMENT ON TABLE ticket_types IS 'Pricing tiers per event (e.g., VIP, General, Student)';
COMMENT ON TABLE tickets IS 'Individual ticket instances - one row per ticket';
COMMENT ON TABLE bookings IS 'Booking transaction headers';
COMMENT ON TABLE booking_items IS 'Booking line items linking bookings to tickets';
COMMENT ON TABLE payments IS 'Payment transactions (1-to-1 with bookings)';
COMMENT ON TABLE reviews IS 'User reviews and ratings for events';
COMMENT ON TABLE event_images IS 'Image gallery for events';

-- ============================================================================
-- NORMALIZATION VERIFICATION
-- ============================================================================
-- 
-- ✓ 1NF: All attributes are atomic, no repeating groups
-- ✓ 2NF: No partial dependencies (all PKs are single or proper composites)
-- ✓ 3NF: No transitive dependencies
-- ✓ BCNF: Every determinant is a candidate key
--
-- KEY IMPROVEMENTS FROM OLD SCHEMA:
-- 1. ticket_types + tickets separation eliminates redundancy
-- 2. bookings + booking_items follows order header/detail pattern
-- 3. Removes sold_quantity column - now derived from tickets count
-- 4. Cleaner referential integrity with composite foreign keys
-- ============================================================================