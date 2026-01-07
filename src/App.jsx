import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import {
    Play,
    Square,
    CheckSquare,
    Plus,
    Trash2,
    Flame,
    Brain,
    ShieldAlert,
    Radio,
    Maximize,
    Minimize,
    X,
    AlertTriangle,
    Target,
    Zap,
    Lock,
    Settings,
    Calendar
} from 'lucide-react';

// --- Utility Components ---

// Glitch Text Effect Component
const GlitchText = ({ text, active = false }) => {
    return (
        <div className="relative inline-block">
            <span className="relative z-10">{text}</span>
            {active && (
                <>
                    <span className="absolute top-0 left-0 -ml-[2px] text-red-500 opacity-70 animate-pulse z-0">{text}</span>
                    <span className="absolute top-0 left-0 ml-[2px] text-blue-500 opacity-70 animate-pulse z-0 delay-75">{text}</span>
                </>
            )}
        </div>
    );
};

// --- Main Application ---

const App = () => {
    // --- State Management ---

    // System State
    const [defcon, setDefcon] = useState(() => Number(localStorage.getItem('codeRedDefcon')) || 3); // 1 = Critical (Red), 5 = Calm (Blue)
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [permissionError, setPermissionError] = useState(false);
    const [isRTL, setIsRTL] = useState(() => JSON.parse(localStorage.getItem('codeRedIsRTL')) || false);

    // Timer Settings
    const [focusTime, setFocusTime] = useState(() => Number(localStorage.getItem('codeRedFocusTime')) || 25); // minutes
    const [breakTime, setBreakTime] = useState(() => Number(localStorage.getItem('codeRedBreakTime')) || 5); // minutes

    // Timer State
    const [timerMode, setTimerMode] = useState(() => localStorage.getItem('codeRedTimerMode') || 'FOCUS'); // FOCUS | BREAK
    const [timeLeft, setTimeLeft] = useState(() => Number(localStorage.getItem('codeRedTimeLeft')) || focusTime * 60);
    const [isActive, setIsActive] = useState(() => JSON.parse(localStorage.getItem('codeRedIsActive')) || false);
    const [initialTime, setInitialTime] = useState(focusTime * 60);

    // The Anti-Quit State
    const [isHoldingStop, setIsHoldingStop] = useState(false);
    const [stopProgress, setStopProgress] = useState(0); // 0 to 100

    // User Data
    const [streak, setStreak] = useState(() => Number(localStorage.getItem('codeRedStreak')) || 0);
    const [tasks, setTasks] = useState(() => {
        const saved = localStorage.getItem('codeRedTasks');
        return saved ? JSON.parse(saved) : [
            { id: 1, text: "Review Chapter 4 Thermodynamics", completed: false },
            { id: 2, text: "Practice Calculus Integrals", completed: false },
        ];
    });
    const [distractions, setDistractions] = useState(() => {
        const saved = localStorage.getItem('codeRedDistractions');
        return saved ? JSON.parse(saved) : [];
    });
    const [newTask, setNewTask] = useState("");
    const [newDistraction, setNewDistraction] = useState("");

    // Modal State
    const [showReport, setShowReport] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    // Countdown
    const [targetDate, setTargetDate] = useState(() => {
        const saved = localStorage.getItem('codeRedTargetDate');
        return saved ? new Date(saved) : new Date('2026-01-07');
    });
    const [countdown, setCountdown] = useState('00:00:00:00');

    // Audio
    const [playlistUrl, setPlaylistUrl] = useState(() => localStorage.getItem('codeRedPlaylistUrl') || 'https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0');
    const [searchQuery, setSearchQuery] = useState('');

    // Audio Refs (Simulated for this demo)
    const holdIntervalRef = useRef(null);

    // --- Theme Logic ---

    const getThemeColor = () => {
        if (defcon === 1) return 'text-[#ff0033] border-[#ff0033] shadow-[#ff0033]';
        if (defcon === 2) return 'text-orange-500 border-orange-500 shadow-orange-500';
        if (defcon === 3) return 'text-yellow-400 border-yellow-400 shadow-yellow-400';
        if (defcon === 4) return 'text-cyan-400 border-cyan-400 shadow-cyan-400';
        return 'text-emerald-400 border-emerald-400 shadow-emerald-400';
    };

    const getBgGlow = () => {
        if (defcon === 1) return 'shadow-[inset_0_0_100px_rgba(255,0,51,0.2)]';
        return '';
    };

    const themeClass = getThemeColor();

    // --- Local Storage Logic ---

    useEffect(() => {
        localStorage.setItem('codeRedTasks', JSON.stringify(tasks));
    }, [tasks]);

    useEffect(() => {
        localStorage.setItem('codeRedDistractions', JSON.stringify(distractions));
    }, [distractions]);

    useEffect(() => {
        localStorage.setItem('codeRedFocusTime', focusTime);
    }, [focusTime]);

    useEffect(() => {
        localStorage.setItem('codeRedBreakTime', breakTime);
    }, [breakTime]);

    useEffect(() => {
        localStorage.setItem('codeRedStreak', streak);
    }, [streak]);

    useEffect(() => {
        localStorage.setItem('codeRedTargetDate', targetDate.toISOString());
    }, [targetDate]);

    useEffect(() => {
        localStorage.setItem('codeRedIsRTL', JSON.stringify(isRTL));
    }, [isRTL]);

    useEffect(() => {
        localStorage.setItem('codeRedIsActive', JSON.stringify(isActive));
    }, [isActive]);

    useEffect(() => {
        localStorage.setItem('codeRedTimeLeft', timeLeft);
    }, [timeLeft]);

    useEffect(() => {
        localStorage.setItem('codeRedTimerMode', timerMode);
    }, [timerMode]);

    useEffect(() => {
        localStorage.setItem('codeRedDefcon', defcon);
    }, [defcon]);

    useEffect(() => {
        localStorage.setItem('codeRedPlaylistUrl', playlistUrl);
    }, [playlistUrl]);

    useEffect(() => {
        if (!isActive) {
            setTimeLeft(focusTime * 60);
            setInitialTime(focusTime * 60);
        }
    }, [focusTime]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCountdown(getCountdown());
        }, 1000);
        return () => clearInterval(interval);
    }, [targetDate]);

    // --- Timer Logic ---

    useEffect(() => {
        let interval = null;
        if (isActive && timeLeft > 0) {
            interval = setInterval(() => {
                setTimeLeft((time) => time - 1);
            }, 1000);
        } else if (isActive && timeLeft === 0) {
            handleTimerComplete();
        }
        return () => clearInterval(interval);
    }, [isActive, timeLeft]);

    const handleTimerComplete = () => {
        setIsActive(false);
        if (timerMode === 'FOCUS') {
            setStreak(s => s + 1);
            setShowReport(true);
            // Play alarm sound logic here
        } else {
            // Break over
            setTimerMode('FOCUS');
            setTimeLeft(focusTime * 60);
            setInitialTime(focusTime * 60);
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };

    // --- Anti-Quit Protocol Logic ---

    const startHoldingStop = () => {
        if (!isActive) return;
        setIsHoldingStop(true);
        let progress = 0;

        holdIntervalRef.current = setInterval(() => {
            progress += 2; // Increases every 10ms, takes 500ms * 10 = 5000ms? No, 100/2 = 50 ticks. 50 * 100ms = 5000ms.
            setStopProgress(progress);

            if (progress >= 100) {
                clearInterval(holdIntervalRef.current);
                setIsActive(false);
                setIsHoldingStop(false);
                setStopProgress(0);
                setTimerMode('FOCUS'); // Reset
                setTimeLeft(initialTime);
            }
        }, 100);
    };

    const cancelHoldingStop = () => {
        if (holdIntervalRef.current) clearInterval(holdIntervalRef.current);
        setIsHoldingStop(false);
        setStopProgress(0);
    };

    // --- Handlers ---

    const toggleTimer = () => {
        if (!isActive) {
            setIsActive(true);
        }
    };

    const addTask = (e) => {
        if (e.key === 'Enter' && newTask.trim()) {
            setTasks([...tasks, { id: Date.now(), text: newTask, completed: false }]);
            setNewTask("");
        }
    };

    const toggleTask = (id) => {
        setTasks(tasks.map(t => t.id === id ? { ...t, completed: !t.completed } : t));
    };

    const addDistraction = (e) => {
        if (e.key === 'Enter' && newDistraction.trim()) {
            setDistractions([...distractions, { id: Date.now(), text: newDistraction }]);
            setNewDistraction("");
        }
    };

    const toggleFullscreen = async () => {
        try {
            if (!document.fullscreenElement) {
                // Check if requestFullscreen exists (browser compatibility)
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                    setIsFullscreen(true);
                    setPermissionError(false);
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                    setIsFullscreen(false);
                }
            }
        } catch (err) {
            console.warn("Fullscreen toggle failed due to permissions policy:", err);
            // Set visual error state instead of crashing
            setPermissionError(true);
            setTimeout(() => setPermissionError(false), 3000);
        }
    };

    // --- Render Helpers ---

    const getStopButtonText = () => {
        if (stopProgress < 20) return "HOLD TO ABORT";
        if (stopProgress < 50) return "WARNING: COWARDICE DETECTED";
        if (stopProgress < 80) return "HOLD THE LINE SOLDIER!";
        return "DON'T DO IT...";
    };

    const getCountdown = () => {
        const now = new Date();
        const diff = targetDate - now;
        if (diff <= 0) return "00:00:00:00";
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((diff % (1000 * 60)) / 1000);
        return `${days.toString().padStart(2, '0')}:${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    };

    return (
        <div className={`min-h-screen bg-[#050505] text-gray-300 font-mono overflow-hidden relative selection:bg-red-900 selection:text-white transition-colors duration-1000 ${defcon === 1 ? 'animate-pulse-slow-bg' : ''}`}>

            {/* Background Grid Overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-10 z-0"
                style={{ backgroundImage: 'linear-gradient(#333 1px, transparent 1px), linear-gradient(90deg, #333 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
            </div>

            {/* Scanline Effect */}
            <div className="absolute inset-0 pointer-events-none z-50 opacity-[0.03] bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>

            {/* Main Container */}
            <div className={`relative z-10 w-full p-4 md:p-6 h-screen flex flex-col ${getBgGlow()}`}>

                {/* --- Header / HUD --- */}
                <header className="flex flex-col md:flex-row justify-between items-center border-b border-gray-800 pb-4 mb-6">
                    <div className="flex items-center gap-3">
                        <ShieldAlert className={`${defcon === 1 ? 'text-red-600 animate-pulse' : 'text-gray-500'}`} size={32} />
                        <div>
                            <h1 className="text-2xl tracking-widest font-black uppercase">
                                CODE RED <span className="text-xs align-top opacity-50">v.2.0.4</span>
                            </h1>
                            <div className="flex items-center gap-2 text-xs opacity-70">
                                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping"></span>
                                SYSTEM ONLINE
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 mt-4 md:mt-0 bg-[#0f0f0f] p-2 rounded border border-gray-800">
                        <span className="text-xs uppercase tracking-widest mr-2">DEFCON LEVEL</span>
                        {[1, 2, 3, 4, 5].map((level) => (
                            <button
                                key={level}
                                onClick={() => setDefcon(level)}
                                className={`w-8 h-8 flex items-center justify-center font-bold text-sm transition-all duration-300
                  ${defcon === level
                                        ? level === 1 ? 'bg-red-600 text-black shadow-[0_0_15px_#ff0000]' :
                                            level === 5 ? 'bg-emerald-500 text-black shadow-[0_0_15px_#10b981]' :
                                                'bg-gray-200 text-black'
                                        : 'bg-gray-900 text-gray-600 hover:bg-gray-800'}`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>

                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-4">
                            <button onClick={() => setShowSettings(true)} className="flex items-center gap-2 text-xs uppercase hover:text-white transition-colors">
                                <Settings size={14} /> Settings
                            </button>
                            <button onClick={toggleFullscreen} className="hidden md:flex items-center gap-2 text-xs uppercase hover:text-white transition-colors">
                                {isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                                {isFullscreen ? "Disengage Lock" : "Engage Lock"}
                            </button>
                        </div>
                        {permissionError && (
                            <span className="text-[10px] text-red-500 font-bold animate-pulse mt-1">
                                ACCESS DENIED
                            </span>
                        )}
                    </div>
                </header>

                {/* --- Main Grid --- */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">

                    {/* LEFT COLUMN: Mission Log & Distractions (3 cols) */}
                    <div className={`lg:col-span-3 flex flex-col gap-6 overflow-hidden ${isRTL ? 'lg:order-3' : ''}`}>

                        {/* Mission Log */}
                        <div className="bg-[#0a0a0a] border border-gray-800 flex-1 flex flex-col relative overflow-hidden group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gray-800 group-hover:bg-blue-500 transition-colors"></div>
                            <div className="p-3 bg-[#0f0f0f] border-b border-gray-800 flex justify-between items-center">
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Target size={14} /> Mission Log
                                </h3>
                                <span className="text-xs opacity-50">{tasks.filter(t => t.completed).length}/{tasks.length}</span>
                            </div>
                            <div className="p-3 overflow-y-auto flex-1 custom-scrollbar">
                                {tasks.map(task => (
                                    <div key={task.id} className="flex items-start gap-3 mb-3 group/item">
                                        <button onClick={() => toggleTask(task.id)} className={`mt-1 transition-colors ${task.completed ? 'text-green-500' : 'text-gray-600 hover:text-white'}`}>
                                            {task.completed ? <CheckSquare size={16} /> : <Square size={16} />}
                                        </button>
                                        <span className={`text-sm flex-1 text-right ${task.completed ? 'line-through opacity-30' : 'opacity-90'}`}>{task.text}</span>
                                        <button onClick={() => setTasks(tasks.filter(t => t.id !== task.id))} className="ml-auto opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-400">
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}
                                <div className="flex items-center gap-2 mt-4 pt-2 border-t border-gray-800 opacity-50 focus-within:opacity-100 transition-opacity">
                                    <Plus size={14} />
                                    <input
                                        type="text"
                                        value={newTask}
                                        onChange={(e) => setNewTask(e.target.value)}
                                        onKeyDown={addTask}
                                        placeholder="New objective..."
                                        dir={isRTL ? 'rtl' : 'ltr'}
                                        className="bg-transparent border-none outline-none text-sm w-full placeholder-gray-700"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Distraction Bunker */}
                        <div className="bg-[#0a0a0a] border border-gray-800 h-1/3 flex flex-col relative group">
                            <div className="absolute top-0 left-0 w-1 h-full bg-gray-800 group-hover:bg-purple-600 transition-colors"></div>
                            <div className="p-3 bg-[#0f0f0f] border-b border-gray-800">
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2 text-purple-400">
                                    <Brain size={14} /> Mental Waste
                                </h3>
                            </div>
                            <div className="p-3 flex-1 flex flex-col">
                                <input
                                    type="text"
                                    value={newDistraction}
                                    onChange={(e) => setNewDistraction(e.target.value)}
                                    onKeyDown={addDistraction}
                                    placeholder="Discharge thought..."
                                    dir={isRTL ? 'rtl' : 'ltr'}
                                    className="bg-[#050505] border border-gray-800 p-2 text-xs outline-none focus:border-purple-500 transition-colors mb-2"
                                />
                                <div className="flex-1 overflow-y-auto custom-scrollbar">
                                    {distractions.map(d => (
                                        <div key={d.id} className="flex items-start gap-3 mb-3 group/item">
                                            <span className="text-xs opacity-40 border-l-2 border-gray-800 pl-2 flex-1 text-right">{d.text}</span>
                                            <button onClick={() => setDistractions(distractions.filter(dist => dist.id !== d.id))} className="opacity-0 group-hover/item:opacity-100 text-red-500 hover:text-red-400">
                                                <Trash2 size={12} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                    </div>

                    {/* CENTER COLUMN: The Reactor (Timer) (6 cols) */}
                    <div className={`lg:col-span-6 flex flex-col justify-center items-center relative ${isRTL ? 'lg:order-2' : ''}`}>

                        {/* Center HUD Decoration */}
                        <div className={`absolute inset-0 border border-gray-800 opacity-30 pointer-events-none transition-all duration-500 ${isActive ? 'border-opacity-60 scale-100' : 'scale-95'}`}>
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-current"></div>
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-current"></div>
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-current"></div>
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-current"></div>
                        </div>

                        {/* Streak Counter (The Heating Up Element) */}
                        <div className="mb-8 relative">
                            <AnimatePresence>
                                {streak >= 3 && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: [0.4, 0.8, 0.4], scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity }}
                                        className="absolute inset-0 bg-orange-500 blur-2xl rounded-full -z-10"
                                    />
                                )}
                            </AnimatePresence>
                            <div className={`flex flex-col items-center ${streak >= 3 ? 'text-orange-500 drop-shadow-[0_0_10px_rgba(255,165,0,0.8)]' : 'text-gray-500'}`}>
                                <div className="text-xs uppercase tracking-[0.3em] mb-1">Current Streak</div>
                                <div className="flex items-end leading-none">
                                    <span className="text-6xl font-black">{streak}</span>
                                    <Flame
                                        size={32}
                                        className={`mb-2 ml-2 transition-all duration-500 ${streak >= 3 ? 'fill-orange-500 animate-bounce' : 'opacity-20'}`}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* THE TIMER */}
                        <div className="relative mb-12">
                            <motion.div
                                animate={{ scale: isActive ? [1, 1.01, 1] : 1 }}
                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                className={`text-8xl md:text-9xl font-black tracking-tighter tabular-nums ${timerMode === 'BREAK' ? 'text-green-500' : themeClass.split(' ')[0]}`}
                                style={{ textShadow: isActive && defcon === 1 ? '0 0 20px rgba(255,0,51,0.5)' : 'none' }}
                            >
                                {formatTime(timeLeft)}
                            </motion.div>

                            <div className="absolute -bottom-6 w-full flex justify-center gap-4 text-xs tracking-widest uppercase opacity-60">
                                <span className={timerMode === 'FOCUS' ? 'text-white font-bold' : ''}>Focus</span>
                                <span>//</span>
                                <span className={timerMode === 'BREAK' ? 'text-white font-bold' : ''}>Recovery</span>
                            </div>
                        </div>

                        {/* CONTROLS */}
                        <div className="flex flex-col items-center gap-4 w-full max-w-md">
                            {!isActive ? (
                                <button
                                    onClick={toggleTimer}
                                    className={`group relative overflow-hidden w-full py-4 bg-gray-900 border ${themeClass.split(' ')[1]} hover:bg-gray-800 transition-all uppercase tracking-[0.2em] font-bold`}
                                >
                                    <span className="relative z-10 flex items-center justify-center gap-2">
                                        <Play size={18} className="fill-current" /> Engage Protocol
                                    </span>
                                    <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity bg-current`}></div>
                                </button>
                            ) : (
                                <div className="w-full relative">
                                    {/* The Anti-Quit Button */}
                                    <button
                                        onMouseDown={startHoldingStop}
                                        onMouseUp={cancelHoldingStop}
                                        onMouseLeave={cancelHoldingStop}
                                        onTouchStart={startHoldingStop}
                                        onTouchEnd={cancelHoldingStop}
                                        className={`relative w-full h-16 bg-[#1a0505] border border-red-900 overflow-hidden flex items-center justify-center select-none cursor-pointer transition-all ${isHoldingStop ? 'scale-95 border-red-500' : 'hover:border-red-700'}`}
                                    >
                                        {/* Progress Fill */}
                                        <div
                                            className="absolute left-0 top-0 bottom-0 bg-red-600 transition-all duration-100 ease-linear"
                                            style={{ width: `${stopProgress}%` }}
                                        ></div>

                                        {/* Text/Content */}
                                        <div className="relative z-10 flex flex-col items-center text-red-500">
                                            <span className={`font-bold tracking-widest uppercase ${isHoldingStop ? 'text-white animate-pulse' : ''}`}>
                                                {getStopButtonText()}
                                            </span>
                                            {!isHoldingStop && <span className="text-[10px] opacity-50 tracking-wider">HOLD 5s TO ABORT</span>}
                                        </div>

                                        {/* Warning Stripes */}
                                        {isHoldingStop && (
                                            <div className="absolute inset-0 w-full h-full opacity-10" style={{ backgroundImage: 'repeating-linear-gradient(45deg, #000 0, #000 10px, #fff 10px, #fff 20px)' }}></div>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                    </div>

                    {/* RIGHT COLUMN: Spotify & Defcon Details (3 cols) */}
                    <div className={`lg:col-span-3 flex flex-col gap-6 ${isRTL ? 'lg:order-1' : ''}`}>

                        {/* Spotify Deck */}
                        <div className="bg-[#0a0a0a] border border-gray-800 flex-1 flex flex-col relative">
                            <div className="absolute top-0 right-0 w-1 h-full bg-gray-800"></div>
                            <div className="p-3 bg-[#0f0f0f] border-b border-gray-800">
                                <h3 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Radio size={14} /> Audio Uplink
                                </h3>
                            </div>
                            <div className="p-3 bg-black flex-1 flex flex-col">
                                <div className="flex gap-2 mb-2 flex-wrap">
                                    <button onClick={() => setPlaylistUrl('https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0')} className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 text-xs uppercase">Deep Focus</button>
                                    <button onClick={() => setPlaylistUrl('https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0')} className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 text-xs uppercase">Study Beats</button>
                                    <button onClick={() => setPlaylistUrl('https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd?utm_source=generator&theme=0')} className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 text-xs uppercase">Lo-Fi Study</button>
                                    <button onClick={() => window.open(playlistUrl.replace('/embed/', '/').split('?')[0], '_blank')} className="bg-green-700 hover:bg-green-600 text-white py-1 px-2 text-xs uppercase">Open in Spotify</button>
                                </div>
                                <input
                                    type="url"
                                    value={playlistUrl}
                                    onChange={(e) => setPlaylistUrl(e.target.value)}
                                    placeholder="Custom Spotify embed URL"
                                    className="bg-gray-800 border border-gray-700 p-2 text-white outline-none focus:border-blue-500 mb-2 text-xs"
                                />
                                <div className="flex gap-2 mb-2">
                                    <input
                                        type="text"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        placeholder="Search song or artist"
                                        className="flex-1 bg-gray-800 border border-gray-700 p-2 text-white outline-none focus:border-blue-500 text-xs"
                                        onKeyDown={(e) => e.key === 'Enter' && window.open(`https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`, '_blank')}
                                    />
                                    <button onClick={() => window.open(`https://open.spotify.com/search/${encodeURIComponent(searchQuery)}`, '_blank')} className="bg-blue-700 hover:bg-blue-600 text-white py-2 px-3 text-xs uppercase">Search</button>
                                </div>
                                <iframe
                                    style={{ borderRadius: '12px' }}
                                    src={playlistUrl}
                                    width="100%"
                                    height="100%"
                                    frameBorder="0"
                                    allowFullScreen=""
                                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                    loading="lazy"
                                    className="opacity-80 hover:opacity-100 transition-opacity flex-1"
                                ></iframe>
                            </div>
                        </div>

                        {/* Status Readout */}
                        <div className="bg-[#0a0a0a] border border-gray-800 p-4 font-mono text-xs text-gray-500 flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between mb-2">
                                    <span>SYS_TEMP</span>
                                    <span className={streak > 2 ? "text-red-500 animate-pulse" : "text-green-500"}>
                                        {streak > 2 ? "CRITICAL" : "NOMINAL"}
                                    </span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span>FOCUS_LOCK</span>
                                    <span>{isActive ? "ACTIVE" : "STANDBY"}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span>COUNTDOWN</span>
                                    <span className="text-cyan-400">{countdown}</span>
                                </div>
                                <div className="flex justify-between mb-2">
                                    <span>DATE</span>
                                    <span>{new Date().toLocaleDateString()}</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-800 pt-2 opacity-50">
                                <p className="mb-1">"Pain is temporary. GPA is forever."</p>
                                <p className="text-right">- COMMAND</p>
                            </div>
                        </div>

                    </div>

                </div>
            </div>

            {/* --- Mission Report Modal --- */}
            <AnimatePresence>
                {showReport && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0f0f0f] border border-green-500 w-full max-w-lg p-8 relative shadow-[0_0_50px_rgba(16,185,129,0.2)]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-green-500 to-transparent"></div>

                            <h2 className="text-3xl font-black text-white uppercase tracking-widest mb-2 text-center">Mission Accomplished</h2>
                            <p className="text-green-500 text-center font-mono text-sm mb-8 tracking-wider">SECTOR SECURED</p>

                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <div className="bg-black border border-gray-800 p-4 text-center">
                                    <div className="text-xs text-gray-500 uppercase mb-1">Total Focus</div>
                                    <div className="text-2xl text-white font-bold">25:00</div>
                                </div>
                                <div className="bg-black border border-gray-800 p-4 text-center">
                                    <div className="text-xs text-gray-500 uppercase mb-1">Streak Bonus</div>
                                    <div className="text-2xl text-orange-500 font-bold flex items-center justify-center gap-1">
                                        <Flame size={18} /> +1
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <button
                                    onClick={() => {
                                        setShowReport(false);
                                        setTimerMode('BREAK');
                                        setTimeLeft(breakTime * 60);
                                        setInitialTime(breakTime * 60);
                                        setIsActive(true); // Auto start break? Maybe optional.
                                    }}
                                    className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-3 uppercase tracking-widest transition-colors"
                                >
                                    Initiate Rest Cycle
                                </button>
                                <button
                                    onClick={() => setShowReport(false)}
                                    className="w-full bg-transparent border border-gray-700 hover:border-gray-500 text-gray-400 py-3 uppercase tracking-widest transition-colors"
                                >
                                    Close Report
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* --- Settings Modal --- */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur-sm p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-[#0f0f0f] border border-blue-500 w-full max-w-md p-6 relative shadow-[0_0_50px_rgba(59,130,246,0.2)]"
                        >
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent"></div>

                            <h2 className="text-2xl font-black text-white uppercase tracking-widest mb-4 text-center">System Settings</h2>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">Focus Time (minutes)</label>
                                    <input
                                        type="number"
                                        value={focusTime}
                                        onChange={(e) => setFocusTime(Number(e.target.value))}
                                        className="w-full bg-black border border-gray-800 p-2 text-white outline-none focus:border-blue-500"
                                        min="1"
                                        max="120"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">Break Time (minutes)</label>
                                    <input
                                        type="number"
                                        value={breakTime}
                                        onChange={(e) => setBreakTime(Number(e.target.value))}
                                        className="w-full bg-black border border-gray-800 p-2 text-white outline-none focus:border-blue-500"
                                        min="1"
                                        max="60"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">Target Date</label>
                                    <input
                                        type="date"
                                        value={targetDate.toISOString().split('T')[0]}
                                        onChange={(e) => setTargetDate(new Date(e.target.value))}
                                        className="w-full bg-black border border-gray-800 p-2 text-white outline-none focus:border-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold uppercase tracking-wider mb-2">Spotify Playlist URL</label>
                                    <input
                                        type="url"
                                        value={playlistUrl}
                                        onChange={(e) => setPlaylistUrl(e.target.value)}
                                        placeholder="Enter Spotify embed URL"
                                        className="w-full bg-black border border-gray-800 p-2 text-white outline-none focus:border-blue-500 mb-2"
                                    />
                                    <div className="flex gap-2 flex-wrap">
                                        <button onClick={() => setPlaylistUrl('https://open.spotify.com/embed/playlist/37i9dQZF1DWWQRwui0ExPn?utm_source=generator&theme=0')} className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 text-xs uppercase">Deep Focus</button>
                                        <button onClick={() => setPlaylistUrl('https://open.spotify.com/embed/playlist/37i9dQZF1DX8Uebhn9wzrS?utm_source=generator&theme=0')} className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 text-xs uppercase">Study Beats</button>
                                        <button onClick={() => setPlaylistUrl('https://open.spotify.com/embed/playlist/37i9dQZF1DX0XUsuxWHRQd?utm_source=generator&theme=0')} className="bg-gray-700 hover:bg-gray-600 text-white py-1 px-2 text-xs uppercase">Lo-Fi Study</button>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between">
                                    <label className="text-sm font-bold uppercase tracking-wider">Hebrew RTL Mode</label>
                                    <button
                                        onClick={() => setIsRTL(!isRTL)}
                                        className={`w-12 h-6 rounded-full transition-colors ${isRTL ? 'bg-blue-500' : 'bg-gray-600'}`}
                                    >
                                        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isRTL ? 'translate-x-6' : 'translate-x-1'}`}></div>
                                    </button>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 uppercase tracking-widest transition-colors"
                                >
                                    Close
                                </button>
                            </div>

                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* CSS Logic for custom animations */}
            <style>{`
        @keyframes pulse-bg {
           0%, 100% { background-color: #050505; }
           50% { background-color: #1a0505; }
        }
        .animate-pulse-slow-bg {
           animation: pulse-bg 4s ease-in-out infinite;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #000;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #333;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #555;
        }
      `}</style>

        </div>
    );
};

export default App;