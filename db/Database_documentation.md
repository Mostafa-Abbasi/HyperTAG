# Database Reference

This `db` directory contains all the files and configurations needed for setting up, initializing, and managing the database for the application. This document explains the schema structure, initialization process, and how various tables interact within the application.

## Important Note for Self-Hosting HyperTAG

If you are self-hosting **HyperTAG**, managing database updates is entirely automated, so no additional steps are required to keep your database up-to-date. You can continue using your existing `database.sqlite` file, as the application will automatically handle migrations with each new release. On startup, HyperTAG checks the current database version in `SchemaVersion` and applies any pending migrations, ensuring your database structure is always current without any manual intervention.

**Backup Recommendation:** Regularly backing up your `database.sqlite` file is highly recommended as a general practice and especially before updating to a new version of HyperTAG, as updates may include database migrations. This precaution allows you to revert to a previous version if needed. Should you encounter any issues, please create a GitHub issue with relevant logs, and if possible, send a copy of your database to my email at mostafaabbac@gmail.com to help me investigate and resolve the problem.

## Directory Structure

```
db/
├── migrations/            # Folder containing SQL migration files
├── database.js            # Main entry point for database initialization & operations
├── database.sqlite        # SQLite database file (auto-created if not exists)
├── init.js                # Database initialization script
├── initialData.js         # Inserts default values after initialization
├── migrationManager.js    # Migration handler logic
└── schema.sql             # Schema snapshot to initialize a new database
```

## Initialization Process

When the application starts, the following steps occur:

1.  **Schema Initialization**:

    - The application checks if `database.sqlite` exists. If it does not, `schema.sql` is read to build a new `database.sqlite` instance.
    - The initial structure is created based on `schema.sql`, with tables and constraints.

2.  **Migration Handling**:

    - The `SchemaVersion` table is checked to determine the database's current version.
    - All SQL files in the `migrations/` directory are named incrementally to reflect schema updates. Migrations with version numbers greater than the current version in `SchemaVersion` are applied sequentially.
    - Each migration is recorded in the `SchemaVersion` table as it is applied to prevent duplicate applications.

3.  **Data Initialization**:

    - Default values are conditionally inserted into specific tables (e.g., `Activities`, `Metrics`) using `initialData.js`.
    - `initialData.js` only inserts data when tables are empty to avoid duplicates, ensuring default data is only applied when the `database.sqlite` is first created.

## Adding New Migrations

Always follow these steps sequentially, and apply migrations before updating the `schema.sql` file:

1.  Create a new SQL file in the `migrations/` directory with the next incremental filename (e.g., `002_add_new_column.sql`).

2.  Write the SQL commands required for the migration in the file.

3.  Start the application to apply the migration. `migrationManager.js` will detect the new migration, apply it, and record it in the `SchemaVersion` table.

4.  Update `schema.sql` to reflect the changes made by the latest migration and increment the version number. The version number in `schema.sql` should match the latest migration version, so if the latest migration is `002_add_new_column.sql`, update the first comment in `schema.sql` to `-- version: 2`.

## Notes

- **Schema Snapshot**: The `schema.sql` file represents the latest database structure for initializing new databases and should include all changes made by previous migrations.

- **Tracking Migrations**: The `SchemaVersion` table ensures only new migrations are applied to avoid redundant updates on an existing database.

- **Default Data**: The `initialData.js` script inserts default values only when tables are empty, which typically occurs when the database is first created.
