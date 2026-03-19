import { useEffect, useState } from 'react';
import api from '../lib/api';

export default function HomeWidget({ goToWidget }) {
    const [summary, setSummary] = useState({
        todayTodos: 0,
        overdueTodos: 0,
        habitsToDo: 0,
        todayPomodoro: 0,
    });

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const [todosRes, habitsRes, pomodoroRes] = await Promise.all([
                    api.get('/todos'),
                    api.get('/habits'),
                    api.get('/pomodoro/stats'),
                ]);
                const now = new Date();
                now.setHours(0, 0, 0, 0);
                const todos = todosRes.data || [];
                const todayTodos = todos.filter((t) => t.status !== 'DONE' && (!t.dueDate || new Date(t.dueDate) >= now)).length;
                const overdueTodos = todos.filter((t) => t.status !== 'DONE' && t.dueDate && new Date(t.dueDate) < now).length;
                const habits = habitsRes.data || [];
                const todayKey = now.toISOString().slice(0, 10);
                const habitsToDo = habits.filter((h) => !h.completions?.some((c) => new Date(c.date).toISOString().slice(0, 10) === todayKey)).length;
                setSummary({
                    todayTodos,
                    overdueTodos,
                    habitsToDo,
                    todayPomodoro: pomodoroRes.data?.todaySessions || 0,
                });
            } catch (err) {
                console.error(err);
            }
        };
        fetchSummary();
    }, []);

    return (
        <div className="space-y-5">
            <div className="glass-card p-5">
                <h3 className="text-lg font-semibold text-white mb-1">Résumé du jour</h3>
                <p className="text-sm text-zinc-400">Tes priorités en un coup d'œil</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                <button className="glass-card-hover p-5 text-left" onClick={() => goToWidget('todos')}>
                    <p className="text-zinc-400 text-xs">Tâches du jour</p>
                    <p className="text-3xl font-bold text-white mt-1">{summary.todayTodos}</p>
                </button>
                <button className="glass-card-hover p-5 text-left" onClick={() => goToWidget('todos')}>
                    <p className="text-zinc-400 text-xs">En retard</p>
                    <p className="text-3xl font-bold text-red-300 mt-1">{summary.overdueTodos}</p>
                </button>
                <button className="glass-card-hover p-5 text-left" onClick={() => goToWidget('habits')}>
                    <p className="text-zinc-400 text-xs">Habitudes à faire</p>
                    <p className="text-3xl font-bold text-emerald-300 mt-1">{summary.habitsToDo}</p>
                </button>
                <button className="glass-card-hover p-5 text-left" onClick={() => goToWidget('pomodoro')}>
                    <p className="text-zinc-400 text-xs">Pomodoro aujourd'hui</p>
                    <p className="text-3xl font-bold text-brand-300 mt-1">{summary.todayPomodoro}</p>
                </button>
            </div>
        </div>
    );
}
