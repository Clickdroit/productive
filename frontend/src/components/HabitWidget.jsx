import { useState, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths, getDay, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../lib/api';

const COLORS = ['#8b5cf6', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#3b82f6'];

export default function HabitWidget() {
    const [habits, setHabits] = useState([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [newHabit, setNewHabit] = useState('');
    const [newColor, setNewColor] = useState(COLORS[0]);
    const [weeklyGoal, setWeeklyGoal] = useState(5);
    const [stats, setStats] = useState({ completionRate30: 0, completionRate90: 0, habits: [] });

    useEffect(() => { fetchHabits(); fetchStats(); }, []);

    const fetchHabits = async () => {
        try {
            const res = await api.get('/habits');
            setHabits(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchStats = async () => {
        try {
            const res = await api.get('/habits/stats/summary');
            setStats(res.data);
        } catch (err) { console.error(err); }
    };

    const addHabit = async (e) => {
        e.preventDefault();
        if (!newHabit.trim()) return;
        try {
            const res = await api.post('/habits', { name: newHabit.trim(), color: newColor, weeklyGoal, reminderEnabled: false });
            setHabits([...habits, res.data]);
            setNewHabit('');
            fetchStats();
        } catch (err) { console.error(err); }
    };

    const toggleDay = async (habitId, date) => {
        try {
            const res = await api.post(`/habits/${habitId}/toggle`, { date: format(date, 'yyyy-MM-dd') });
            // Refresh to get updated completions
            fetchHabits();
            fetchStats();
        } catch (err) { console.error(err); }
    };

    const deleteHabit = async (id) => {
        try {
            await api.delete(`/habits/${id}`);
            setHabits(habits.filter((h) => h.id !== id));
            fetchStats();
        } catch (err) { console.error(err); }
    };

    const updateHabit = async (habit, patch) => {
        try {
            const res = await api.put(`/habits/${habit.id}`, patch);
            setHabits((prev) => prev.map((h) => (h.id === habit.id ? res.data : h)));
            fetchStats();
        } catch (err) { console.error(err); }
    };

    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    const startDayOfWeek = getDay(monthStart);
    const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

    const isCompletedOn = (habit, date) => {
        return habit.completions?.some((c) =>
            isSameDay(new Date(c.date), date)
        );
    };

    if (loading) {
        return (
            <div className="glass-card p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Add habit */}
            <form onSubmit={addHabit} className="glass-card p-4 flex gap-3 items-end">
                <div className="flex-1">
                    <input
                        type="text"
                        value={newHabit}
                        onChange={(e) => setNewHabit(e.target.value)}
                        className="input-field"
                        placeholder="Nouvelle habitude..."
                    />
                </div>
                <div className="flex gap-1">
                    {COLORS.map((c) => (
                        <button
                            key={c}
                            type="button"
                            onClick={() => setNewColor(c)}
                            className={`w-7 h-7 rounded-lg transition-all duration-200 ${newColor === c ? 'ring-2 ring-white ring-offset-2 ring-offset-zinc-900 scale-110' : 'hover:scale-105'}`}
                            style={{ backgroundColor: c }}
                        />
                    ))}
                </div>
                <button type="submit" className="btn-primary whitespace-nowrap">
                    + Ajouter
                </button>
                <input
                    type="number"
                    min="1"
                    max="7"
                    value={weeklyGoal}
                    onChange={(e) => setWeeklyGoal(Math.max(1, Number(e.target.value || 1)))}
                    className="input-field w-28 text-sm"
                    title="Objectif hebdo"
                />
            </form>

            <div className="grid grid-cols-2 gap-4">
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-cyan-300">{stats.completionRate30}%</p>
                    <p className="text-xs text-zinc-400">Taux de complétion 30 jours</p>
                </div>
                <div className="glass-card p-4 text-center">
                    <p className="text-2xl font-bold text-emerald-300">{stats.completionRate90}%</p>
                    <p className="text-xs text-zinc-400">Taux de complétion 90 jours</p>
                </div>
            </div>

            {/* Calendar header */}
            <div className="glass-card p-4">
                <div className="flex items-center justify-between mb-4">
                    <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="btn-ghost">
                        ←
                    </button>
                    <h3 className="text-lg font-semibold text-white capitalize">
                        {format(currentMonth, 'MMMM yyyy', { locale: fr })}
                    </h3>
                    <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="btn-ghost">
                        →
                    </button>
                </div>

                {/* Day headers */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                    {['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((d) => (
                        <div key={d} className="text-center text-xs text-zinc-500 font-medium py-1">{d}</div>
                    ))}
                </div>

                {/* Habit rows */}
                {habits.length === 0 ? (
                    <div className="text-center text-zinc-500 py-8">Ajoute ta première habitude !</div>
                ) : (
                    habits.map((habit) => (
                        <div key={habit.id} className="mb-4">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habit.color }} />
                                    <span className="text-sm font-medium text-white">{habit.name}</span>
                                    <span className="text-xs text-zinc-500">
                                        ({habit.completions?.length || 0} jours)
                                    </span>
                                    {(() => {
                                        const summary = stats.habits?.find((h) => h.id === habit.id);
                                        return summary ? (
                                            <span className="text-xs text-amber-300">🔥 {summary.streak} • {summary.weeklyDone}/{summary.weeklyGoal}</span>
                                        ) : null;
                                    })()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <label className="text-xs text-zinc-400 flex items-center gap-1">
                                        🔔
                                        <input
                                            type="checkbox"
                                            checked={Boolean(habit.reminderEnabled)}
                                            onChange={(e) => updateHabit(habit, { reminderEnabled: e.target.checked })}
                                        />
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="7"
                                        value={habit.weeklyGoal || 5}
                                        onChange={(e) => updateHabit(habit, { weeklyGoal: Math.max(1, Number(e.target.value || 1)) })}
                                        className="input-field w-20 text-xs py-1"
                                        title="Objectif hebdo"
                                    />
                                    <button onClick={() => deleteHabit(habit.id)} className="btn-danger text-xs">
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {/* Padding */}
                                {Array.from({ length: paddingDays }).map((_, i) => (
                                    <div key={`pad-${i}`} />
                                ))}
                                {/* Days */}
                                {days.map((day) => {
                                    const completed = isCompletedOn(habit, day);
                                    return (
                                        <button
                                            key={day.toISOString()}
                                            onClick={() => toggleDay(habit.id, day)}
                                            className={`aspect-square rounded-lg text-xs flex items-center justify-center transition-all duration-200 ${completed
                                                    ? 'text-white font-bold scale-100'
                                                    : isToday(day)
                                                        ? 'bg-white/10 text-white border border-white/20'
                                                        : 'bg-white/[0.03] text-zinc-500 hover:bg-white/10'
                                                }`}
                                            style={completed ? { backgroundColor: habit.color + 'cc' } : undefined}
                                        >
                                            {format(day, 'd')}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
