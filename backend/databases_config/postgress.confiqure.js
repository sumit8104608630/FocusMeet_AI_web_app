import {Client} from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const client=new Client({
    connectionString: process.env.PG_URL,
    ssl: {
        rejectUnauthorized: false
    }
})
client.connect()
    .then(async () => {
        console.log('Connected to PostgreSQL database');
        // Create users table if it doesn't exist
        try {
            await client.query(`
                CREATE TABLE IF NOT EXISTS users (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR(255) NOT NULL,
                    email VARCHAR(255) UNIQUE NOT NULL,
                    password VARCHAR(255) NOT NULL,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
                );
            `);
            console.log('Users table verified/created');
        } catch (tableError) {
            console.error('Error creating users table:', tableError);
        }
    })
    .catch((err) => console.error('PostgreSQL Connection Error:', err));
export default client;
