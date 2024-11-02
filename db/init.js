// db/init.js

import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";
import { promisify } from "util";

const dbPath = path.resolve("db/database.sqlite");
const schemaPath = path.resolve("db/schema.sql");

// Get the version of the schema from schema.sql file (first comment) to add it as a row
// In the SchemaVersion table while database is being initialized for the first time
const getSchemaVersionFromFile = (schemaContent) => {
  const versionMatch = schemaContent.match(/--\s*version:\s*(\d+)/i);
  return versionMatch ? parseInt(versionMatch[1], 10) : 0;
};

const initializeDatabase = (callback) => {
  const db = new sqlite3.Database(dbPath, async (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
      return;
    }

    console.log("Connected to the SQLite database.");

    // Promisify database methods for async/await
    db.getAsync = promisify(db.get).bind(db);
    db.runAsync = promisify(db.run).bind(db);
    db.allAsync = promisify(db.all).bind(db);

    const schemaContent = fs.readFileSync(schemaPath, "utf-8");
    const schemaVersion = getSchemaVersionFromFile(schemaContent);

    // Initialize the schema
    db.exec(schemaContent, async (err) => {
      if (err) {
        console.error("Error initializing database:", err.message);
        return;
      }

      console.log("Database initialized successfully.");

      // Check if the SchemaVersion table is empty
      try {
        const row = await db.getAsync(
          "SELECT COUNT(*) as count FROM SchemaVersion"
        );

        // Insert schema version if SchemaVersion table is empty
        if (row.count === 0) {
          await db.runAsync(
            "INSERT INTO SchemaVersion (version) VALUES (?)",
            schemaVersion
          );
          console.log(`Schema initialized to version ${schemaVersion}.`);
        }
      } catch (err) {
        console.error("Error setting schema version:", err.message);
      }

      // Call the callback with the database instance
      if (callback) callback(db);
    });
  });
};

export default initializeDatabase;
