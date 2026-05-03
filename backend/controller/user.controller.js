import { apiError } from "../utils/apiError.js";
import { apiResponse } from "../utils/apiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import client from "../databases_config/postgress.confiqure.js";
import { set_user, set_refresh_token } from "../services/authenticate.service.js";
import redisClient from "../databases_config/redis.config.js";

import bcrypt from "bcrypt";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const createUser = asyncHandler(async (req, res, next) => {
    const { name, email, password } = req.body;

    // 1. Check for missing fields
    if (!name || !email || !password) {
        return res.status(400).json(new apiError('Please provide name, email and password', 400));
    }

    const trimmedName     = name.trim();
    const trimmedEmail    = email.trim().toLowerCase();
    const trimmedPassword = password.trim();

    // 2. Check for empty strings after trim
    if (!trimmedName || !trimmedEmail || !trimmedPassword) {
        return res.status(400).json(new apiError('Fields cannot be empty or whitespace', 400));
    }

 
 

    // 4. Email format validation
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return res.status(400).json(new apiError('Please provide a valid email address', 400));
    }

    // 5. Password strength check
    if (trimmedPassword.length < 8) {
        return res.status(400).json(new apiError('Password must be at least 8 characters', 400));
    }

    // 6. Check if email already exists
    const existing = await client.query(
        `SELECT id FROM users WHERE email = $1`,
        [trimmedEmail]
    );
    if (existing.rowCount > 0) {
        return res.status(409).json(new apiError('Email already registered', 409));
    }

    // 7. Hash password before storing
    const hashedPassword = await bcrypt.hash(trimmedPassword, 10);

    // 8. Insert with RETURNING to get the created row
    const query  = `INSERT INTO users(name, email, password) VALUES($1, $2, $3) RETURNING id, name, email, created_at`;
    const values = [trimmedName, trimmedEmail, hashedPassword];
    const result = await client.query(query, values);

    if (result.rowCount === 0) {
        return res.status(500).json(new apiError('Failed to create user', 500));
    }

return res.status(201).json(new apiResponse(201, result.rows[0], 'User created successfully'));
});

const loginUser = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json(new apiError('Please provide email and password', 400));
    }
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPassword = password.trim();
    if (!trimmedEmail || !trimmedPassword) {
        return res.status(400).json(new apiError('Fields cannot be empty or whitespace', 400));
    }
    // 3. Email format validation
    if (!EMAIL_REGEX.test(trimmedEmail)) {
        return res.status(400).json(new apiError('Please provide a valid email address', 400));
    }
  const existing = await client.query(
    `SELECT id, password FROM users WHERE email = $1`,
    [trimmedEmail]
);
    if (existing.rowCount === 0) {
return res.status(401).json(new apiError('Invalid email or password', 401));
    }
    const user = existing.rows[0];

    // 4. Password validation
    const isMatch = await bcrypt.compare(trimmedPassword, user.password);
    if (!isMatch) {
        return res.status(401).json(new apiError('Password is incorrect', 401));
    }
    // 5. Login success
    const accessToken=set_user(user);
    const refreshToken=set_refresh_token(user);
    // 6. Set cookies
    res.cookie('accessToken', accessToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'none',
    });
    return res.status(200).json(new apiResponse(200, 'Login successful'));

})


const get_user_info = asyncHandler(async (req, res, next) => {
    const {id}=req.user;
    const user = await client.query(
        `SELECT id, name, email FROM users WHERE id = $1`,
        [id]
    );
    if (user.rowCount === 0) {
        return res.status(404).json(new apiError('User not found', 404));
    }
    return res.status(200).json(new apiResponse(200, user.rows[0], 'User retrieved successfully')); 
});

const logoutUser = asyncHandler(async (req, res, next) => {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.status(200).json(new apiResponse(200, null, 'Logged out successfully'));
});

const getActiveMeeting = asyncHandler(async (req, res, next) => {
    const { id } = req.user;
    if (!redisClient.isOpen) {
        return res.status(200).json(new apiResponse(200, null, 'Redis not connected'));
    }
    const meetingId = await redisClient.get(`user_active_meeting:${id}`);
    return res.status(200).json(new apiResponse(200, { meetingId }, 'Active meeting retrieved'));
});

export { createUser ,loginUser,get_user_info, logoutUser, getActiveMeeting};
