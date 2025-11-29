-- Migration: Add ticket_types for existing events that don't have them
-- This will create a default "General" ticket type for events without ticket_types

INSERT INTO ticket_types (event_id, category, price, max_quantity)
SELECT 
    e.event_id,
    'General' as category,
    COALESCE(e.capacity, 100) * 50.00 as price,  -- Default price of $50
    COALESCE(e.capacity, 100) as max_quantity
FROM events e
WHERE NOT EXISTS (
    SELECT 1 FROM ticket_types tt WHERE tt.event_id = e.event_id
);

-- Show the results
SELECT e.event_id, e.title, tt.category, tt.price, tt.max_quantity
FROM events e
LEFT JOIN ticket_types tt ON e.event_id = tt.event_id
ORDER BY e.event_id;
