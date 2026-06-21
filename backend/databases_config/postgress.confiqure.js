import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
    connectionString: process.env.PG_URL,
    ssl: {
        rejectUnauthorized: false
    },
    // optional but helps with Render's idle disconnects
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

// THIS is what was missing — stops the unhandled 'error' event from crashing the process
pool.on('error', (err) => {
    console.error('Unexpected PG pool error (connection likely dropped, will retry on next query):', err.message);
});

// Run setup once on startup, using a connection from the pool
(async () => {
    try {
        await pool.query('SELECT 1'); // simple connectivity check
        console.log('Connected to PostgreSQL database');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS users (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
        `);
        console.log('Users table verified/created');
    } catch (err) {
        console.error('PostgreSQL setup error:', err.message);
    }
})();

export default pool;