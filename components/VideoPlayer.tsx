import React, { useRef, useState, useEffect, useCallback, Component, ErrorInfo } from 'react';
import {
    AlertCircle,
    Loader2,
    Play,
    Pause,
    Volume2,
    VolumeX,
    Maximize,
    Minimize,
    RotateCcw,
    RotateCw,
    ChevronLeft,
    Settings,
    AlertTriangle,
    PictureInPicture,
    SkipForward,
    SkipBack,
    X,
    Smartphone,
    CheckCircle as CheckCircleIcon
} from 'lucide-react';

// --- Error Boundary ---
class ErrorBoundary extends Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }> {
    constructor(props: { children: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null };
    }

    static getDerivedStateFromError(error: Error) {
        return { hasError: true, error };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo) {
        console.error("VideoPlayer Crash:", error, errorInfo);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black text-white p-8">
                    <AlertTriangle className="w-16 h-16 text-red-500 mb-4" />
                    <h2 className="text-xl font-bold mb-2">Something went wrong.</h2>
                    <p className="text-gray-400 mb-4">The video player encountered a critical error.</p>
                    <pre className="bg-gray-900 p-4 rounded text-xs text-red-300 overflow-auto max-w-full">
                        {this.state.error?.toString()}
                    </pre>
                    <button
                        onClick={() => window.location.reload()}
                        className="mt-6 px-6 py-2 bg-white text-black rounded font-bold hover:bg-gray-200"
                    >
                        Reload Page
                    </button>
                </div>
            );
        }
        return this.props.children;
    }
}

interface VideoPlayerProps {
    url: string;
    title: string;
    thumbnailUrl?: string;
    onClose: () => void;
    isMinimized?: boolean;
    onMinimize?: () => void;
    onMaximize?: () => void;
}

const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
};

const ContentVideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, thumbnailUrl, onClose, isMinimized, onMinimize, onMaximize }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [buffered, setBuffered] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [showSeekAnimation, setShowSeekAnimation] = useState<'forward' | 'backward' | null>(null);

    // Settings Menu State
    const [showSettings, setShowSettings] = useState(false);
    const [activeMenu, setActiveMenu] = useState<'main' | 'speed' | 'quality'>('main');
    const [quality, setQuality] = useState('Auto');
    const [isPiP, setIsPiP] = useState(false);

    // Initialize
    useEffect(() => {
        setLoading(true);
        setError(null);
        // Only reset time if it's a new URL
        setCurrentTime(0);
        setIsPlaying(true);
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.playbackRate = playbackRate;
        }
    }, [url]);

    // Handle Controls Visibility
    const handleMouseMove = () => {
        if (isMinimized) return;
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying && !isScrubbing) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setShowSettings(false);
                setActiveMenu('main');
            }, 3000);
        }
    };

    const handleMouseLeave = () => {
        if (isPlaying && !isMinimized) {
            setShowControls(false);
            setShowSettings(false);
            setActiveMenu('main');
        }
    };

    const togglePlay = useCallback(() => {
        if (videoRef.current) {
            if (videoRef.current.paused) {
                videoRef.current.play().catch(() => { });
                setIsPlaying(true);
                handleMouseMove();
            } else {
                videoRef.current.pause();
                setIsPlaying(false);
                setShowControls(true);
            }
        }
    }, [isPlaying]);

    const handleTimeUpdate = () => {
        if (videoRef.current && !isScrubbing) {
            setCurrentTime(videoRef.current.currentTime);
            // Update buffer
            if (videoRef.current.buffered.length > 0) {
                let bufferedEnd = 0;
                for (let i = 0; i < videoRef.current.buffered.length; i++) {
                    if (videoRef.current.buffered.start(i) <= videoRef.current.currentTime && videoRef.current.buffered.end(i) >= videoRef.current.currentTime) {
                        bufferedEnd = videoRef.current.buffered.end(i);
                        break;
                    }
                }
                setBuffered(bufferedEnd);
            }
        }
    };

    const handleLoadedMetadata = () => {
        if (videoRef.current) {
            setDuration(videoRef.current.duration);
            setLoading(false);
        }
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        setCurrentTime(time);
        if (videoRef.current) {
            videoRef.current.currentTime = time;
        }
    };

    const handleScrubStart = () => {
        setIsScrubbing(true);
        if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    };

    const handleScrubEnd = () => {
        setIsScrubbing(false);
        if (isPlaying) handleMouseMove();
    };

    const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = parseFloat(e.target.value);
        setVolume(val);
        if (videoRef.current) {
            videoRef.current.volume = val;
            videoRef.current.muted = val === 0;
            setIsMuted(val === 0);
        }
    };

    const toggleMute = () => {
        if (videoRef.current) {
            const newMuted = !isMuted;
            videoRef.current.muted = newMuted;
            setIsMuted(newMuted);
            if (!newMuted && volume === 0) {
                setVolume(0.5);
                videoRef.current.volume = 0.5;
            }
        }
    };

    const toggleFullscreen = async () => {
        if (!containerRef.current) return;
        if (!document.fullscreenElement) {
            try { await containerRef.current.requestFullscreen(); setIsFullscreen(true); } catch (err) { console.error(err); }
        } else {
            await document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const toggleLandscape = async () => {
        try {
            if (!document.fullscreenElement && containerRef.current) {
                await containerRef.current.requestFullscreen();
                setIsFullscreen(true);
            }

            if (screen.orientation && 'lock' in screen.orientation) {
                const currentType = screen.orientation.type;
                if (currentType.startsWith('landscape')) {
                    // If already landscape, unlock to allow rotation or lock to portrait
                    (screen.orientation as any).unlock();
                } else {
                    // Lock to landscape
                    await (screen.orientation as any).lock('landscape');
                }
            }
        } catch (e) {
            console.warn("Orientation lock failed or not supported:", e);
        }
    };

    const togglePiP = async () => {
        if (videoRef.current) {
            // iOS Safari Support
            if ((videoRef.current as any).webkitSupportsPresentationMode) {
                (videoRef.current as any).webkitSetPresentationMode(
                    (videoRef.current as any).webkitPresentationMode === "picture-in-picture" ? "inline" : "picture-in-picture"
                );
                return; // Exit early for iOS
            }

            // Standard API
            if (document.pictureInPictureElement) {
                await document.exitPictureInPicture();
            } else {
                try {
                    await videoRef.current.requestPictureInPicture();
                } catch (e) {
                    console.error("PiP failed", e);
                }
            }
        }
    };

    const skip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
            handleMouseMove();

            // Show animation
            setShowSeekAnimation(seconds > 0 ? 'forward' : 'backward');
            setTimeout(() => setShowSeekAnimation(null), 500);
        }
    };

    const changeSpeed = (speed: number) => {
        setPlaybackRate(speed);
        if (videoRef.current) videoRef.current.playbackRate = speed;
        setShowSettings(false);
        setActiveMenu('main');
    };

    const changeQuality = (q: string) => {
        setQuality(q);
        setShowSettings(false);
        setActiveMenu('main');
    };

    // Keyboard Shortcuts
    useEffect(() => {
        if (isMinimized) return; // Disable shortcuts if minimized
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT') return;
            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k': e.preventDefault(); togglePlay(); break;
                case 'f': e.preventDefault(); toggleFullscreen(); break;
                case 'm': e.preventDefault(); toggleMute(); break;
                case 'i': e.preventDefault(); togglePiP(); break;
                case 'arrowleft': e.preventDefault(); skip(-10); break;
                case 'arrowright': e.preventDefault(); skip(10); break;
                case 'arrowup':
                    e.preventDefault();
                    if (videoRef.current) {
                        const newVol = Math.min(videoRef.current.volume + 0.1, 1);
                        setVolume(newVol); videoRef.current.volume = newVol;
                    }
                    break;
                case 'arrowdown':
                    e.preventDefault();
                    if (videoRef.current) {
                        const newVol = Math.max(videoRef.current.volume - 0.1, 0);
                        setVolume(newVol); videoRef.current.volume = newVol;
                    }
                    break;
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [togglePlay, toggleFullscreen, toggleMute, isMinimized]);


    useEffect(() => {
        const handleFsChange = () => { setIsFullscreen(!!document.fullscreenElement); };

        const videoEl = videoRef.current;
        const handleEnterPiP = () => {
            setIsPiP(true);
            // Auto-minimize when entering PiP so the user can use the app
            // and so "Back to Tab" returns to a consistent Mini-Player state.
            if (onMinimize && !isMinimized) {
                onMinimize();
            }
        };
        const handleLeavePiP = () => {
            setIsPiP(false);
            // Heuristic: Browser pauses video when "X" is clicked in PiP -> Close Player.
            // Browser keeps playing when "Back to Tab" is clicked -> Keep Player.
            if (videoEl && videoEl.paused) {
                onClose();
            }
        };

        document.addEventListener('fullscreenchange', handleFsChange);
        if (videoEl) {
            videoEl.addEventListener('enterpictureinpicture', handleEnterPiP);
            videoEl.addEventListener('leavepictureinpicture', handleLeavePiP);
        }

        return () => {
            document.removeEventListener('fullscreenchange', handleFsChange);
            if (videoEl) {
                videoEl.removeEventListener('enterpictureinpicture', handleEnterPiP);
                videoEl.removeEventListener('leavepictureinpicture', handleLeavePiP);
            }
        };
    }, [isMinimized, loading, onMinimize]);

    // Safety net: Check on focus only (removed polling for performance)
    useEffect(() => {
        const checkPiP = () => {
            const isActuallyInPiP = !!document.pictureInPictureElement;
            if (isPiP !== isActuallyInPiP) {
                setIsPiP(isActuallyInPiP);
            }
        };

        window.addEventListener('focus', checkPiP);
        return () => window.removeEventListener('focus', checkPiP);
    }, [isPiP]);

    // Helper for explicit maximizing
    const handleMaximize = async (e?: React.MouseEvent) => {
        e?.stopPropagation();
        if (document.pictureInPictureElement) {
            await document.exitPictureInPicture().catch(console.error);
        }
        onMaximize?.();
    };

    // Unified Render Logic
    const rootClasses = isMinimized
        ? `fixed bottom-20 right-4 sm:bottom-4 sm:right-4 z-[9999] w-72 sm:w-80 bg-[#16161a] border border-white/10 rounded-xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5 fade-in duration-300 group transition-all ${isPiP ? 'opacity-0 pointer-events-none' : 'opacity-100'}`
        : `fixed inset-0 h-[100dvh] bg-black z-[9999] flex flex-col font-sans select-none group touch-none`;

    return (
        <div
            ref={containerRef}
            className={rootClasses}
            onMouseMove={!isMinimized ? handleMouseMove : undefined}
            onMouseLeave={!isMinimized ? handleMouseLeave : undefined}
        >
            {/* --- FULL SCREEN HEADER --- */}
            {!isMinimized && (
                <div className={`absolute top-0 left-0 right-0 h-20 bg-gradient-to-b from-black/90 via-black/40 to-transparent z-50 flex items-center px-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                    <div className="flex items-center w-full justify-between">
                        <div className="flex items-center gap-4">
                            <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm">
                                <ChevronLeft size={28} />
                            </button>
                            <h2 className="text-white font-bold text-base md:text-lg line-clamp-1 drop-shadow-md">{title}</h2>
                        </div>
                        {onMinimize && (
                            <button onClick={onMinimize} className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors backdrop-blur-sm group/min" title="Minimize to PiP">
                                <Minimize size={24} />
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* --- MINI PLAYER HEADER OVERLAY --- */}
            {isMinimized && (
                <div
                    className="absolute top-0 left-0 right-0 p-2 z-50 flex justify-between items-start bg-gradient-to-b from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button onClick={handleMaximize} className="bg-black/50 p-2 rounded-full hover:bg-black/80 text-white transition-colors" title="Maximize">
                        <Maximize size={16} />
                    </button>
                    <button onClick={onClose} className="bg-black/50 p-2 rounded-full hover:bg-black/80 text-white transition-colors" title="Close">
                        <X size={16} />
                    </button>
                </div>
            )}

            {/* --- CENTER CONTROLS (Mobile & Buffering) --- */}
            <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none">
                {/* Center Controls (Skip + Play/Load) - Visible on Touch/Mobile when Controls shown */}
                {!error && !isMinimized && (
                    <div className={`flex items-center gap-8 transition-opacity duration-300 ${showControls ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}>
                        {/* Mobile Skip Back */}
                        <button onClick={(e) => { e.stopPropagation(); skip(-10); }} className="p-3 text-white sm:hidden animate-in zoom-in slide-in-from-right-4 active:-rotate-45 transition-transform duration-200">
                            <RotateCcw size={32} className="drop-shadow-md" />
                        </button>

                        {/* Main Play/Pause AND Loading Spinner */}
                        <div className="relative flex items-center justify-center">
                            <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className={`w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center text-white transition-all hover:scale-105 active:scale-95 group/play drop-shadow-lg ${loading ? 'opacity-50' : 'opacity-100'}`}>
                                {isPlaying ? (
                                    <Pause className="w-8 h-8 sm:w-10 sm:h-10 fill-white" />
                                ) : (
                                    <Play className="w-8 h-8 sm:w-10 sm:h-10 ml-1 fill-white" />
                                )}
                            </button>

                            {/* Loading Overlay */}
                            {loading && (
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    <Loader2 className="w-10 h-10 text-white animate-spin drop-shadow-md" />
                                </div>
                            )}
                        </div>

                        {/* Mobile Skip Forward */}
                        <button onClick={(e) => { e.stopPropagation(); skip(10); }} className="p-3 text-white sm:hidden animate-in zoom-in slide-in-from-left-4 active:rotate-45 transition-transform duration-200">
                            <RotateCw size={32} className="drop-shadow-md" />
                        </button>
                    </div>
                )}
            </div>

            {/* --- VIDEO CLICK AREA (Double Tap) --- */}
            <div
                className="absolute inset-0 z-0"
                onClick={(e) => {
                    // Simple Double Tap Logic
                    const now = Date.now();
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const width = rect.width;

                    // Check for double click manually since we want to support single click toggle too
                    // For simplicity in this iteration, we rely on the buttons for seek and click for toggle
                    // The user specifically asked for "double tab".
                    // We can implement a "smart" click handler here.
                    if (!isMinimized) {
                        if (isMinimized) return;
                        const isRight = x > width * 0.65;
                        const isLeft = x < width * 0.35;

                        if (isRight || isLeft) {
                            // Potential seek zone
                            // For now, let's just stick to single tap toggles controls to avoid conflict
                            // or implement a dedicated double-tap handler if critical.
                            // User asked: "double tab kare to 10 sec aage"
                        }

                        if (!showSettings && showControls) {
                            // Toggle play if clicking center or controls visible
                            // togglePlay(); // User requested to disable "Tap to Pause". Only close controls/reset timer.
                            handleMouseMove();
                        } else {
                            handleMouseMove(); // Just show controls
                        }
                    } else {
                        handleMaximize();
                    }
                }}
                onDoubleClick={(e) => {
                    if (isMinimized) return;
                    const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const width = rect.width;

                    if (x > width * 0.6) {
                        skip(10);
                    } else if (x < width * 0.4) {
                        skip(-10);
                    } else {
                        toggleFullscreen();
                    }
                }}
            ></div>


            <video
                ref={videoRef}
                className={`w-full h-full ${isMinimized ? 'object-cover' : 'max-h-screen object-contain'}`}
                autoPlay
                playsInline
                src={url}
                poster={!isMinimized ? thumbnailUrl : undefined}
                muted={isMuted}
                onCanPlay={() => setLoading(false)}
                onWaiting={() => setLoading(true)}
                onPlaying={() => { setLoading(false); setIsPlaying(true); }}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onLoadedMetadata={handleLoadedMetadata}
                onError={(e) => {
                    setLoading(false);
                    console.error("Video Error:", e);
                    setError("Playback Error");
                }}
            />

            {/* --- FULL SCREEN OVERLAYS --- */}
            {!isMinimized && (
                <>
                    {/* Seek Animations (Desktop Only) */}
                    {showSeekAnimation === 'forward' && (
                        <div className="absolute right-1/4 top-1/2 -translate-y-1/2 flex-col items-center justify-center text-white/80 animate-in fade-in zoom-in duration-300 hidden sm:flex">
                            <SkipForward size={48} className="drop-shadow-lg" />
                            <span className="font-bold text-lg drop-shadow-md">+10s</span>
                        </div>
                    )}
                    {showSeekAnimation === 'backward' && (
                        <div className="absolute left-1/4 top-1/2 -translate-y-1/2 flex-col items-center justify-center text-white/80 animate-in fade-in zoom-in duration-300 hidden sm:flex">
                            <SkipBack size={48} className="drop-shadow-lg" />
                            <span className="font-bold text-lg drop-shadow-md">-10s</span>
                        </div>
                    )}

                    {/* Error */}
                    {error && (
                        <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
                            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                            <p className="text-white font-bold text-lg mb-2">{error}</p>
                            <button
                                onClick={(e) => { e.stopPropagation(); if (videoRef.current) { videoRef.current.load(); setLoading(true); setError(null); } }}
                                className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition"
                            >
                                Retry
                            </button>
                        </div>
                    )}
                </>
            )}

            {/* --- MINI PLAYER OVERLAYS --- */}
            {isMinimized && (
                <>
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" onClick={(e) => { e.stopPropagation(); togglePlay(); }}>
                        {isPlaying ? <Pause className="fill-white text-white drop-shadow-md" size={32} /> : <Play className="fill-white text-white drop-shadow-md" size={32} />}
                    </div>
                    <div className="absolute bottom-0 left-0 h-1 bg-white/30 w-full">
                        <div className="h-full bg-red-500" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
                    </div>
                </>
            )}

            {/* --- FULL SCREEN CONTROLS --- */}
            {!isMinimized && (
                <div
                    className={`absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-6 pb-6 pt-20 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Progress Timeline */}
                    <div className="group/timeline relative w-full h-4 flex items-center cursor-pointer mb-4"
                        onMouseDown={handleScrubStart}
                        onMouseUp={handleScrubEnd}
                    >
                        <div className="absolute left-0 right-0 h-1 bg-white/20 rounded-full transition-colors duration-200"></div>
                        <div className="absolute left-0 h-1 bg-white/30 rounded-full" style={{ width: `${(buffered / (duration || 1)) * 100}%` }} />
                        <div className="absolute left-0 h-1 bg-[#6366f1] rounded-full z-10 flex items-center" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}>
                            <div className="absolute right-0 w-3 h-3 bg-white rounded-full shadow-md opacity-0 group-hover/timeline:opacity-100 transition-opacity duration-200" />
                        </div>
                        <input type="range" min={0} max={duration || 100} value={currentTime} onChange={handleSeek} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20 m-0 p-0 appearance-none" />
                    </div>

                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-2 sm:gap-6">
                            <button onClick={togglePlay} className="hover:text-[#6366f1] transition-colors focus:outline-none transform active:scale-95">
                                {isPlaying ? <Pause className="fill-current w-8 h-8" /> : <Play className="fill-current w-8 h-8" />}
                            </button>
                            <div className="hidden sm:flex items-center gap-2">
                                <button onClick={() => skip(-10)} className="hover:text-white/80 transition-colors focus:outline-none p-1 group/skip"><RotateCcw size={22} className="group-active/skip:-rotate-45 transition-transform" /></button>
                                <button onClick={() => skip(10)} className="hover:text-white/80 transition-colors focus:outline-none p-1 group/skip"><RotateCw size={22} className="group-active/skip:rotate-45 transition-transform" /></button>
                            </div>
                            <div className="flex items-center gap-1 group/vol hidden sm:flex">
                                <button onClick={toggleMute} className="p-1 hover:text-[#6366f1] transition-colors">
                                    {isMuted || volume === 0 ? <VolumeX size={24} /> : <Volume2 size={24} />}
                                </button>
                                <div className="w-0 overflow-hidden group-hover/vol:w-24 transition-all duration-300 flex items-center">
                                    <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-20 h-1 bg-white/30 rounded-full accent-[#6366f1] cursor-pointer ml-2" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-xs font-mono font-medium text-gray-300 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm">
                                <span className="text-white">{formatTime(currentTime)}</span>
                                <span className="text-gray-500">/</span>
                                <span>{formatTime(duration)}</span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 relative">
                            <div className="relative">
                                <button onClick={() => { setShowSettings(!showSettings); setActiveMenu('main'); }} className={`hover:text-[#6366f1] transition-all p-2 rounded-full hover:bg-white/10 ${showSettings ? 'rotate-90 text-[#6366f1] bg-white/10' : ''}`}><Settings size={22} /></button>
                                {showSettings && (
                                    <div className="absolute bottom-full right-0 mb-6 bg-[#16161a]/95 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden min-w-[240px] shadow-[0_0_40px_rgba(0,0,0,0.5)] animate-in fade-in slide-in-from-bottom-2 z-50">
                                        {activeMenu === 'main' && (
                                            <div className="py-2">
                                                <button onClick={() => setActiveMenu('speed')} className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/10 flex items-center justify-between group/item"><span className="flex items-center gap-3"><Loader2 size={16} /> Playback Speed</span><span className="text-gray-400 text-xs">{playbackRate}x <ChevronLeft size={16} className="rotate-180 inline" /></span></button>
                                            </div>
                                        )}
                                        {activeMenu === 'speed' && (
                                            <div>
                                                <button onClick={() => setActiveMenu('main')} className="w-full text-left px-4 py-3 border-b border-white/10 text-xs font-bold text-gray-400 hover:text-white flex items-center gap-2 bg-white/5"><ChevronLeft size={14} /> BACK</button>
                                                {[0.5, 0.75, 1, 1.25, 1.5, 2].map(s => <button key={s} onClick={() => changeSpeed(s)} className={`w-full text-left px-4 py-2 text-sm hover:bg-white/10 ${playbackRate === s ? 'text-indigo-400' : 'text-gray-300'}`}>{s}x</button>)}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            <button onClick={toggleLandscape} className="hover:text-[#6366f1] transition-colors p-2 rounded-full hover:bg-white/10 block md:hidden" title="Rotate / Landscape">
                                <Smartphone size={22} />
                            </button>
                            <button onClick={togglePiP} className="hover:text-[#6366f1] transition-colors p-2 rounded-full hover:bg-white/10 hidden sm:block" title="Picture in Picture">
                                <PictureInPicture size={22} />
                            </button>
                            <button onClick={toggleFullscreen} className="hover:text-[#6366f1] transition-colors p-2 rounded-full hover:bg-white/10">
                                {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MINI PLAYER INFO FOOTER --- */}
            {isMinimized && (
                <div className="p-3 flex items-center gap-3 bg-[#1e1e24] cursor-default">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-white text-sm font-bold truncate">{title}</h4>
                        <p className="text-xs text-gray-400 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</p>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleMute(); }} className="text-gray-400 hover:text-white">
                        {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    <button onClick={handleMaximize} className="text-blue-400 hover:text-blue-300 text-xs font-bold uppercase tracking-wider">Expand</button>
                </div>
            )}
        </div>
    );
};

export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => (
    <ErrorBoundary>
        <ContentVideoPlayer {...props} />
    </ErrorBoundary>
);
