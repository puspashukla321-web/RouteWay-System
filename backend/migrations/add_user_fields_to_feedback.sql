-- Migration script to add user information fields to feedback table
-- Run this if you have an existing feedback table without user fields

ALTER TABLE feedback ADD COLUMN user_name VARCHAR(100) NOT NULL DEFAULT 'Anonymous' AFTER id;
ALTER TABLE feedback ADD COLUMN user_email VARCHAR(150) NOT NULL DEFAULT 'unknown@example.com' AFTER user_name;
ALTER TABLE feedback ADD COLUMN user_contact VARCHAR(20) NULL AFTER user_email;

-- Update the default value constraint if you want (optional)
-- ALTER TABLE feedback MODIFY COLUMN user_name VARCHAR(100) NOT NULL;
-- ALTER TABLE feedback MODIFY COLUMN user_email VARCHAR(150) NOT NULL;
