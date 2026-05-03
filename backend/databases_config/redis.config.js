import { createClient } from 'redis';
import dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL || 'rediss://red-cv5dli7noe9s73eh7eug:z2ACzxZkPSjjtkpheFhHoxn7zcTBmhDt@oregon-keyvalue.render.com:6379',
    socket: {
        reconnectStrategy: (retries) => {
            if (retries > 10) {
                console.error('Redis max retries reached. Falling back to memory.');
                return new Error('Redis connection failed');
            }
            return Math.min(retries * 100, 3000);
        },
        connectTimeout: 10000,
        tls: true,
        // If you're on a local dev environment and have cert issues:
        // rejectUnauthorized: false 
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

try {
    await redisClient.connect();
    console.log('Connected to Redis successfully');
} catch (error) {
    console.error('Initial Redis connection failed:', error.message);
}

export default redisClient;
