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
client.connect().then(()=>console.log('Connected to PostgreSQL database')).catch((err)=>console.error('PostgreSQL Connection Error:', err));
export default client;
