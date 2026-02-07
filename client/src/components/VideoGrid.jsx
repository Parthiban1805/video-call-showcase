import React, { useEffect, useRef } from 'react';

/**
 * Video Component
 * Renders a single video stream with proper ref handling and cleanup.
 */
const Video = ({ stream, isLocal, displayName, isMuted }) => {
    const videoRef = useRef(null);

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = new MediaStream(stream.getTracks());
        }
    }, [stream]);

    return (
        <div className="relative group rounded-xl overflow-hidden shadow-lg bg-gray-900 aspect-video">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                muted={isLocal || isMuted} // Mute local video to prevent feedback
                className={`w-full h-full object-cover ${isLocal ? 'scale-x-[-1]' : ''}`} // Mirror local video
            />

            {/* Overlay Info */}
            <div className="absolute bottom-2 left-2 bg-black/60 px-2 py-1 rounded text-white text-sm font-medium">
                {displayName} {isLocal && '(You)'}
            </div>

            {/* Muted Indicator */}
            {isMuted && (
                <div className="absolute top-2 right-2 bg-red-500/80 p-1.5 rounded-full">
                    {/* Icon (e.g., from Lucide or Heroicons) */}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3l18 18" />
                    </svg>
                </div>
            )}
        </div>
    );
};

/**
 * VideoGrid Component
 * Displays a responsive grid of video participants.
 */
const VideoGrid = ({ localStream, peers, localName }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 h-full w-full">
            {/* Local User */}
            {localStream && (
                <Video
                    stream={localStream}
                    isLocal={true}
                    displayName={localName || 'Me'}
                />
            )}

            {/* Remote Peers */}
            {Array.from(peers.entries()).map(([peerId, peerData]) => (
                <Video
                    key={peerId}
                    stream={peerData.stream}
                    isLocal={false}
                    displayName={peerData.displayName}
                    isMuted={peerData.isMuted}
                />
            ))}

            {/* Placeholder for Empty Room */}
            {!localStream && peers.size === 0 && (
                <div className="col-span-full flex flex-col items-center justify-center text-gray-400 h-64 border-2 border-dashed border-gray-700 rounded-xl">
                    <p>No active participants</p>
                    <p className="text-sm">Waiting for users to join...</p>
                </div>
            )}
        </div>
    );
};

export default VideoGrid;
