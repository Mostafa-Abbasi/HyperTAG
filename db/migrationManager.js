// db/migrationManager.js

import fs from "fs";
import path from "path";
import logger from "../src/utils/logger.js";

const migrationsDir = path.resolve("db/migrations");

// Get the current version from the SchemaVersion table
const getCurrentSchemaVersion = async (db) => {
  const row = await db.getAsync(
    "SELECT version FROM SchemaVersion ORDER BY version DESC LIMIT 1"
  );
  return row ? row.version : 0;
};

// Apply pending migrations based on the schema version
export default async function applyMigrations(db) {
  const currentVersion = await getCurrentSchemaVersion(db);

  // Get all migration files and sort by version
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort((a, b) => parseInt(a.split("_")[0]) - parseInt(b.split("_")[0]));

  for (const file of migrationFiles) {
    const migrationVersion = parseInt(file.split("_")[0]);

    // Skip migrations already applied
    if (migrationVersion <= currentVersion) continue;

    const filePath = path.join(migrationsDir, file);
    const migrationSql = fs.readFileSync(filePath, "utf-8");

    try {
      await db.exec(migrationSql);
      await db.runAsync(
        "INSERT INTO SchemaVersion (version) VALUES (?)",
        migrationVersion
      );
      logger.info(`Applied migration: ${file}`);
    } catch (error) {
      logger.error(`Error applying migration ${file}:`, error);
      throw error;
    }
  }
}
