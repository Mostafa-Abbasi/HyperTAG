-- version: 1
-- db/schema.sql

-- Users table
CREATE TABLE IF NOT EXISTS Users (
    user_id INTEGER PRIMARY KEY,
    user_name TEXT,
    user_handle TEXT,
    is_vip BOOLEAN DEFAULT FALSE,
    summary_feature BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Channels table
CREATE TABLE IF NOT EXISTS Channels (
    channel_id INTEGER PRIMARY KEY,
    channel_name TEXT NOT NULL,
    channel_handle TEXT,
    summary_feature BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities table
CREATE TABLE IF NOT EXISTS Activities (
    activity_id INTEGER PRIMARY KEY,
    activity_name TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- UserActivities table
CREATE TABLE IF NOT EXISTS UserActivities (
    user_activity_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    message_id INTEGER NOT NULL, 
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users (user_id),
    FOREIGN KEY (activity_id) REFERENCES Activities (activity_id)
);

-- ChannelActivities table
CREATE TABLE IF NOT EXISTS ChannelActivities (
    channel_activity_id INTEGER PRIMARY KEY,
    channel_id INTEGER NOT NULL,
    activity_id INTEGER NOT NULL,
    message_id INTEGER NOT NULL,
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (channel_id) REFERENCES Channels (channel_id),
    FOREIGN KEY (activity_id) REFERENCES Activities (activity_id)
);

-- Table to link Users and Channels
CREATE TABLE IF NOT EXISTS UserChannels (
    user_channel_id INTEGER PRIMARY KEY,
    user_id INTEGER NOT NULL,
    channel_id INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES Users(user_id),
    FOREIGN KEY (channel_id) REFERENCES Channels(channel_id),
    UNIQUE(user_id, channel_id) -- Ensure a user can link to a channel only once
);

-- Metrics table to store various metrics state (to decide later if we show them in graph stats or not)
CREATE TABLE IF NOT EXISTS Metrics (
    metric_id INTEGER PRIMARY KEY,
    metric_name TEXT NOT NULL, -- e.g., 'registered_users', 'active_users', 'new_users', ...
    metric_display BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP 
);

-- API Calls table to store API usage
CREATE TABLE IF NOT EXISTS ApiCalls (
    api_call_id INTEGER PRIMARY KEY,
    api_name TEXT NOT NULL, -- e.g., 'gemini', 'textrazor', 'openrouter'
    performed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- The time the API call was made
);

-- Table to store the schema version (for database migration)
CREATE TABLE IF NOT EXISTS SchemaVersion (
  version INTEGER PRIMARY KEY,
  applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
