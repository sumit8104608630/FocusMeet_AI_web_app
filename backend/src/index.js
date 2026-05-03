import server from './app.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from '../databases_config/mongodb.config.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

// Connect to MongoDB
connectDB();

server.listen(process.env.PORT || 9090, () => {
    console.log(`server is running on port ${process.env.PORT || 9090}`)
})


  