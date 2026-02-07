import { useState, useCallback, useEffect, useRef } from 'react';
import apiClient from '../api/apiClient';

/**
 * Custom Hook: useMeeting
 * 
 * Manages the state and logic for a video conferencing session.
 * Encapsulates media stream handling, socket connections, and Mediasoup signaling.
 */
const useMeeting = ({ roomId, user }) => {
    // --- State ---
    const [peers, setPeers] = useState(new Map()); // Map of peerId -> media streams
    const [localStream, setLocalStream] = useState(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected' | 'error'

    // --- References ---
    const socketRef = useRef(null);
    const deviceRef = useRef(null); // Mediasoup Device
    const producersRef = useRef(new Map());
    const consumersRef = useRef(new Map());

    // --- Side Effects ---

    // 1. Join Room & Load Device
    useEffect(() => {
        if (!roomId || !user) return;

        const joinRoom = async () => {
            try {
                // Fetch capabilities (mock API call)
                // const { rtpCapabilities } = await apiClient.get(`/meetings/${roomId}/capabilities`);

                // Initialize Mediasoup Device (mock logic)
                // await loadDevice(rtpCapabilities);

                // Connect Socket
                // socketRef.current = connectSocket(roomId, user);

                // Simulate successful connection
                setConnectionStatus('connected');

                // Get user media
                const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
                setLocalStream(stream);

            } catch (err) {
                console.error("Failed to join meeting:", err);
                setConnectionStatus('error');
            }
        };

        joinRoom();

        return () => {
            leaveRoom();
        };
    }, [roomId, user]);

    // --- Actions ---

    const toggleAudio = useCallback(() => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted((prev) => !prev);
            // Notify server...
        }
    }, [localStream]);

    const toggleVideo = useCallback(() => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff((prev) => !prev);
            // Notify server...
        }
    }, [localStream]);

    const leaveRoom = useCallback(() => {
        // Cleanup local streams
        if (localStream) {
            localStream.getTracks().forEach(track => track.stop());
        }

        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.disconnect();
        }

        // Close transports
        producersRef.current.clear();
        consumersRef.current.clear();

        setConnectionStatus('disconnected');
    }, [localStream]);

    // --- Return Values ---
    return {
        peers,
        localStream,
        isMuted,
        isVideoOff,
        connectionStatus,
        actions: {
            toggleAudio,
            toggleVideo,
            leaveRoom,
        }
    };
};

export default useMeeting;
