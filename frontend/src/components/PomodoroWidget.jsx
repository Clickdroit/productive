import { useState, useEffect, useRef, useCallback } from 'react';
import api from '../lib/api';

const WORK_DURATION = 25 * 60;
const BREAK_DURATION = 5 * 60;

export default function PomodoroWidget() {
    const [timeLeft, setTimeLeft] = useState(WORK_DURATION);
    const [isRunning, setIsRunning] = useState(false);
    const [isBreak, setIsBreak] = useState(false);
    const [workDuration, setWorkDuration] = useState(WORK_DURATION);
    const [breakDuration, setBreakDuration] = useState(BREAK_DURATION);
    const [sessionId, setSessionId] = useState(null);
    const [sessions, setSessions] = useState([]);
    const [todos, setTodos] = useState([]);
    const [todoId, setTodoId] = useState('');
    const [productivity, setProductivity] = useState([]);
    const [range, setRange] = useState('week');
    const [stats, setStats] = useState({ totalSessions: 0, todaySessions: 0, totalMinutes: 0 });
    const intervalRef = useRef(null);

    useEffect(() => {
        fetchSessions();
        fetchStats();
        fetchTodos();
        return () => clearInterval(intervalRef.current);
    }, []);

    useEffect(() => { fetchProductivity(); }, [range]);

    const fetchSessions = async () => {
        try {
            const res = await api.get('/pomodoro');
            setSessions(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/pomodoro/stats');
            setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchTodos = async () => {
        try {
            const res = await api.get('/todos');
            setTodos(res.data.filter((t) => t.status !== 'DONE'));
        } catch (err) { console.error(err); }
    };

    const fetchProductivity = async () => {
        try {
            const res = await api.get('/pomodoro/productivity', { params: { range } });
            setProductivity(res.data);
        } catch (err) { console.error(err); }
    };

    const startTimer = useCallback(async () => {
        if (!isRunning) {
            try {
                const res = await api.post('/pomodoro', {
                    duration: isBreak ? breakDuration : workDuration,
                    type: isBreak ? 'break' : 'work',
                    todoId: todoId || null,
                });
                setSessionId(res.data.id);
            } catch (err) { console.error(err); }
            setIsRunning(true);
        }
    }, [isRunning, isBreak, workDuration, breakDuration, todoId]);

    useEffect(() => {
        if (isRunning && timeLeft > 0) {
            intervalRef.current = setInterval(() => {
                setTimeLeft((t) => t - 1);
            }, 1000);
        } else if (timeLeft === 0 && isRunning) {
            clearInterval(intervalRef.current);
            completeSession();
        }
        return () => clearInterval(intervalRef.current);
    }, [isRunning, timeLeft]);

    const completeSession = async () => {
        setIsRunning(false);
        if (sessionId) {
            try {
                await api.patch(`/pomodoro/${sessionId}/complete`);
            } catch (err) { console.error(err); }
        }
        setSessionId(null);
        fetchSessions();
        fetchStats();
        // Auto-switch
        if (!isBreak) {
            setIsBreak(true);
            setTimeLeft(breakDuration);
        } else {
            setIsBreak(false);
            setTimeLeft(workDuration);
        }
        try {
            if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
                new Notification('Pomodoro terminé', { body: isBreak ? 'Fin de pause' : 'Session de travail terminée' });
            }
        } catch (err) { console.error(err); }
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = ctx.createOscillator();
            const gain = ctx.createGain();
            oscillator.type = 'sine';
            oscillator.frequency.value = 880;
            oscillator.connect(gain);
            gain.connect(ctx.destination);
            oscillator.start();
            gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.4);
            oscillator.stop(ctx.currentTime + 0.4);
        } catch (err) { console.error(err); }
    };

    const pauseTimer = () => {
        setIsRunning(false);
    };

    const resetTimer = () => {
        setIsRunning(false);
        setSessionId(null);
        setTimeLeft(isBreak ? breakDuration : workDuration);
    };

    const switchMode = (toBreak) => {
        setIsRunning(false);
        setSessionId(null);
        setIsBreak(toBreak);
        setTimeLeft(toBreak ? breakDuration : workDuration);
    };

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    const total = isBreak ? breakDuration : workDuration;
    const progress = ((total - timeLeft) / total) * 100;
    const circumference = 2 * Math.PI * 120;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Timer */}
            <div className="glass-card p-8 flex flex-col items-center">
                {/* Mode toggle */}
                <div className="flex gap-2 mb-8">
                    <button
                        onClick={() => switchMode(false)}
                        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${!isBreak
                                ? 'bg-brand-600/30 text-white border border-brand-500/30'
                                : 'text-zinc-400 hover:text-white bg-white/5'
                            }`}
                    >
                        🍅 Travail ({Math.round(workDuration / 60)}min)
                    </button>
                    <button
                        onClick={() => switchMode(true)}
                        className={`px-5 py-2 rounded-xl text-sm font-medium transition-all duration-200 ${isBreak
                                ? 'bg-emerald-600/30 text-white border border-emerald-500/30'
                                : 'text-zinc-400 hover:text-white bg-white/5'
                            }`}
                    >
                        ☕ Pause ({Math.round(breakDuration / 60)}min)
                    </button>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-6 w-full max-w-md">
                    <label className="text-xs text-zinc-400">
                        Travail (min)
                        <input type="number" min="1" max="180" className="input-field mt-1" value={Math.round(workDuration / 60)} onChange={(e) => {
                            const next = Math.max(1, Number(e.target.value || 1));
                            setWorkDuration(next * 60);
                            if (!isBreak && !isRunning) setTimeLeft(next * 60);
                        }} />
                    </label>
                    <label className="text-xs text-zinc-400">
                        Pause (min)
                        <input type="number" min="1" max="60" className="input-field mt-1" value={Math.round(breakDuration / 60)} onChange={(e) => {
                            const next = Math.max(1, Number(e.target.value || 1));
                            setBreakDuration(next * 60);
                            if (isBreak && !isRunning) setTimeLeft(next * 60);
                        }} />
                    </label>
                </div>
                <div className="w-full max-w-md mb-6">
                    <select className="input-field" value={todoId} onChange={(e) => setTodoId(e.target.value)}>
                        <option value="">Aucune tâche liée</option>
                        {todos.map((todo) => <option key={todo.id} value={todo.id}>{todo.title}</option>)}
                    </select>
                </div>

                {/* Circular timer */}
                <div className="relative mb-8">
                    <svg width="280" height="280" className="transform -rotate-90">
                        <circle cx="140" cy="140" r="120" stroke="rgba(255,255,255,0.05)" strokeWidth="8" fill="none" />
                        <circle
                            cx="140" cy="140" r="120"
                            stroke={isBreak ? '#10b981' : '#8b5cf6'}
                            strokeWidth="8" fill="none"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            className="transition-all duration-1000"
                            style={{ filter: `drop-shadow(0 0 8px ${isBreak ? '#10b98155' : '#8b5cf655'})` }}
                        />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-6xl font-bold text-white tabular-nums">
                            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
                        </span>
                        <span className="text-sm text-zinc-400 mt-2">
                            {isBreak ? 'Pause' : 'Concentration'}
                        </span>
                    </div>
                </div>

                {/* Controls */}
                <div className="flex gap-3">
                    {!isRunning ? (
                        <button onClick={startTimer} className="btn-primary px-8 py-3 text-base">
                            ▶ Démarrer
                        </button>
                    ) : (
                        <button onClick={pauseTimer} className="btn-primary px-8 py-3 text-base bg-gradient-to-r from-amber-500 to-orange-500">
                            ⏸ Pause
                        </button>
                    )}
                    <button onClick={resetTimer} className="btn-ghost px-6 py-3">
                        ↺ Reset
                    </button>
                    {'Notification' in window && Notification.permission !== 'granted' && (
                        <button onClick={() => Notification.requestPermission()} className="btn-ghost px-6 py-3">
                            🔔 Activer notif
                        </button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4">
                <div className="glass-card p-5 text-center">
                    <p className="text-3xl font-bold text-brand-400">{stats.todaySessions}</p>
                    <p className="text-xs text-zinc-400 mt-1">Sessions aujourd'hui</p>
                </div>
                <div className="glass-card p-5 text-center">
                    <p className="text-3xl font-bold text-cyan-400">{stats.totalSessions}</p>
                    <p className="text-xs text-zinc-400 mt-1">Total sessions</p>
                </div>
                <div className="glass-card p-5 text-center">
                    <p className="text-3xl font-bold text-emerald-400">{stats.totalMinutes}</p>
                    <p className="text-xs text-zinc-400 mt-1">Minutes totales</p>
                </div>
            </div>

            {/* History */}
            <div className="glass-card p-5">
                <h3 className="text-sm font-semibold text-zinc-300 mb-3">Historique récent</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                    {sessions.length === 0 ? (
                        <p className="text-zinc-500 text-sm text-center py-4">Aucune session encore</p>
                    ) : (
                        sessions.slice(0, 10).map((s) => (
                            <div key={s.id} className="flex items-center gap-3 text-sm py-1.5">
                                <span>{s.type === 'work' ? '🍅' : '☕'}</span>
                                <span className="text-zinc-300">{Math.round(s.duration / 60)} min</span>
                                <span className={`badge ${s.completed ? 'badge-done' : 'badge-todo'}`}>
                                    {s.completed ? 'Terminé' : 'Annulé'}
                                </span>
                                <span className="text-zinc-500 ml-auto text-xs">
                                    {new Date(s.startedAt).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                                </span>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="glass-card p-5">
                <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-zinc-300">Productivité</h3>
                    <select value={range} onChange={(e) => setRange(e.target.value)} className="input-field w-auto py-1.5 text-xs">
                        <option value="day">Jour</option>
                        <option value="week">Semaine</option>
                    </select>
                </div>
                <div className="flex items-end gap-2 h-40">
                    {productivity.map((p) => {
                        const max = Math.max(...productivity.map((x) => x.minutes), 1);
                        const h = Math.max(8, Math.round((p.minutes / max) * 100));
                        return (
                            <div key={p.date} className="flex-1 flex flex-col items-center gap-2">
                                <div className="w-full bg-brand-500/30 rounded-t" style={{ height: `${h}%` }} />
                                <span className="text-[10px] text-zinc-500">{new Date(p.date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
