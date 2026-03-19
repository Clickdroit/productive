import { useState, useEffect } from 'react';
import api from '../lib/api';

const PRIORITY_MAP = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
const STATUS_MAP = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in-progress', DONE: 'badge-done' };
const STATUS_LABELS = { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminé' };
const PRIORITY_LABELS = { LOW: 'Basse', MEDIUM: 'Moyenne', HIGH: 'Haute' };

export default function TodoWidget() {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [priority, setPriority] = useState('MEDIUM');
    const [filter, setFilter] = useState('ALL');

    useEffect(() => { fetchTodos(); }, []);

    const fetchTodos = async () => {
        try {
            const res = await api.get('/todos');
            setTodos(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const addTodo = async (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        try {
            const res = await api.post('/todos', { title: title.trim(), priority });
            setTodos([res.data, ...todos]);
            setTitle('');
        } catch (err) { console.error(err); }
    };

    const updateStatus = async (id, status) => {
        try {
            const res = await api.put(`/todos/${id}`, { status });
            setTodos(todos.map((t) => (t.id === id ? res.data : t)));
        } catch (err) { console.error(err); }
    };

    const deleteTodo = async (id) => {
        try {
            await api.delete(`/todos/${id}`);
            setTodos(todos.filter((t) => t.id !== id));
        } catch (err) { console.error(err); }
    };

    const filtered = filter === 'ALL' ? todos : todos.filter((t) => t.status === filter);

    const counts = {
        ALL: todos.length,
        TODO: todos.filter((t) => t.status === 'TODO').length,
        IN_PROGRESS: todos.filter((t) => t.status === 'IN_PROGRESS').length,
        DONE: todos.filter((t) => t.status === 'DONE').length,
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
            {/* Add form */}
            <form onSubmit={addTodo} className="glass-card p-4 flex gap-3 items-end">
                <div className="flex-1">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-field"
                        placeholder="Nouvelle tâche..."
                    />
                </div>
                <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="input-field w-auto"
                >
                    <option value="LOW">🟢 Basse</option>
                    <option value="MEDIUM">🟡 Moyenne</option>
                    <option value="HIGH">🔴 Haute</option>
                </select>
                <button type="submit" className="btn-primary whitespace-nowrap">
                    + Ajouter
                </button>
            </form>

            {/* Filters */}
            <div className="flex gap-2 flex-wrap">
                {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((s) => (
                    <button
                        key={s}
                        onClick={() => setFilter(s)}
                        className={`px-4 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${filter === s
                                ? 'bg-brand-600/30 text-white border border-brand-500/30'
                                : 'text-zinc-400 hover:text-white bg-white/5 border border-white/5 hover:border-white/10'
                            }`}
                    >
                        {s === 'ALL' ? 'Tout' : STATUS_LABELS[s]} ({counts[s]})
                    </button>
                ))}
            </div>

            {/* List */}
            <div className="space-y-2">
                {filtered.length === 0 ? (
                    <div className="glass-card p-8 text-center text-zinc-500">
                        {filter === 'ALL' ? 'Aucune tâche. Ajoute ta première !' : 'Aucune tâche dans cette catégorie.'}
                    </div>
                ) : (
                    filtered.map((todo) => (
                        <div key={todo.id} className="glass-card-hover p-4 flex items-center gap-4 group animate-slide-up">
                            {/* Status cycle button */}
                            <button
                                onClick={() => {
                                    const next = { TODO: 'IN_PROGRESS', IN_PROGRESS: 'DONE', DONE: 'TODO' };
                                    updateStatus(todo.id, next[todo.status]);
                                }}
                                className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-all duration-200 ${todo.status === 'DONE'
                                        ? 'bg-emerald-500 border-emerald-500 text-white'
                                        : todo.status === 'IN_PROGRESS'
                                            ? 'border-blue-400 bg-blue-400/20'
                                            : 'border-zinc-600 hover:border-brand-500'
                                    }`}
                            >
                                {todo.status === 'DONE' && '✓'}
                                {todo.status === 'IN_PROGRESS' && (
                                    <div className="w-2 h-2 bg-blue-400 rounded-full" />
                                )}
                            </button>

                            {/* Title */}
                            <span className={`flex-1 text-sm ${todo.status === 'DONE' ? 'line-through text-zinc-500' : 'text-white'}`}>
                                {todo.title}
                            </span>

                            {/* Badges */}
                            <span className={PRIORITY_MAP[todo.priority]}>{PRIORITY_LABELS[todo.priority]}</span>
                            <span className={STATUS_MAP[todo.status]}>{STATUS_LABELS[todo.status]}</span>

                            {/* Delete */}
                            <button
                                onClick={() => deleteTodo(todo.id)}
                                className="opacity-0 group-hover:opacity-100 btn-danger text-xs transition-opacity duration-200"
                            >
                                ✕
                            </button>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
