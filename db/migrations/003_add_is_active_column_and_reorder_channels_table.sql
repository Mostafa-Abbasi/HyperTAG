-- db/migrations/003_add_is_active_column_and_reorder_channels_table.sql
-- Migration: Adds the is_active column to the Channels table and reorders columns

-- 1. Create a temporary table with the new column order
CREATE TABLE IF NOT EXISTS Channels_temp (
    channel_id INTEGER PRIMARY KEY,
    channel_name TEXT NOT NULL,
    channel_handle TEXT,
    is_active BOOLEAN DEFAULT TRUE, -- New column in desired position
    summary_feature BOOLEAN DEFAULT FALSE,
    bot_signature BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Copy data from the original Channels table to the temporary table, setting is_active to TRUE
INSERT INTO Channels_temp (channel_id, channel_name, channel_handle, summary_feature, bot_signature, created_at)
SELECT channel_id, channel_name, channel_handle, summary_feature, bot_signature, created_at
FROM Channels;

-- 3. Drop the original Channels table
DROP TABLE Channels;

-- 4. Rename the temporary table to Channels
ALTER TABLE Channels_temp RENAME TO Channels;
