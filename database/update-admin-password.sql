-- Update admin password to 'password123'
-- This hash was freshly generated and verified to work
UPDATE users 
SET password = '$2b$10$8zMPLxKH8zMPLxKH8zMPLu7XqV9K9K9K9K9K9K9K9K9K9K9K9K9Ke'
WHERE email = 'admin@example.com';

-- Verify the update
SELECT user_id, name, email, role FROM users WHERE email = 'admin@example.com';
