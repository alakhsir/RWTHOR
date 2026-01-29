import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Loader2, Check, Heart, ArrowRight, ShieldCheck, Mail } from 'lucide-react';

export const LoginPage = () => {
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [step, setStep] = useState<'LANDING' | 'EMAIL' | 'OTP'>('LANDING');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [resendTimer, setResendTimer] = useState(30);

    const { signInWithEmailOtp, verifyEmailOtp, signInWithGoogle } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const from = location.state?.from?.pathname || '/';

    // --- Logic ---

    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (step === 'OTP' && resendTimer > 0) {
            timer = setInterval(() => setResendTimer(prev => prev - 1), 1000);
        }
        return () => clearInterval(timer);
    }, [step, resendTimer]);

    const handleSendOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (!email.includes('@') || !email.includes('.')) {
            setError('Please enter a valid email address');
            setLoading(false);
            return;
        }

        try {
            const { error } = await signInWithEmailOtp(email);
            if (error) throw error;
            setStep('OTP');
            setResendTimer(30);
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Failed to send OTP. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        if (otp.length < 6) {
            setError('Please enter a valid 6-digit OTP');
            setLoading(false);
            return;
        }

        try {
            const { error } = await verifyEmailOtp(email, otp);
            if (error) throw error;
            navigate(from, { replace: true });
        } catch (err: any) {
            console.error(err);
            setError(err.message || 'Invalid OTP. Please check and try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendOtp = async () => {
        if (resendTimer > 0) return;
        setLoading(true);
        setError(null);
        try {
            const { error } = await signInWithEmailOtp(email);
            if (error) throw error;
            setResendTimer(30);
            alert('OTP Resent Successfully');
        } catch (err: any) {
            setError(err.message || 'Failed to resend OTP');
        } finally {
            setLoading(false);
        }
    };

    // --- Render ---

    return (
        <div className="min-h-screen bg-[#1a1d2e] relative overflow-hidden font-sans text-white flex flex-col items-center justify-center">

            {/* --- CSS Animations --- */}
            <style>{`
            @import url('https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Inter:wght@400;500;600;700&family=Poppins:wght@600;700&display=swap');

            /* Star Animation */
            .star {
            position: absolute;
            background: white;
            border-radius: 50%;
            opacity: 0;
            animation: fall linear infinite;
            }

            @keyframes fall {
            0% { transform: translateY(-10vh); opacity: 0; }
            10% { opacity: 1; }
            90% { opacity: 1; }
            100% { transform: translateY(110vh); opacity: 0; }
            }

            /* Floating Bubbles */
            .bubble {
            position: absolute;
            border-radius: 50%;
            filter: blur(40px);
            opacity: 0.6;
            animation: float ease-in-out infinite;
            z-index: 0;
            }

            @keyframes float {
            0%, 100% { transform: translate(0, 0) scale(1); }
            33% { transform: translate(30px, -50px) scale(1.1); }
            66% { transform: translate(-20px, 20px) scale(0.9); }
            }

            /* Typing Text - Used in Landing View Header */
            .typing-container {
            display: inline-block;
            font-family: 'Caveat', cursive;
            font-size: 3.5rem;
            color: #4dbfec; /* Neon Blue-ish */
            position: relative;
            margin-bottom: 2rem;
            text-shadow: 0 0 10px rgba(77, 191, 236, 0.5);
            z-index: 10;
            }
            
            .typing-cursor {
            display: inline-block;
            width: 3px;
            height: 3.5rem;
            background-color: #db2777; /* Pink cursor */
            margin-left: 5px;
            animation: blink 1s step-end infinite;
            vertical-align: middle;
            }

            @keyframes blink {
            0%, 100% { opacity: 1; }
            50% { opacity: 0; }
            }
            
            @media (max-width: 640px) {
                .typing-container { font-size: 2.5rem; }
                .typing-cursor { height: 2.5rem; }
            }
            
            .rw-logo-container {
                width: 120px;
                height: 120px;
                background: white;
                border-radius: 20px;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 0 30px rgba(255, 255, 255, 0.2);
                margin: 0 auto 2rem auto;
            }

            .rw-text {
                font-family: serif;
                font-size: 3.5rem;
                font-weight: bold;
                color: black;
                line-height: 1;
            }
            
            .font-poppins {
                font-family: 'Poppins', sans-serif;
            }
        `}</style>


            {/* --- Background Animations --- */}

            {/* Falling Stars */}
            {[...Array(20)].map((_, i) => {
                const size = Math.random() * 3 + 1 + 'px';
                const left = Math.random() * 100 + '%';
                const duration = Math.random() * 3 + 2 + 's';
                const delay = Math.random() * 5 + 's';
                return (
                    <div
                        key={`star-${i}`}
                        className="star"
                        style={{
                            width: size,
                            height: size,
                            left,
                            animationDuration: duration,
                            animationDelay: delay
                        }}
                    />
                );
            })}

            {/* Floating Bubbles */}
            <div className="bubble bg-purple-600 w-64 h-64 top-10 -left-20" style={{ animationDuration: '12s' }}></div>
            <div className="bubble bg-pink-600 w-48 h-48 bottom-20 right-10" style={{ animationDuration: '15s', animationDelay: '1s' }}></div>
            <div className="bubble bg-blue-600 w-40 h-40 top-1/2 right-1/4" style={{ animationDuration: '10s', animationDelay: '2s' }}></div>
            <div className="bubble bg-indigo-600 w-56 h-56 -bottom-10 -left-10" style={{ animationDuration: '18s' }}></div>


            {/* --- Content --- */}

            <div className="relative z-10 flex flex-col items-center w-full px-4">

                {/* Landing View */}
                {step === 'LANDING' && (
                    <div className="w-full max-w-[480px] bg-[#0f1016]/80 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.6)] border border-gray-700/50 p-8 sm:p-12 backdrop-blur-md flex flex-col items-center text-center animate-in fade-in zoom-in-95 duration-500">

                        {/* Typing Header */}
                        <div className="mb-4 typing-container">
                            <Typewriter text="Education must be free" loop={true} />
                            <span className="typing-cursor"></span>
                        </div>

                        {/* RW Logo */}
                        <div className="rw-logo-container mb-12">
                            <div className="rw-text">
                                RW
                            </div>
                        </div>

                        {/* Buttons */}
                        <div className="w-full flex justify-center mb-8">
                            <button
                                onClick={signInWithGoogle}
                                className="w-full max-w-[280px] bg-white hover:bg-gray-100 text-gray-800 font-poppins font-semibold text-base py-3 rounded-xl shadow-lg transition-transform hover:scale-105 active:scale-95 tracking-wide flex items-center justify-center gap-3"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>

                        {/* Footer */}
                        <p className="text-gray-500 text-sm font-medium">
                            Education must be free for everyone
                        </p>
                    </div>
                )}

                {/* Login/OTP Card */}
                {step !== 'LANDING' && (
                    <div className="w-full max-w-[420px] bg-[#2a2d3a] rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-white/5 p-8 sm:p-10 backdrop-blur-sm transition-all duration-300">

                        {step === 'EMAIL' ? (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="text-center mb-8">
                                    <h1 className="text-[2rem] font-bold text-white mb-2 tracking-tight">Sign In</h1>
                                    <p className="text-gray-400 text-sm font-medium">Enter your email to continue</p>
                                </div>

                                <form onSubmit={handleSendOtp} className="space-y-6">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <Mail className="text-gray-400" size={20} />
                                            </div>
                                            <input
                                                type="email"
                                                value={email}
                                                onChange={(e) => setEmail(e.target.value)}
                                                className="w-full pl-12 pr-4 py-3.5 bg-[#383b4a] border border-transparent rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-[#383b4a] outline-none text-white placeholder-gray-500 transition-all font-medium text-lg"
                                                placeholder="Enter your Email"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="robot"
                                            className="w-4 h-4 rounded border-gray-600 bg-[#383b4a] text-purple-600 focus:ring-purple-500 focus:ring-offset-[#2a2d3a]"
                                            required
                                        />
                                        <label htmlFor="robot" className="text-sm text-gray-400 cursor-pointer select-none">I'm not a robot</label>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-xs text-center font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <button
                                        type="submit"
                                        disabled={loading}
                                        className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg shadow-lg shadow-purple-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base tracking-wide"
                                    >
                                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP'}
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setStep('LANDING')}
                                        className="w-full text-center text-sm text-gray-500 hover:text-white mt-4"
                                    >
                                        Back to Home
                                    </button>
                                </form>
                            </div>
                        ) : (
                            <div className="animate-in fade-in slide-in-from-right-8 duration-500">
                                <div className="text-center mb-8">
                                    <h1 className="text-[2rem] font-bold text-white mb-2 tracking-tight">Verify OTP</h1>
                                    <p className="text-gray-400 text-sm font-medium">OTP sent to <span className="text-white font-bold">{email}</span></p>
                                </div>

                                <form onSubmit={handleVerifyOtp} className="space-y-6">
                                    <div className="space-y-2">
                                        <input
                                            type="text"
                                            value={otp}
                                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                            className="w-full px-4 py-4 bg-[#383b4a] border border-transparent rounded-lg focus:ring-2 focus:ring-purple-500 focus:bg-[#383b4a] outline-none text-white placeholder-gray-500 transition-all font-mono font-bold text-2xl text-center tracking-[0.5em]"
                                            placeholder="000000"
                                            maxLength={6}
                                            required
                                            autoFocus
                                        />
                                    </div>

                                    <div className="text-center">
                                        {resendTimer > 0 ? (
                                            <p className="text-sm text-gray-500">You can resend OTP in <span className="text-white font-mono">{resendTimer}s</span></p>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={handleResendOtp}
                                                className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors"
                                            >
                                                Resend OTP
                                            </button>
                                        )}
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-300 text-xs text-center font-medium">
                                            {error}
                                        </div>
                                    )}

                                    <div className="flex flex-col gap-3">
                                        <button
                                            type="submit"
                                            disabled={loading}
                                            className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold rounded-lg shadow-lg shadow-purple-500/30 transition-all transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base tracking-wide"
                                        >
                                            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify OTP'}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => { setStep('EMAIL'); setOtp(''); setError(null); }}
                                            className="w-full py-3 text-gray-400 hover:text-white text-sm font-medium transition-colors"
                                        >
                                            Change Email Address
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}
                    </div>
                )}

                {/* Footer */}
                {step !== 'LANDING' && (
                    <div className="mt-8 text-center animate-in fade-in duration-1000 delay-500">
                        <p className="text-gray-500 text-xs flex items-center gap-1.5 opacity-80">
                            Made with <Heart size={12} className="text-red-500 fill-current animate-pulse" /> by RW THOR
                        </p>
                    </div>
                )}

            </div>

        </div>
    );
};

// Typing Helper Component
const Typewriter = ({ text, loop = false }: { text: string; loop?: boolean }) => {
    const [currentText, setCurrentText] = useState('');
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (isDeleting) {
            // Backspacing
            if (currentText.length > 0) {
                timeout = setTimeout(() => {
                    setCurrentText(prev => prev.slice(0, -1));
                }, 50);
            } else {
                // Finished deleting, start typing again
                setIsDeleting(false);
                setCurrentIndex(0);
                timeout = setTimeout(() => { }, 500); // Pause before re-typing
            }
        } else {
            // Typing
            if (currentIndex < text.length) {
                timeout = setTimeout(() => {
                    setCurrentText(prev => prev + text[currentIndex]);
                    setCurrentIndex(prev => prev + 1);
                }, 100);
            } else if (loop) {
                // Finished typing, pause then delete
                timeout = setTimeout(() => {
                    setIsDeleting(true);
                }, 2000); // Pause 2s at end
            }
        }

        return () => clearTimeout(timeout);
    }, [currentIndex, text, loop, isDeleting, currentText]);

    return <>{currentText}</>;
};

export default LoginPage;
