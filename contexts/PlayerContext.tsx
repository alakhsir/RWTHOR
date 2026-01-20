import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export interface VideoData {
    url: string;
    title: string;
    thumbnailUrl?: string;
    startTime?: number;
}

interface PlayerContextType {
    activeVideo: VideoData | null;
    isMinimized: boolean;
    playVideo: (video: VideoData) => void;
    closeVideo: () => void;
    minimizeVideo: () => void;
    maximizeVideo: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);


export const PlayerProvider = ({ children }: { children: ReactNode }) => {
    const [activeVideo, setActiveVideo] = useState<VideoData | null>(null);
    const [isMinimized, setIsMinimized] = useState(false);

    const isClosingRef = React.useRef(false);

    // Handle Back Button Interception
    useEffect(() => {
        const handlePopState = (event: PopStateEvent) => {
            // If we are programmatically closing, ignore this event
            if (isClosingRef.current) {
                isClosingRef.current = false;
                return;
            }

            // If the user attempts to go back while video is full-screen, just close the video
            if (activeVideo && !isMinimized) {
                // The history change has already happened (we popped the "player" state)
                // Instead of closing, we MINIMIZE to MiniPlayer (PiP/Persistence)
                // This keeps the video playing while "going back" from the full screen view.
                setIsMinimized(true);
            }
        };

        window.addEventListener('popstate', handlePopState);
        return () => window.removeEventListener('popstate', handlePopState);
    }, [activeVideo, isMinimized]);

    const playVideo = (video: VideoData) => {
        // Push a new history entry so "Back" will close the player
        window.history.pushState({ playerOpen: true }, "", window.location.href);
        setActiveVideo(video);
        setIsMinimized(false);
    };

    const closeVideo = () => {
        // Explicitly Close
        isClosingRef.current = true;
        setActiveVideo(null);
        setIsMinimized(false);

        // Clean history
        if (window.history.state?.playerOpen) {
            window.history.back();
        }
    };

    const minimizeVideo = () => setIsMinimized(true);

    // When maximizing, maybe push state again if missing? 
    // For simplicity, handle minimal logic:
    const maximizeVideo = () => setIsMinimized(false);

    return (
        <PlayerContext.Provider value={{ activeVideo, isMinimized, playVideo, closeVideo, minimizeVideo, maximizeVideo }}>
            {children}
        </PlayerContext.Provider>
    );
};

export const usePlayer = () => {
    const context = useContext(PlayerContext);
    if (!context) {
        throw new Error('usePlayer must be used within a PlayerProvider');
    }
    return context;
};
