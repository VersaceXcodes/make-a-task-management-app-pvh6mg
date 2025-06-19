import dotenv from "dotenv";
import fs from "fs";
import pg from 'pg';
const { Pool } = pg;

dotenv.config();

const { DATABASE_URL, PGHOST, PGDATABASE, PGUSER, PGPASSWORD, PGPORT = 5432 } = process.env;

const pool = new Pool(
  DATABASE_URL
    ? { 
        connectionString: DATABASE_URL, 
        ssl: { require: true } 
      }
    : {
        host: PGHOST || "ep-ancient-dream-abbsot9k-pooler.eu-west-2.aws.neon.tech",
        database: PGDATABASE || "neondb",
        user: PGUSER || "neondb_owner",
        password: PGPASSWORD || "npg_jAS3aITLC5DX",
        port: Number(PGPORT),
        ssl: { require: true },
      }
);


async function initDb() {
  const client = await pool.connect();
  try {
    // Check if tables exist
    const tableCheckSQL = `
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name IN ('user', 'task', 'task_list', 'task_comment');
    `;
    
    const { rows: [{ count }] } = await client.query(tableCheckSQL);
    
    if (Number(count) < 4) { // Less than all required tables exist
      // Begin transaction
      await client.query('BEGIN');
      
      // Read and split SQL commands
      const dbInitCommands = fs
        .readFileSync(`./db.sql`, "utf-8")
        .toString()
        .split(/(?=CREATE TABLE |INSERT INTO)/);

      // Execute each command
      for (let cmd of dbInitCommands) {
        if (cmd.trim()) {
          console.dir({ "backend:db:init:command": cmd });
          await client.query(cmd);
        }
      }

      // Commit transaction
    } else {
      console.log('Database tables already exist, skipping initialization');
    }
  } catch (e) {
    // Rollback on error
    await client.query('ROLLBACK');
    console.error('Database initialization failed:', e);
    throw e;
  } finally {
    // Release client back to pool
    client.release();
  }
}

// Execute initialization
initDb().catch(console.error);