const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const User = require('../models/User');
const config = require('../config');
const logger = require('../utils/logger');

const router = express.Router();

// --- Rate Limiter ---
// Protect against brute-force attacks on login
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Too many login attempts from this IP, please try again after 15 minutes' },
});

// --- Middleware: Validation Check ---
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

/**
 * @route   POST api/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
    '/register',
    [
        // Input Validation & Sanitization
        body('name', 'Name is required').trim().not().isEmpty().escape(),
        body('username', 'Please include a valid email').isEmail().normalizeEmail(),
        body('password', 'Password must be at least 6 characters').isLength({ min: 6 }),
    ],
    validate,
    async (req, res) => {
        const { name, username, password } = req.body;

        try {
            // Check if user already exists
            let user = await User.findOne({ username });
            if (user) {
                return res.status(400).json({ msg: 'Username already exists' });
            }

            // Create new user instance
            user = new User({ name, username, password });

            // Encrypt password
            const salt = await bcrypt.genSalt(config.auth.saltRounds);
            user.password = await bcrypt.hash(password, salt);

            await user.save();

            // Return JWT
            const payload = { user: { id: user.id, username: user.username, name: user.name } };

            jwt.sign(
                payload,
                config.auth.jwtSecret,
                { expiresIn: config.auth.tokenExpiresIn },
                (err, token) => {
                    if (err) throw err;
                    res.status(201).json({ token, user: payload.user });
                }
            );

            logger.info(`New user registered: ${username}`);

        } catch (err) {
            logger.error(err.message, 'Details: Server error during registration');
            res.status(500).send('Server error');
        }
    }
);

/**
 * @route   POST api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
router.post(
    '/login',
    loginLimiter,
    [
        body('username', 'Please include a valid email').isEmail().normalizeEmail(),
        body('password', 'Password is required').exists(),
    ],
    validate,
    async (req, res) => {
        const { username, password } = req.body;

        try {
            // Check user existence
            const user = await User.findOne({ username });
            if (!user) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            // Validate password
            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return res.status(400).json({ msg: 'Invalid credentials' });
            }

            // Return JWT
            const payload = { user: { id: user.id, username: user.username, name: user.name } };

            jwt.sign(
                payload,
                config.auth.jwtSecret,
                { expiresIn: config.auth.tokenExpiresIn },
                (err, token) => {
                    if (err) throw err;
                    res.json({ token, user: payload.user });
                }
            );

        } catch (err) {
            logger.error(err.message, 'Details: Server error during login');
            res.status(500).send('Server error');
        }
    }
);

module.exports = router;
