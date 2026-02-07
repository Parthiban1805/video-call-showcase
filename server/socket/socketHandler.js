const logger = require('../utils/logger');

// Simulated Room Manager (in-memory state for showcase)
const rooms = new Map();

module.exports = (io) => {
    io.on('connection', (socket) => {
        logger.info(`New client connected: ${socket.id}`);

        // --- Room Management ---

        socket.on('join-room', ({ roomId, peerId, displayName }, callback) => {
            logger.info(`User ${displayName} (${peerId}) joining room ${roomId}`);

            // Validate join request
            if (!rooms.has(roomId)) {
                rooms.set(roomId, { peers: new Map() });
            }

            const room = rooms.get(roomId);
            room.peers.set(peerId, { socketId: socket.id, displayName });

            // Join socket.io room for broadcasting
            socket.join(roomId);

            // Notify other peers in the room
            socket.to(roomId).emit('peer-joined', { peerId, displayName });

            // Acknowledge join
            if (callback) callback({ rtpCapabilities: 'mock-rtp-capabilities' });
        });

        socket.on('leave-room', ({ roomId, peerId }) => {
            logger.info(`User ${peerId} leaving room ${roomId}`);
            socket.leave(roomId);

            if (rooms.has(roomId)) {
                const room = rooms.get(roomId);
                room.peers.delete(peerId);

                // If room is empty, clean up
                if (room.peers.size === 0) {
                    rooms.delete(roomId);
                } else {
                    // Notify others
                    socket.to(roomId).emit('peer-left', { peerId });
                }
            }
        });

        // --- Mediasoup Signaling (Mocked for Showcase) ---
        // In the full production version, these handlers interact with Mediasoup C++ workers
        // to creating WebRTC transports, producers, and consumers.

        socket.on('createWebRtcTransport', async ({ consumer }, callback) => {
            // PRODUCTION: await mediasoupRouter.createWebRtcTransport(...)
            logger.info(`[Mock] Creating WebRtcTransport for ${socket.id}`);
            callback({
                id: 'mock-transport-id',
                iceParameters: {},
                iceCandidates: [],
                dtlsParameters: {},
            });
        });

        socket.on('connectTransport', async ({ transportId, dtlsParameters }, callback) => {
            // PRODUCTION: await transport.connect({ dtlsParameters });
            logger.info(`[Mock] Connecting transport ${transportId}`);
            callback();
        });

        socket.on('produce', async ({ transportId, kind, rtpParameters }, callback) => {
            // PRODUCTION: await transport.produce({ kind, rtpParameters });
            logger.info(`[Mock] Produce ${kind} on transport ${transportId}`);
            callback({ id: 'mock-producer-id' });
        });

        socket.on('consume', async ({ transportId, producerId, rtpCapabilities }, callback) => {
            // PRODUCTION: await transport.consume(...)
            logger.info(`[Mock] Consume producer ${producerId} on transport ${transportId}`);
            callback({
                id: 'mock-consumer-id',
                producerId,
                kind: 'video',
                rtpParameters: {},
            });
        });

        // --- Chat & Screen Share ---

        socket.on('send-message', ({ roomId, message }) => {
            io.to(roomId).emit('new-message', {
                sender: socket.id,
                message,
                timestamp: new Date(),
            });
        });

        socket.on('disconnect', () => {
            logger.info(`Client disconnected: ${socket.id}`);
            // Cleanup logic would go here
        });
    });
};
