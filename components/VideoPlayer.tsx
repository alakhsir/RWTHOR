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
    AlertTriangle
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

const ContentVideoPlayer: React.FC<VideoPlayerProps> = ({ url, title, thumbnailUrl, onClose }) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const controlsTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // State
    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(1);
    const [isMuted, setIsMuted] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showControls, setShowControls] = useState(true);
    const [isScrubbing, setIsScrubbing] = useState(false);
    const [playbackRate, setPlaybackRate] = useState(1);

    // Settings Menu State
    const [showSettings, setShowSettings] = useState(false);
    const [activeMenu, setActiveMenu] = useState<'main' | 'speed' | 'quality'>('main');
    const [quality, setQuality] = useState('Auto');

    // Initialize
    useEffect(() => {
        setLoading(true);
        setError(null);
        setCurrentTime(0);
        setIsPlaying(true);
        if (videoRef.current) {
            videoRef.current.load();
            videoRef.current.playbackRate = playbackRate;
        }
    }, [url]);

    // Handle Controls Visibility
    const handleMouseMove = () => {
        setShowControls(true);
        if (controlsTimeoutRef.current) {
            clearTimeout(controlsTimeoutRef.current);
        }
        if (isPlaying) {
            controlsTimeoutRef.current = setTimeout(() => {
                setShowControls(false);
                setShowSettings(false);
                setActiveMenu('main');
            }, 3000);
        }
    };

    const handleMouseLeave = () => {
        if (isPlaying) {
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

    const skip = (seconds: number) => {
        if (videoRef.current) {
            videoRef.current.currentTime += seconds;
            handleMouseMove();
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
        const handleKeyDown = (e: KeyboardEvent) => {
            if (document.activeElement?.tagName === 'INPUT') return;
            switch (e.key.toLowerCase()) {
                case ' ':
                case 'k': e.preventDefault(); togglePlay(); break;
                case 'f': e.preventDefault(); toggleFullscreen(); break;
                case 'm': e.preventDefault(); toggleMute(); break;
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
    }, [togglePlay, toggleFullscreen, toggleMute]);

    useEffect(() => {
        const handleFsChange = () => { setIsFullscreen(!!document.fullscreenElement); };
        document.addEventListener('fullscreenchange', handleFsChange);
        return () => document.removeEventListener('fullscreenchange', handleFsChange);
    }, []);

    return (
        <div className="fixed inset-0 bg-black z-50 flex flex-col font-sans select-none">

            {/* Header */}
            <div className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-b from-black/90 to-transparent z-50 flex items-center px-6 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0'}`}>
                <div className="flex items-center w-full">
                    <button onClick={onClose} className="text-white/80 hover:text-white p-2 rounded-full hover:bg-white/10 transition-colors mr-4">
                        <ChevronLeft size={28} />
                    </button>
                    <h2 className="text-white font-bold text-base md:text-lg line-clamp-1">{title}</h2>
                </div>
            </div>

            <div
                ref={containerRef}
                className="flex-1 relative bg-black flex items-center justify-center group overflow-hidden"
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
                onClick={() => { if (!showSettings && showControls) togglePlay(); }}
            >
                <video
                    ref={videoRef}
                    className="w-full h-full max-h-screen object-contain"
                    autoPlay
                    playsInline
                    src={url}
                    poster={thumbnailUrl}
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
                    onClick={(e) => { e.stopPropagation(); togglePlay(); }}
                    onDoubleClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
                />

                {/* Loading */}
                {loading && !error && (
                    <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                        <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    </div>
                )}

                {/* Error */}
                {error && (
                    <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/80 p-6 text-center">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="text-white font-bold text-lg mb-2">{error}</p>
                        <button
                            onClick={() => { if (videoRef.current) { videoRef.current.load(); setLoading(true); setError(null); } }}
                            className="px-6 py-2 bg-white text-black font-bold rounded hover:bg-gray-200 transition"
                        >
                            Retry
                        </button>
                    </div>
                )}

                {/* Center Play Button */}
                {!loading && !error && !isPlaying && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                        <div className="w-16 h-16 bg-black/60 rounded-full flex items-center justify-center border-2 border-white/20 backdrop-blur-sm animate-in zoom-in duration-200">
                            <Play className="w-6 h-6 text-white ml-1 fill-white" />
                        </div>
                    </div>
                )}

                {/* Controls Bar */}
                <div
                    className={`absolute bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-4 pt-12 transition-opacity duration-300 ${showControls ? 'opacity-100' : 'opacity-0 cursor-none'}`}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Progress Timeline */}
                    <div className="group/timeline relative w-full h-1.5 hover:h-2.5 bg-white/30 rounded-full cursor-pointer mb-4 transition-all">
                        <div className="absolute top-0 left-0 h-full bg-[#5a4bda] rounded-full z-10 relative" style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}>
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow scale-0 group-hover/timeline:scale-100 transition-transform" />
                        </div>
                        <input type="range" min={0} max={duration || 100} value={currentTime} onChange={handleSeek} onMouseDown={handleScrubStart} onMouseUp={handleScrubEnd} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" />
                    </div>

                    <div className="flex items-center justify-between text-white">
                        <div className="flex items-center gap-4">
                            <button onClick={togglePlay} className="hover:text-blue-400 transition-colors focus:outline-none">
                                {isPlaying ? <Pause className="fill-current w-7 h-7" /> : <Play className="fill-current w-7 h-7" />}
                            </button>

                            <button onClick={() => skip(-10)} className="hover:text-blue-400 transition-colors focus:outline-none p-1 -ml-2">
                                <RotateCcw size={20} />
                            </button>
                            <button onClick={() => skip(10)} className="hover:text-blue-400 transition-colors focus:outline-none p-1">
                                <RotateCw size={20} />
                            </button>

                            <div className="flex items-center gap-2 text-xs font-mono font-medium text-gray-300">
                                <span>{formatTime(currentTime)}</span>
                                <span className="text-gray-500">/</span>
                                <span>{formatTime(duration)}</span>
                            </div>

                            <div className="flex items-center gap-1 group/vol hidden sm:flex">
                                <button onClick={toggleMute} className="p-1 hover:text-blue-400">
                                    {isMuted || volume === 0 ? <VolumeX size={20} /> : <Volume2 size={20} />}
                                </button>
                                <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 flex items-center">
                                    <input type="range" min="0" max="1" step="0.05" value={isMuted ? 0 : volume} onChange={handleVolumeChange} className="w-16 h-1 bg-white/30 rounded-full accent-blue-500 cursor-pointer ml-2" />
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 relative">
                            {/* Settings Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => { setShowSettings(!showSettings); setActiveMenu('main'); }}
                                    className={`hover:text-blue-400 transition-all p-1 ${showSettings ? 'rotate-90 text-blue-400' : ''}`}
                                >
                                    <Settings size={20} />
                                </button>

                                {showSettings && (
                                    <div className="absolute bottom-full right-0 mb-4 bg-[#1e1e24]/95 backdrop-blur-md border border-white/10 rounded-xl overflow-hidden min-w-[200px] shadow-2xl animate-in fade-in slide-in-from-bottom-2 z-50">

                                        {/* Main Menu */}
                                        {activeMenu === 'main' && (
                                            <div className="py-2">
                                                <button
                                                    onClick={() => setActiveMenu('speed')}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/10 flex items-center justify-between"
                                                >
                                                    <span>Playback Speed</span>
                                                    <div className="flex items-center gap-2 text-gray-400 text-xs text-right">
                                                        {playbackRate === 1 ? 'Normal' : `${playbackRate}x`} <ChevronLeft size={16} className="rotate-180" />
                                                    </div>
                                                </button>
                                                <button
                                                    onClick={() => setActiveMenu('quality')}
                                                    className="w-full text-left px-4 py-3 text-sm font-medium hover:bg-white/10 flex items-center justify-between"
                                                >
                                                    <span>Quality</span>
                                                    <div className="flex items-center gap-2 text-gray-400 text-xs text-right">
                                                        {quality} <ChevronLeft size={16} className="rotate-180" />
                                                    </div>
                                                </button>
                                            </div>
                                        )}

                                        {/* Speed Menu */}
                                        {activeMenu === 'speed' && (
                                            <div>
                                                <button onClick={() => setActiveMenu('main')} className="w-full text-left px-4 py-3 border-b border-white/10 text-xs font-bold text-gray-400 hover:text-white flex items-center gap-2">
                                                    <ChevronLeft size={14} /> Back
                                                </button>
                                                <div className="py-1 max-h-[200px] overflow-y-auto">
                                                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map(speed => (
                                                        <button
                                                            key={speed}
                                                            onClick={() => changeSpeed(speed)}
                                                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-white/10 ${playbackRate === speed ? 'text-blue-500 font-bold' : 'text-gray-300'}`}
                                                        >
                                                            {playbackRate === speed && <Play size={10} fill="currentColor" />}
                                                            <span className={playbackRate === speed ? 'ml-0' : 'ml-[22px]'}>{speed === 1 ? 'Normal' : `${speed}x`}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Quality Menu */}
                                        {activeMenu === 'quality' && (
                                            <div>
                                                <button onClick={() => setActiveMenu('main')} className="w-full text-left px-4 py-3 border-b border-white/10 text-xs font-bold text-gray-400 hover:text-white flex items-center gap-2">
                                                    <ChevronLeft size={14} /> Back
                                                </button>
                                                <div className="py-1">
                                                    {['Auto', '1080p', '720p', '480p', '360p'].map(q => (
                                                        <button
                                                            key={q}
                                                            onClick={() => changeQuality(q)}
                                                            className={`w-full text-left px-4 py-2 text-sm flex items-center gap-3 hover:bg-white/10 ${quality === q ? 'text-blue-500 font-bold' : 'text-gray-300'}`}
                                                        >
                                                            {quality === q && <Play size={10} fill="currentColor" />}
                                                            <span className={quality === q ? 'ml-0' : 'ml-[22px]'}>{q}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                    </div>
                                )}
                            </div>

                            <button onClick={toggleFullscreen} className="hover:text-blue-400 transition-colors p-1">
                                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const VideoPlayer: React.FC<VideoPlayerProps> = (props) => (
    <ErrorBoundary>
        <ContentVideoPlayer {...props} />
    </ErrorBoundary>
);
