-- db/migrations/002_add_is_active_column_and_reorder_users_table.sql
-- Migration: Adds the is_active column to the Users table and reorders columns

-- 1. Create a temporary table with the new column order
CREATE TABLE IF NOT EXISTS Users_temp (
    user_id INTEGER PRIMARY KEY,
    user_name TEXT,
    user_handle TEXT,
    is_active BOOLEAN DEFAULT TRUE, -- New column in desired position
    is_vip BOOLEAN DEFAULT FALSE,
    summary_feature BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Copy data from the original Users table to the temporary table, setting is_active to TRUE
INSERT INTO Users_temp (user_id, user_name, user_handle, is_vip, summary_feature, created_at)
SELECT user_id, user_name, user_handle, is_vip, summary_feature, created_at
FROM Users;

-- 3. Drop the original Users table
DROP TABLE Users;

-- 4. Rename the temporary table to Users
ALTER TABLE Users_temp RENAME TO Users;
