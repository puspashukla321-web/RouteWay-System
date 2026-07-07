const fs = require("fs/promises");
const path = require("path");

const pool = require("./db");
const { seedAdmin } = require("../scripts/seedAdmin");

let bootstrapPromise = null;

async function tableExists(tableName) {
  const databaseName = process.env.DB_NAME || "routeway";
  const [rows] = await pool.query(
    `SELECT 1 AS found
     FROM information_schema.tables
     WHERE table_schema = ? AND table_name = ?
     LIMIT 1`,
    [databaseName, tableName],
  );

  return rows.length > 0;
}

async function columnExists(tableName, columnName) {
  const databaseName = process.env.DB_NAME || "routeway";
  const [rows] = await pool.query(
    `SELECT 1 AS found
     FROM information_schema.columns
     WHERE table_schema = ? AND table_name = ? AND column_name = ?
     LIMIT 1`,
    [databaseName, tableName, columnName],
  );

  return rows.length > 0;
}

async function ensureRouteColumns() {
  if (!(await tableExists("routes"))) {
    return;
  }

  if (!(await columnExists("routes", "distance_km"))) {
    await pool.query(
      "ALTER TABLE routes ADD COLUMN distance_km DECIMAL(6,2) NULL AFTER operator",
    );
  }

  if (!(await columnExists("routes", "duration_minutes"))) {
    await pool.query(
      "ALTER TABLE routes ADD COLUMN duration_minutes INT NULL AFTER distance_km",
    );
  }
}

async function seedAdminIfMissing() {
  if (!(await tableExists("admins"))) {
    return;
  }

  const [rows] = await pool.query("SELECT COUNT(*) AS count FROM admins");
  if (rows[0]?.count === 0) {
    await seedAdmin();
  }
}

async function executeSqlFile(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const statements = [];
  let buffer = "";

  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();

    if (!trimmed || trimmed.startsWith("--")) {
      continue;
    }

    if (/^CREATE DATABASE\b/i.test(trimmed) || /^USE\s+/i.test(trimmed)) {
      continue;
    }

    buffer += `${line}\n`;

    if (trimmed.endsWith(";")) {
      statements.push(buffer.trim().replace(/;$/, ""));
      buffer = "";
    }
  }

  if (buffer.trim()) {
    statements.push(buffer.trim().replace(/;$/, ""));
  }

  for (const statement of statements) {
    // Each statement is idempotent or only executed on first boot.
    // The bootstrap intentionally reuses the shared pool so the app sees the same DB config.
    // eslint-disable-next-line no-await-in-loop
    await pool.query(statement);
  }
}

async function bootstrapDatabase() {
  if (!bootstrapPromise) {
    bootstrapPromise = (async () => {
      const coreTables = [
        "admins",
        "stops",
        "routes",
        "route_stops",
        "fares",
        "feedback",
      ];
      const missingTables = [];

      for (const tableName of coreTables) {
        // The schema file is applied only when the database has not been initialized yet.
        // This avoids re-running the seed inserts on every restart.
        // eslint-disable-next-line no-await-in-loop
        const exists = await tableExists(tableName);
        if (!exists) {
          missingTables.push(tableName);
        }
      }

      if (missingTables.length === 0) {
        await ensureRouteColumns();
        await seedAdminIfMissing();
        return;
      }

      const schemaPath = path.resolve(__dirname, "../../db.sql");
      await executeSqlFile(schemaPath);
      await seedAdmin();
    })();
  }

  return bootstrapPromise;
}

module.exports = { bootstrapDatabase };
