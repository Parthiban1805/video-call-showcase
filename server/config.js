const os = require('os');
const path = require('path');
require('dotenv').config();

// Ensure required environment variables are set in a real app
// For showcase purposes, we set defaults.

const config = {
    server: {
        host: process.env.LISTEN_IP || '0.0.0.0',
        port: process.env.PORT || 4000,
    },

    cors: {
        origin: process.env.CORS_ORIGIN
            ? process.env.CORS_ORIGIN.split(',')
            : ['http://localhost:5173', 'https://localhost:5174'],
    },

    db: {
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017/video_conferencing_db',
    },

    auth: {
        jwtSecret: process.env.JWT_SECRET || 'dev_secret',
        saltRounds: parseInt(process.env.SALT_ROUNDS) || 10,
        tokenExpiresIn: '8h',
    },

    ssl: {
        enabled: process.env.ENABLE_SSL === 'true',
        keyPath: path.join(__dirname, '../client/certs/localhost-key.pem'),
        certPath: path.join(__dirname, '../client/certs/localhost.pem'),
    },

    // Mediasoup (simulated settings for showcase)
    mediasoup: {
        numWorkers: os.cpus().length,
        worker: {
            rtcMinPort: 40000,
            rtcMaxPort: 49999,
            logLevel: 'warn',
        },
        // ... complete transport settings
    },
};

module.exports = config;
