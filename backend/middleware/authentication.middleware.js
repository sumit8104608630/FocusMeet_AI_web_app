import { asyncHandler } from '../utils/asyncHandler.js';
import jwt from 'jsonwebtoken';                                          // ✅ ESM import
import { set_user, get_user, set_refresh_token } from '../services/authenticate.service.js'; // ✅ ESM import
import client from '../databases_config/postgress.confiqure.js';
import { apiError } from '../utils/apiError.js';

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
};

const authenticate = asyncHandler(async (req, res, next) => { // ✅ correct signature
    const cookie = req.cookies['accessToken'];
    
    if (!cookie) {
        return res.status(401).json(new apiError('No token provided', 401));
    }

    const decoded = await get_user(cookie); // ✅ await added

    // ✅ check null before checking .error
    if (!decoded) {
        return res.status(401).json(new apiError('Invalid token', 401));
    }

    // Access token valid
    if (!decoded.error) {
        req.user = decoded;
        return next();
    }

    // Access token expired — try refresh token
    const refreshToken = req.cookies['refreshToken']; // ✅ correct casing
    if (!refreshToken) {
        return res.status(401).json(new apiError('No refresh token provided', 401));
    }

    let id;
    try {
        ({ id } = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET)); // ✅ jwt.verify
    } catch {
        return res.status(401).json(new apiError('Invalid refresh token', 401));
    }

    // ✅ fixed SQL query
    const result = await client.query(
        `SELECT id, name, email FROM users WHERE id = $1`,
        [id]
    );
    const user = result.rows[0]; 

    if (!user) {
        return res.status(401).json(new apiError('User not found', 401));
    }

    const newAccessToken  = set_user(user);
    const newRefreshToken = set_refresh_token(user);
    req.user = user;

    res.cookie('accessToken',  newAccessToken,  cookieOptions)
       .cookie('refreshToken', newRefreshToken, cookieOptions);

    return next();
});

export { authenticate };