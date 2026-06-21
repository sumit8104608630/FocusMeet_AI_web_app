import { createClient } from 'redis';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

if (!process.env.REDIS_URL) {
    throw new Error('REDIS_URL is not defined in .env');
}

const redisClient = createClient({
    url: process.env.REDIS_URL,
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Redis max retries reached.');
                return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
        },
        connectTimeout: 10000,
        tls: true,
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error:', err.message));

try {
    await redisClient.connect();
    console.log('Connected to Redis successfully');
} catch (error) {
    console.error('Initial Redis connection failed:', error.message);
}

export default redisClient;