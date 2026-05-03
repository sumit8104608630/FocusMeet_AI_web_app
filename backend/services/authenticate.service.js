import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import client from '../databases_config/postgress.confiqure.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env from the backend root directory
dotenv.config({ path: path.join(__dirname, '../.env') });

const ACCESS_SECRET  = process.env.JWT_SECRET;
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET; // ✅ separate secret

const set_user = (user) => {
    try {
        if (!user) return { error: "User not found" };
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        return jwt.sign(payload, ACCESS_SECRET, { expiresIn: '1d' });
    } catch (err) {
        return null;
    }
};

const get_user = async (token) => {
    try {

        const payload = jwt.verify(token, ACCESS_SECRET);

        if (!payload?.id ) return null;

        const result = await client.query(
            `SELECT id, name, email FROM users WHERE id = $1`,
            [payload.id]
        );
        if (result.rowCount === 0) return null;
        return result.rows[0];

    } catch (error) {
        // jwt.verify throws when token is expired or invalid
        return { error: "Invalid token", status: 401, success: false };
    }
};

const set_refresh_token = (user) => {
    try {
        const payload = {
            id: user.id,
            name: user.name,
            email: user.email
        };
        return jwt.sign(payload, REFRESH_SECRET, { expiresIn: '7d' }); // ✅ separate secret
    } catch (err) {
        return null;
    }
};

export { set_user, get_user, set_refresh_token };