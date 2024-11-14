// db/database.js

import { promisify } from "util";
import initializeDatabase from "./init.js";
import applyMigrations from "./migrationManager.js";
import initializeTablesWithDefaultValues from "./initialData.js";
import config from "../src/config/index.js";
import logger from "../src/utils/logger.js";

// Placeholder for the database instance
let db;

// Initialize the database and store the instance
const initializeDb = async () => {
  return new Promise((resolve, reject) => {
    initializeDatabase(async (database) => {
      db = database;
      // Promisify db operations
      db.getAsync = promisify(db.get).bind(db);
      db.runAsync = promisify(db.run).bind(db);
      db.allAsync = promisify(db.all).bind(db);
      db.execAsync = promisify(db.exec).bind(db);

      try {
        await applyMigrations(db); // Run the migrations based on db version
        await initializeTables();
        resolve();
      } catch (err) {
        logger.error("Database initialization failed:", err);
        reject(err);
      }
    });
  });
};

// Function to initialize tables
const initializeTables = async () => {
  try {
    await initializeTablesWithDefaultValues(db);
    // Add other table initialization calls here
    // e.g., await initializeUsersTable(db);
  } catch (err) {
    logger.error("Error initializing tables:", err);
    throw err;
  }
};

// Access to the database instance from other modules
const getDatabaseInstance = () => {
  if (!db) {
    throw new Error("Database not initialized. Call initializeDatabase first.");
  }
  return db;
};

///////////////////////////////////////////////////////////////////////////////

// Function to check if the user exists and insert if not
async function checkAndInsertUser(message) {
  const userId = message.from.id;
  const userName = `${message.from.first_name || ""} ${
    message.from.last_name || ""
  }`.trim();
  const userHandle = message.from.username || "";
  const currentTime = new Date().toISOString();

  try {
    const user = await db.getAsync("SELECT * FROM Users WHERE user_id = ?", [
      userId,
    ]);

    if (!user) {
      await db.runAsync(
        "INSERT INTO Users (user_id, user_name, user_handle, created_at) VALUES (?, ?, ?, ?)",
        [userId, userName, userHandle, currentTime]
      );
    }
  } catch (err) {
    logger.error("Error checking and inserting user:", err);
  }
}

// Function to check if the channel exists and insert if not
async function checkAndInsertChannel(message) {
  const channelId = message.chat.id;
  const channelName = message.chat.title || "";
  const channelHandle = message.chat.username || ""; // if a channel doesn't have a username, then it's a private channel
  const currentTime = new Date().toISOString();

  try {
    const channel = await db.getAsync(
      "SELECT * FROM Channels WHERE channel_id = ?",
      [channelId]
    );

    if (!channel) {
      await db.runAsync(
        "INSERT INTO Channels (channel_id, channel_name, channel_handle, created_at) VALUES (?, ?, ?, ?)",
        [channelId, channelName, channelHandle, currentTime]
      );
    }
  } catch (err) {
    logger.error("Error checking and inserting channel:", err);
  }
}

async function recordUserActivity(userId, messageId, activityId) {
  try {
    const currentTime = new Date().toISOString();
    await db.runAsync(
      "INSERT INTO UserActivities (user_id, activity_id, message_id, performed_at) VALUES (?, ?, ?, ?)",
      [userId, activityId, messageId, currentTime]
    );
  } catch (err) {
    logger.error("Error recording user activity:", err);
  }
}

async function deleteUserActivity(userId, messageId) {
  try {
    await db.runAsync(
      "DELETE FROM UserActivities WHERE user_id = ? AND message_id = ?",
      [userId, messageId]
    );
  } catch (err) {
    logger.error("Error deleting user activity:", err);
  }
}

async function recordChannelActivity(channelId, messageId, activityId) {
  try {
    const currentTime = new Date().toISOString();
    await db.runAsync(
      "INSERT INTO ChannelActivities (channel_id, message_id, activity_id, performed_at) VALUES (?, ?, ?, ?)",
      [channelId, messageId, activityId, currentTime]
    );
  } catch (err) {
    logger.error("Error recording channel activity:", err);
  }
}

async function deleteChannelActivity(channelId, messageId) {
  try {
    await db.runAsync(
      "DELETE FROM ChannelActivities WHERE channel_id = ? AND message_id = ?",
      [channelId, messageId]
    );
  } catch (err) {
    logger.error("Error deleting channel activity:", err);
  }
}

// Function to record the usage of APIs
// API names: gemini, textrazor, openrouter
async function recordApiUsage(apiName) {
  try {
    // e.g. when we call to gemini, a record will be added to this table
    const currentTime = new Date().toISOString();
    await db.runAsync(
      "INSERT INTO ApiCalls (api_name, performed_at) VALUES (?, ?)",
      [apiName, currentTime]
    );
  } catch (err) {
    logger.error("Error recording API usage:", err);
  }
}

/////////////////////////////////////////////////////////////
// RATE LIMIT

// Function to link a user to a channel
async function connectUserToChannel(userId, channelId) {
  try {
    const currentTime = new Date().toISOString();

    await db.runAsync(
      "INSERT INTO UserChannels (user_id, channel_id, created_at) VALUES (?, ?, ?)",
      [userId, channelId, currentTime]
    );

    // updating the channel status to active
    await db.runAsync(
      "UPDATE Channels SET is_active = ? WHERE channel_id = ?",
      [true, channelId]
    );
  } catch (err) {
    if (err.code === "SQLITE_CONSTRAINT") {
      logger.error("User is already connected to this channel.");
    } else {
      logger.error("Error connecting user to channel:", err);
    }
  }
}

// Function to unlink a user from a channel
async function disconnectUserFromChannel(userId, channelId) {
  try {
    // used in the case of /disconnect
    if (userId) {
      // deleting the connection between the user and channel
      await db.runAsync(
        "DELETE FROM UserChannels WHERE user_id = ? AND channel_id = ?",
        [userId, channelId]
      );

      // updating the channel status to not active
      await db.runAsync(
        "UPDATE Channels SET is_active = ? WHERE channel_id = ?",
        [false, channelId]
      );

      // used in the case of /claim
    } else {
      await db.runAsync("DELETE FROM UserChannels WHERE channel_id = ?", [
        channelId,
      ]);
    }
  } catch (err) {
    logger.error("Error disconnecting user from channel:", err);
  }
}

// Check if the channel is already connected to any user
async function isChannelConnectedToAnotherUser(userId, channelId) {
  try {
    const existingChannel = await db.getAsync(
      "SELECT user_id FROM UserChannels WHERE channel_id = ?",
      [channelId]
    );

    if (existingChannel) {
      if (existingChannel.user_id === userId) {
        return false; // Channel is connected to the same user
      } else {
        logger.info(
          `Channel ${channelId} is already connected to another user.`
        );
        return true; // Channel is connected to a different user
      }
    }

    return false; // Channel is not connected to any user
  } catch (err) {
    logger.error("Error checking channel connection:", err);
    return true; // Treat error case as if channel is connected to prevent further action
  }
}

// Function to check if the current user that is requesting, already connected his account to the channel or not
async function isChannelConnectedToCurrentUser(userId, channelId) {
  try {
    const row = await db.getAsync(
      "SELECT * FROM UserChannels WHERE user_id = ? AND channel_id = ?",
      [userId, channelId]
    );
    return !!row;
  } catch (err) {
    logger.error("Error checking user-channel connection:", err);
    return false;
  }
}

// Function to check if the user is VIP and if they have reached their channel limit
async function isUserAllowedToConnectMoreChannels(userId) {
  try {
    const userChannels = await getUserChannels(userId);
    const isVIP = await isUserVIP(userId);
    const maxAllowedChannelsToConnect = isVIP
      ? config.rateLimitingOptions.maxConnectedChannelsVip
      : config.rateLimitingOptions.maxConnectedChannels;

    if (userChannels.length >= maxAllowedChannelsToConnect) {
      logger.error(
        "User is already connected to the maximum number of channels."
      );
      return {
        isAllowed: false,
        maxAllowedChannelsToConnect,
      };
    } else {
      logger.info("User is allowed to connect more channels.");
      return {
        isAllowed: true,
        maxAllowedChannelsToConnect,
      };
    }
  } catch (err) {
    logger.error("Error checking user permission to add more channels:", err);
    return {
      isAllowed: true,
      maxAllowedChannelsToConnect,
    };
  }
}

// Function to get all users from the database
async function getAllUsers() {
  try {
    // Fetch all users from the Users table
    const users = await db.allAsync("SELECT * FROM Users");

    if (!users || users.length === 0) {
      logger.info("No users found in the database.");
      return [];
    }

    return users;
  } catch (error) {
    logger.error("Error fetching users from database:", error);
    return [];
  }
}

// Function to update the user's status in the database
async function updateUserStatus(userId, status) {
  const isActive = status === "active" ? 1 : 0;

  try {
    await db.runAsync("UPDATE Users SET is_active = ? WHERE user_id = ?", [
      isActive,
      userId,
    ]);

    // check if user has any connected channels and if so, set those channels' status to not active
    const userChannels = await getUserChannels(userId);

    if (userChannels.length !== 0) {
      for (const channel of userChannels) {
        // updating the channel status to not active
        await db.runAsync(
          "UPDATE Channels SET is_active = ? WHERE channel_id = ?",
          [false, channel.channel_id]
        );
      }
    }
  } catch (err) {
    logger.error(`Error updating user status for user ID ${userId}:`, err);
  }
}

// Function to get all channels from the database
async function getAllChannels() {
  try {
    // Fetch all channels from the Channels table
    const channels = await db.allAsync("SELECT * FROM Channels");

    if (!channels || channels.length === 0) {
      logger.info("No channels found in the database.");
      return [];
    }

    return channels;
  } catch (error) {
    logger.error("Error fetching channels from database:", error);
    return [];
  }
}

// Function to update the channel's status in the database
async function updateChannelStatus(channelId, status) {
  const isActive = status === "active" ? 1 : 0;

  try {
    await db.runAsync(
      "UPDATE Channels SET is_active = ? WHERE channel_id = ?",
      [isActive, channelId]
    );
  } catch (err) {
    logger.error(
      `Error updating channel status for channel ID ${channelId}:`,
      err
    );
  }
}

// Function to get all channels connected to a user
async function getUserChannels(userId) {
  try {
    const rows = await db.allAsync(
      `SELECT *
      FROM 
        UserChannels 
      INNER JOIN 
        Channels 
      ON 
        UserChannels.channel_id = Channels.channel_id 
      WHERE 
        UserChannels.user_id = ?`,
      [userId]
    );
    return rows;
  } catch (err) {
    logger.error("Error retrieving user channels:", err);
    return [];
  }
}

// Function to get user details by user ID
async function getUserDetailsByUserId(userId) {
  try {
    // Fetch user details from the Users table
    const userDetailsRow = await db.getAsync(
      "SELECT user_id, user_name, user_handle, is_vip, summary_feature, created_at FROM Users WHERE user_id = ?",
      [userId]
    );

    if (userDetailsRow) {
      return userDetailsRow; // Return the user details object
    } else {
      logger.info(`User with ID ${userId} not found in Users table.`);
      return null; // Return null if the user is not found
    }
  } catch (err) {
    logger.error(`Error retrieving user details for user ID ${userId}:`, err);
    return null; // Return null in case of an error
  }
}

// Function to get user details by channel ID
async function getUserDetailsByChannelId(channelId) {
  try {
    // Step 1: Get the user_id from UserChannels based on channelId
    const userChannelRow = await db.getAsync(
      "SELECT user_id FROM UserChannels WHERE channel_id = ?",
      [channelId]
    );

    if (userChannelRow) {
      const userId = userChannelRow.user_id;

      // Step 2: Get the user details from the Users table using the user_id
      const userDetailsRow = await db.getAsync(
        "SELECT user_id, user_name, user_handle, is_vip, summary_feature, created_at FROM Users WHERE user_id = ?",
        [userId]
      );

      if (userDetailsRow) {
        return userDetailsRow; // Return the user details object
      } else {
        logger.info(`User ID ${userId} not found in Users table.`);
        return null; // Return null if the user is not found in the Users table
      }
    } else {
      logger.info(`No user found for channel ID ${channelId}`);
      return null; // Return null if no user is associated with the channel
    }
  } catch (err) {
    logger.error(
      `Error retrieving user details for channel ID ${channelId}:`,
      err
    );
    return null; // Return null in case of an error
  }
}

// Function to get channel details by channel ID
async function getChannelDetailsByChannelId(channelId) {
  try {
    // Fetch channel details from the Channels table
    const channelDetailsRow = await db.getAsync(
      "SELECT channel_id, channel_name, channel_handle, summary_feature, bot_signature, created_at FROM Channels WHERE channel_id = ?",
      [channelId]
    );

    if (channelDetailsRow) {
      return channelDetailsRow; // Return the channel details object
    } else {
      logger.info(`Channel with ID ${channelId} not found in Channels table.`);
      return null; // Return null if the channel is not found
    }
  } catch (err) {
    logger.error(
      `Error retrieving channel details for channel ID ${channelId}:`,
      err
    );
    return null; // Return null in case of an error
  }
}

// Function to check user rate limit
async function checkUserRateLimit(userId) {
  const now = new Date();

  // Start of the day in UTC (00:00 UTC)
  const startOfDayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  ).toISOString(); // Convert to ISO string for DB query

  try {
    // Use the extracted function to check if the user is a VIP
    const isVIP = await isUserVIP(userId);

    // Determine the appropriate rate limit based on VIP status
    const rateLimit = isVIP
      ? config.rateLimitingOptions.privateVipRateLimit
      : config.rateLimitingOptions.privateRateLimit;

    // Count the number of activities the user has performed today in UTC
    const activities = await db.getAsync(
      "SELECT COUNT(*) as activityCount FROM UserActivities WHERE user_id = ? AND performed_at > ?",
      [userId, startOfDayUTC]
    );

    // Determine if the user has tokens left based on their rate limit
    const hasTokensLeft = activities.activityCount <= rateLimit;

    return {
      hasTokensLeft,
      numUsedTokens: activities.activityCount,
      numAllTokens: rateLimit,
    };
  } catch (err) {
    logger.error("Error checking rate limit:", err);
    return {
      hasTokensLeft: false,
      numUsedTokens: "",
      numAllTokens: "",
    };
  }
}

// Function to check channel rate limit
async function checkChannelRateLimit(channelId) {
  const now = new Date();

  // Start of the day in UTC (00:00 UTC)
  const startOfDayUTC = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)
  ).toISOString(); // Convert to ISO string for DB query

  try {
    // Step 1: Find the user associated with the channel
    const userChannel = await db.getAsync(
      "SELECT user_id FROM UserChannels WHERE channel_id = ?",
      [channelId]
    );

    if (!userChannel) {
      throw new Error(`No user found for channel ID ${channelId}`);
    }

    const userId = userChannel.user_id;

    // Step 2: Check if the user is VIP
    const isVIP = await isUserVIP(userId);

    // Step 3: Determine the appropriate rate limit based on VIP status
    const rateLimit = isVIP
      ? config.rateLimitingOptions.channelVipRateLimit
      : config.rateLimitingOptions.channelRateLimit;

    // Count the number of activities the channel has performed today in UTC
    const activities = await db.getAsync(
      "SELECT COUNT(*) as activityCount FROM ChannelActivities WHERE channel_id = ? AND performed_at > ?",
      [channelId, startOfDayUTC]
    );

    // Determine if the channel has tokens left based on their rate limit
    const hasTokensLeft = activities.activityCount <= rateLimit;

    return {
      hasTokensLeft,
      numUsedTokens: activities.activityCount,
      numAllTokens: rateLimit,
    };
  } catch (err) {
    logger.error("Error checking channel rate limit:", err);
    return {
      hasTokensLeft: false,
      numUsedTokens: "",
      numAllTokens: "",
    };
  }
}

async function isUserVIP(userId) {
  try {
    const user = await db.getAsync(
      "SELECT is_vip FROM Users WHERE user_id = ?",
      [userId]
    );

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    return user.is_vip === 1; // Assuming is_vip is stored as a BOOLEAN or INTEGER
  } catch (err) {
    logger.error(`Error checking VIP status for user ${userId}:`, err);
    return false; // If there's an error, assume the user is not a VIP
  }
}

// everytime the app starts, this function runs once to determine which users are vip and which users are not, based on VIP_USER_IDS in config.env
async function updateVipStatusForAllUsers() {
  try {
    // Fetch all users from the database
    const users = await db.allAsync("SELECT * FROM Users");

    // Loop through each user in the database
    for (const user of users) {
      const isVipInConfig = config.vipUserIds.includes(user.user_id);
      const isVipInDatabase = Boolean(user.is_vip); // Ensure this is treated as a boolean

      // Check if there's a difference in VIP status
      if (isVipInConfig !== isVipInDatabase) {
        // Update the user's VIP status in the database
        await db.runAsync("UPDATE Users SET is_vip = ? WHERE user_id = ?", [
          isVipInConfig ? 1 : 0,
          user.user_id,
        ]);

        // Log the change in VIP status
        logger.info(
          `User ${user.user_id} VIP status updated to ${
            isVipInConfig ? "VIP" : "regular user"
          }.`
        );
      }
    }
  } catch (error) {
    logger.error("Error updating VIP statuses:", error);
  }
}

async function toggleSummaryFeatureForUser(userId) {
  try {
    // Get the current value of the summary feature
    const user = await db.getAsync(
      "SELECT summary_feature FROM Users WHERE user_id = ?",
      [userId]
    );

    if (!user) {
      throw new Error(`User with ID ${userId} not found.`);
    }

    // Toggle the summary feature value
    const newSummaryFeature = !user.summary_feature;

    // Update the summary feature in the database
    await db.runAsync(
      "UPDATE Users SET summary_feature = ? WHERE user_id = ?",
      [newSummaryFeature, userId]
    );

    logger.info(
      `User ${userId} summary feature updated to ${newSummaryFeature}.`
    );

    return newSummaryFeature;
  } catch (err) {
    logger.error(`Error toggling summary feature for user ${userId}:`, err);
  }
}

async function toggleSummaryFeatureForChannel(channelId) {
  try {
    // Get the current value of the summary feature
    const channel = await db.getAsync(
      "SELECT summary_feature FROM Channels WHERE channel_id = ?",
      [channelId]
    );

    if (!channel) {
      throw new Error(`Channel with ID ${channelId} not found.`);
    }

    // Toggle the summary feature value
    const newSummaryFeature = !channel.summary_feature;

    // Update the summary feature in the database
    await db.runAsync(
      "UPDATE Channels SET summary_feature = ? WHERE channel_id = ?",
      [newSummaryFeature, channelId]
    );

    logger.info(
      `Channel ${channelId} summary feature updated to ${newSummaryFeature}.`
    );

    return newSummaryFeature;
  } catch (err) {
    logger.error(
      `Error toggling summary feature for channel ${channelId}:`,
      err
    );
  }
}

async function toggleBotSignatureForChannel(channelId) {
  try {
    // Get the current value of the signature status
    const channel = await db.getAsync(
      "SELECT bot_signature FROM Channels WHERE channel_id = ?",
      [channelId]
    );

    if (!channel) {
      throw new Error(`Channel with ID ${channelId} not found.`);
    }

    // Toggle the signature status value
    const newBotSignature = !channel.bot_signature;

    // Update the signature status in the database
    await db.runAsync(
      "UPDATE Channels SET bot_signature = ? WHERE channel_id = ?",
      [newBotSignature, channelId]
    );

    logger.info(
      `Channel ${channelId} bot signature status updated to ${newBotSignature}.`
    );

    return newBotSignature;
  } catch (err) {
    logger.error(
      `Error toggling signature status for channel ${channelId}:`,
      err
    );
  }
}

// Function to return the total number of registered users up to a specific date (inclusive)
// If endDate is null, it counts all users up to the current time
async function registeredUsersCountWithinDateRange(endDate = null) {
  try {
    // Convert endDate to ISO format, or set it to the current time if null
    const endOfDayUTC = endDate
      ? new Date(endDate).toISOString()
      : new Date().toISOString();

    // Query to count the total number of users registered up to the given date
    const query = `
       SELECT COUNT(*) AS registeredUserCount
       FROM Users
       WHERE created_at <= ?
     `;

    const queryParams = [endOfDayUTC];

    // Execute the query
    const result = await db.getAsync(query, queryParams);

    // Return the count of registered users
    return result.registeredUserCount;
  } catch (err) {
    logger.error(
      "Error getting registered user count up to the given date:",
      err
    );
    return 0; // Return 0 if there is an error
  }
}

// Function to return the number of inactive user counts
// (Inactive in this context means the users who stopped/blocked the bot or deleted their telegram accounts and are not reachable anymore)
// is_active field for all users can be updated by /reachability command
async function inactiveUsersCount() {
  try {
    // Query to count the total number of inactive users
    const query = `
       SELECT COUNT(*) AS inactiveUsersCount
       FROM Users
       WHERE is_active == 0
     `;

    // Execute the query
    const result = await db.getAsync(query);

    // Return the count of inactive users
    return result.inactiveUsersCount;
  } catch (err) {
    logger.error("Error getting inactive users count", err);
    return 0; // Return 0 if there is an error
  }
}

// Function to return the number of distinct users who interacted with the bot either directly or via their channels
// If endDate is null, it counts interactions from startDate to the current time
async function activeUsersCountWithinDateRange(
  startDate = null,
  endDate = null
) {
  try {
    // Set the start date to 00:00 UTC of the current day if no startDate is provided
    const startOfDayUTC = startDate
      ? new Date(startDate).toISOString()
      : new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

    // Convert endDate to ISO format, or set it to current time if null
    const endOfDayUTC = endDate
      ? new Date(endDate).toISOString()
      : new Date().toISOString();

    // Query to count distinct users who performed activities directly or via channels within the provided dates
    const query = `
      SELECT COUNT(DISTINCT u.user_id) AS distinctUserCount
      FROM Users u
      LEFT JOIN UserActivities ua ON u.user_id = ua.user_id AND ua.performed_at >= ? AND ua.performed_at <= ?
      LEFT JOIN UserChannels uc ON u.user_id = uc.user_id
      LEFT JOIN ChannelActivities ca ON uc.channel_id = ca.channel_id AND ca.performed_at >= ? AND ca.performed_at <= ?
      WHERE ua.user_id IS NOT NULL OR ca.channel_id IS NOT NULL
    `;

    const queryParams = [
      startOfDayUTC,
      endOfDayUTC,
      startOfDayUTC,
      endOfDayUTC,
    ];

    // Execute the query
    const result = await db.getAsync(query, queryParams);

    // Return the count of distinct users
    return result.distinctUserCount;
  } catch (err) {
    logger.error(
      "Error getting distinct user interactions between provided dates:",
      err
    );
    return 0; // Return 0 if there is an error
  }
}

// Function to return the number of new users between a specific date range (start and end)
// If endDate is null, it counts users from startDate to the current time
async function newUsersCountWithinDateRange(startDate = null, endDate = null) {
  try {
    // Set the start date to 00:00 UTC of the current day if no startDate is provided
    const startOfDayUTC = startDate
      ? new Date(startDate).toISOString()
      : new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

    // Convert endDate to ISO format, or set it to current time if null
    const endOfDayUTC = endDate
      ? new Date(endDate).toISOString()
      : new Date().toISOString();

    // Query to count the number of users created between the provided dates
    const query = endDate
      ? "SELECT COUNT(*) AS newUserCount FROM Users WHERE created_at >= ? AND created_at <= ?"
      : "SELECT COUNT(*) AS newUserCount FROM Users WHERE created_at >= ?";

    const queryParams = endDate
      ? [startOfDayUTC, endOfDayUTC]
      : [startOfDayUTC];

    // Execute the query
    const result = await db.getAsync(query, queryParams);

    // Return the count of new users
    return result.newUserCount;
  } catch (err) {
    logger.error("Error getting new users count between provided dates:", err);
    return 0; // Return 0 if there is an error
  }
}

// Function to return the total number of registered channels up to a specific date (inclusive)
// If endDate is null, it counts all channels up to the current time
async function registeredChannelsCountWithinDateRange(endDate = null) {
  try {
    // Convert endDate to ISO format, or set it to the current time if null
    const endOfDayUTC = endDate
      ? new Date(endDate).toISOString()
      : new Date().toISOString();

    // Query to count the total number of channels registered up to the given date
    const query = `
      SELECT COUNT(*) AS registeredChannelCount
      FROM Channels
      WHERE created_at <= ?
    `;

    const queryParams = [endOfDayUTC];

    // Execute the query
    const result = await db.getAsync(query, queryParams);

    // Return the count of registered channels
    return result.registeredChannelCount;
  } catch (err) {
    logger.error(
      "Error getting registered channel count up to the given date:",
      err
    );
    return 0; // Return 0 if there is an error
  }
}

// Function to return the number of inactive channel counts
// (Inactive in this context means the channels which their owners /disconnect it from hypertag,
// Removed the bot from channel or deleted the channel itself and are not reachable anymore)
// is_active field for all channels can be updated by /reachability command
async function inactiveChannelsCount() {
  try {
    // Query to count the total number of inactive channels
    const query = `
       SELECT COUNT(*) AS inactiveChannelsCount
       FROM Channels
       WHERE is_active == 0
     `;

    // Execute the query
    const result = await db.getAsync(query);

    // Return the count of inactive channels
    return result.inactiveChannelsCount;
  } catch (err) {
    logger.error("Error getting inactive channels count", err);
    return 0; // Return 0 if there is an error
  }
}

// Function to return the number of distinct channels where the bot was used within a specific date range
// If endDate is null, it counts activities from startDate to the current time
async function activeChannelsCountWithinDateRange(
  startDate = null,
  endDate = null
) {
  try {
    // Set the start date to 00:00 UTC of the current day if no startDate is provided
    const startOfDayUTC = startDate
      ? new Date(startDate).toISOString()
      : new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

    // Convert endDate to ISO format, or set it to current time if null
    const endOfDayUTC = endDate
      ? new Date(endDate).toISOString()
      : new Date().toISOString();

    // Query to count distinct channels that had activities within the provided date range
    const query = `
      SELECT COUNT(DISTINCT ca.channel_id) AS distinctChannelCount
      FROM ChannelActivities ca
      WHERE ca.performed_at >= ? AND ca.performed_at <= ?
    `;

    const queryParams = [startOfDayUTC, endOfDayUTC];

    // Execute the query
    const result = await db.getAsync(query, queryParams);

    // Return the count of distinct channels
    return result.distinctChannelCount;
  } catch (err) {
    logger.error(
      "Error getting distinct channel count between provided dates:",
      err
    );
    return 0; // Return 0 if there is an error
  }
}

// Function to return the number of channels between a specific date range (start and end)
// If endDate is null, it counts channels from startDate to the current time
async function newChannelsCountWithinDateRange(
  startDate = null,
  endDate = null
) {
  try {
    // Set the start date to 00:00 UTC of the current day if no startDate is provided
    const startOfDayUTC = startDate
      ? new Date(startDate).toISOString()
      : new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

    // Convert endDate to ISO format, or set it to current time if null
    const endOfDayUTC = endDate
      ? new Date(endDate).toISOString()
      : new Date().toISOString();

    // Query to count the number of channels created between the provided dates
    const query = endDate
      ? "SELECT COUNT(*) AS channelCount FROM Channels WHERE created_at >= ? AND created_at <= ?"
      : "SELECT COUNT(*) AS channelCount FROM Channels WHERE created_at >= ?";

    const queryParams = endDate
      ? [startOfDayUTC, endOfDayUTC]
      : [startOfDayUTC];

    // Execute the query
    const result = await db.getAsync(query, queryParams);

    // Return the count of channels
    return result.channelCount;
  } catch (err) {
    logger.error("Error getting channels count between provided dates:", err);
    return 0; // Return 0 if there is an error
  }
}

// Function to return the number of distinct users who directly used the bot (and not from channels) within a specific date range
// If endDate is null, it counts activities from startDate to the current time
async function activeDirectUsersCountWithinDateRange(
  startDate = null,
  endDate = null
) {
  try {
    // Set the start date to 00:00 UTC of the current day if no startDate is provided
    const startOfDayUTC = startDate
      ? new Date(startDate).toISOString()
      : new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

    // Convert endDate to ISO format, or set it to current time if null
    const endOfDayUTC = endDate
      ? new Date(endDate).toISOString()
      : new Date().toISOString();

    // SQL query to count distinct users from the UserActivities table
    const query = `
      SELECT COUNT(DISTINCT ua.user_id) AS distinctUserCount
      FROM UserActivities ua
      WHERE ua.performed_at >= ? AND ua.performed_at <= ?
    `;

    const queryParams = [startOfDayUTC, endOfDayUTC];

    // Execute the query
    const result = await db.getAsync(query, queryParams);

    // Return the count of distinct users
    return result.distinctUserCount;
  } catch (err) {
    logger.error(
      "Error getting distinct user count between provided dates:",
      err
    );
    return 0; // Return 0 if there is an error
  }
}

// Function to return the number of direct chat requests within a specific date range
// If endDate is null, it counts activities from startDate to the current time
async function directRequestsCountWithingDateRange(
  startDate = null,
  endDate = null
) {
  try {
    // Set the start date to 00:00 UTC of the current day if no startDate is provided
    const startOfDayUTC = startDate
      ? new Date(startDate).toISOString()
      : new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

    // Convert endDate to ISO format, or set it to current time if null
    const endOfDayUTC = endDate
      ? new Date(endDate).toISOString()
      : new Date().toISOString();

    // SQL query to count the number of direct chat requests from the UserActivities table
    const query = `
      SELECT COUNT(ua.user_activity_id) AS directChatRequests
      FROM UserActivities ua
      WHERE ua.performed_at >= ? AND ua.performed_at <= ?
    `;

    const queryParams = [startOfDayUTC, endOfDayUTC];

    // Execute the query
    const result = await db.getAsync(query, queryParams);

    // Return the count of direct chat requests
    return result.directChatRequests;
  } catch (err) {
    logger.error(
      "Error getting direct chat requests between provided dates:",
      err
    );
    return 0; // Return 0 if there is an error
  }
}

// Function to return the number of channel requests within a specific date range
// If endDate is null, it counts activities from startDate to the current time
async function channelRequestsCountWithinDateRange(
  startDate = null,
  endDate = null
) {
  try {
    // Set the start date to 00:00 UTC of the current day if no startDate is provided
    const startOfDayUTC = startDate
      ? new Date(startDate).toISOString()
      : new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

    // Convert endDate to ISO format, or set it to current time if null
    const endOfDayUTC = endDate
      ? new Date(endDate).toISOString()
      : new Date().toISOString();

    // SQL query to count the number of channel requests from the ChannelActivities table
    const query = `
      SELECT COUNT(ca.channel_activity_id) AS channelRequests
      FROM ChannelActivities ca
      WHERE ca.performed_at >= ? AND ca.performed_at <= ?
    `;

    const queryParams = [startOfDayUTC, endOfDayUTC];

    // Execute the query
    const result = await db.getAsync(query, queryParams);

    // Return the count of channel requests
    return result.channelRequests;
  } catch (err) {
    logger.error("Error getting channel requests between provided dates:", err);
    return 0; // Return 0 if there is an error
  }
}

// Function to count the number of API calls within a specific date range (for a given day or a custom range)
async function apiCallsCountWithinDateRange(
  apiName,
  startDate = null,
  endDate = null
) {
  try {
    // Set the start date to 00:00 UTC of the provided date or the current day if no startDate is provided
    const startOfDayUTC = startDate
      ? new Date(startDate).toISOString()
      : new Date(new Date().setUTCHours(0, 0, 0, 0)).toISOString();

    // Set the end date to 23:59 UTC of the provided date or the current time if no endDate is provided
    const endOfDayUTC = endDate
      ? new Date(endDate).toISOString()
      : new Date().toISOString();

    // SQL query to count the number of API calls for the given date range and API
    const query = `
      SELECT COUNT(*) AS apiCallCount 
      FROM ApiCalls 
      WHERE api_name = ? AND performed_at >= ? AND performed_at <= ?
    `;
    const queryParams = [apiName, startOfDayUTC, endOfDayUTC];

    // Execute the query
    const result = await db.getAsync(query, queryParams);

    // Return the count of API calls
    return result.apiCallCount;
  } catch (err) {
    logger.error("Error counting API calls within the date range:", err);
    return 0; // Return 0 if there is an error
  }
}

// Function to get the bot's start date (creation date of the first user in USERS)
async function getBotStartDate() {
  try {
    // Query to get the creation date of the first user
    const query = `
      SELECT created_at
      FROM Users
      ORDER BY created_at ASC
      LIMIT 1;
    `;

    // Execute the query
    const result = await db.getAsync(query);

    // Check if a result is returned
    if (result && result.created_at) {
      return result.created_at; // Return the creation date of the first user
    } else {
      logger.error("No users found in the database.");
      return null; // Return null if no users exist
    }
  } catch (err) {
    logger.error("Error getting the bot's start date:", err);
    return null; // Return null if there is an error
  }
}

// Function to get the display states of specific metrics from the Metrics table
async function getMetricsDisplayState() {
  try {
    // Fetch metric display states from the Metrics table for specific metric names
    const metrics = await db.allAsync(
      `SELECT metric_name, metric_display FROM Metrics 
       WHERE metric_name IN (
         'registered_users', 'active_users', 'new_users', 
         'registered_channels', 'active_channels', 'new_channels', 
         'chat_requests', 'channel_requests', 'gemini_api_calls', 'textrazor_api_calls', 'openrouter_api_calls')`
    );

    // Create a mapping object to easily access the display state by metric name
    const metricDisplayMap = metrics.reduce((map, metric) => {
      map[metric.metric_name] = metric.metric_display;
      return map;
    }, {});

    // Return the metric display states in the expected order
    return [
      metricDisplayMap["registered_users"] || false,
      metricDisplayMap["active_users"] || false,
      metricDisplayMap["new_users"] || false,
      metricDisplayMap["registered_channels"] || false,
      metricDisplayMap["active_channels"] || false,
      metricDisplayMap["new_channels"] || false,
      metricDisplayMap["chat_requests"] || false,
      metricDisplayMap["channel_requests"] || false,
      metricDisplayMap["gemini_api_calls"] || false,
      metricDisplayMap["textrazor_api_calls"] || false,
      metricDisplayMap["openrouter_api_calls"] || false,
    ];
  } catch (err) {
    logger.error(
      `Error retrieving metrics display state from Metrics table:`,
      err
    );
    return [
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ]; // Return all false in case of an error
  }
}

async function toggleMetricDisplayById(metricId) {
  try {
    // Get the current value of the metric_display
    const metric = await db.getAsync(
      "SELECT metric_display FROM Metrics WHERE metric_id = ?",
      [metricId]
    );

    if (!metric) {
      throw new Error(`Metric with ID ${metricId} not found.`);
    }

    // Toggle the metric_display value
    const newMetricDisplay = !metric.metric_display;

    // Update the metric_display in the database
    await db.runAsync(
      "UPDATE Metrics SET metric_display = ? WHERE metric_id = ?",
      [newMetricDisplay, metricId]
    );

    logger.info(
      `Metric ${metricId} display status updated to ${newMetricDisplay}.`
    );

    return newMetricDisplay;
  } catch (err) {
    logger.error(
      `Error toggling metric display for metric ID ${metricId}:`,
      err
    );
  }
}

export {
  initializeDb,
  getDatabaseInstance,
  checkAndInsertUser,
  checkAndInsertChannel,
  recordUserActivity,
  deleteUserActivity,
  recordChannelActivity,
  deleteChannelActivity,
  recordApiUsage,
  connectUserToChannel,
  disconnectUserFromChannel,
  isChannelConnectedToAnotherUser,
  isChannelConnectedToCurrentUser,
  isUserAllowedToConnectMoreChannels,
  getAllUsers,
  updateUserStatus,
  getAllChannels,
  updateChannelStatus,
  getUserChannels,
  getUserDetailsByUserId,
  getUserDetailsByChannelId,
  getChannelDetailsByChannelId,
  checkUserRateLimit,
  checkChannelRateLimit,
  updateVipStatusForAllUsers,
  toggleSummaryFeatureForUser,
  toggleSummaryFeatureForChannel,
  toggleBotSignatureForChannel,
  registeredUsersCountWithinDateRange,
  inactiveUsersCount,
  activeUsersCountWithinDateRange,
  newUsersCountWithinDateRange,
  registeredChannelsCountWithinDateRange,
  inactiveChannelsCount,
  activeChannelsCountWithinDateRange,
  newChannelsCountWithinDateRange,
  activeDirectUsersCountWithinDateRange,
  directRequestsCountWithingDateRange,
  channelRequestsCountWithinDateRange,
  apiCallsCountWithinDateRange,
  getBotStartDate,
  getMetricsDisplayState,
  toggleMetricDisplayById,
};
