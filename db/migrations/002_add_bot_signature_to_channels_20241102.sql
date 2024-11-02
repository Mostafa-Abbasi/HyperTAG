-- db/migrations/002_add_bot_signature_to_channels_20241102.sql
-- Purpose: adding the bot_signature column to the channels table (default = TRUE)

-- Adding bot_signature column to Channels table
ALTER TABLE Channels
ADD COLUMN bot_signature BOOLEAN DEFAULT TRUE;