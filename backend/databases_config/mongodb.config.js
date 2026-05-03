import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const connectDB = async () => {
    try {
        const mongoURI = process.env.MONGODB_URL;
        if (!mongoURI) {
            throw new Error('MONGODB_URL is not defined in .env');
        }
        
        // Use a default database name
        const dbName = 'college_sem2_project';
        
        const conn = await mongoose.connect(mongoURI, {
            dbName: dbName
        });
        
        console.log(`MongoDB Connected: ${conn.connection.host}, Database: ${dbName}`);
    } catch (error) {
        console.error(`MongoDB Connection Error: ${error.message}`);
    }
};

export default connectDB;
