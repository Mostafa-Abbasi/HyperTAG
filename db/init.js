// db/init.js

import sqlite3 from "sqlite3";
import fs from "fs";
import path from "path";

const dbPath = path.resolve("db/database.sqlite");
const schemaPath = path.resolve("db/schema.sql");

const initializeDatabase = (callback) => {
  const db = new sqlite3.Database(dbPath, (err) => {
    if (err) {
      console.error("Error opening database:", err.message);
    } else {
      console.log("Connected to the SQLite database.");

      const schema = fs.readFileSync(schemaPath, "utf-8");
      db.exec(schema, (err) => {
        if (err) {
          console.error("Error initializing database:", err.message);
        } else {
          console.log("Database initialized successfully.");
        }
        if (callback) callback(db);
      });
    }
  });
};

export default initializeDatabase;
