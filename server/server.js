const express = require('express');
const https = require('https');
const http = require('http'); // Fallback for dev without certs
const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const cors = require('cors');
const { Server } = require('socket.io');
const config = require('./config');
const logger = require('./utils/logger');
const authRoutes = require('./routes/authRoutes');
const socketHandler = require('./socket/socketHandler');

const app = express();

// --- CORS & Middleware ---
const corsOptions = {
    origin: config.cors.origin,
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    credentials: true,
    optionsSuccessStatus: 200
};
app.use(cors(corsOptions));
app.use(express.json());

// --- Routes ---
app.use('/api/auth', authRoutes);
// app.use('/api/meetings', meetingRoutes); // (Not included in showcase)

// --- Database ---
logger.info('Connecting to MongoDB...');
// Mongoose connection mock logic for showcase - in real app, remove `if (process.env.TEST)` check
if (process.env.NODE_ENV !== 'test') {
    mongoose.connect(config.db.uri)
        .then(() => logger.info('MongoDB connected successfully.'))
        .catch(err => {
            logger.error(err, 'MongoDB connection error.');
            // process.exit(1); // Relaxed for showcase purposes
        });
}

// --- Server Setup ---
let server;
if (config.ssl.enabled && fs.existsSync(config.ssl.keyPath) && fs.existsSync(config.ssl.certPath)) {
    logger.info('Starting HTTPS server...');
    const sslOptions = {
        key: fs.readFileSync(config.ssl.keyPath),
        cert: fs.readFileSync(config.ssl.certPath),
    };
    server = https.createServer(sslOptions, app);
} else {
    logger.warn('SSL certificates not found or disabled. Starting HTTP server.');
    server = http.createServer(app);
}

// --- Socket.IO & Real-time Logic ---
const io = new Server(server, {
    cors: corsOptions,
});

logger.info('Initializing Socket.IO handlers...');
socketHandler(io); // Modular socket logic

// --- Server Start ---
server.listen(config.server.port, config.server.host, () => {
    logger.info(`✅ Server running on ${config.ssl.enabled ? 'https' : 'http'}://${config.server.host}:${config.server.port}`);
});
