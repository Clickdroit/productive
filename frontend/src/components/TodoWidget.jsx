import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import api from '../lib/api';

const PRIORITY_MAP = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
const STATUS_MAP = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in-progress', DONE: 'badge-done' };
const STATUS_LABELS = { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminé' };
const PRIORITY_LABELS = { LOW: 'Basse', MEDIUM: 'Moyenne', HIGH: 'Haute' };

export default function TodoWidget() {
    const [todos, setTodos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [tags, setTags] = useState('');
    const [subtask, setSubtask] = useState('');
    const [checklist, setChecklist] = useState([]);
    const [priority, setPriority] = useState('MEDIUM');
    const [filter, setFilter] = useState('ALL');
    const [draggedId, setDraggedId] = useState(null);

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
            const res = await api.post('/todos', {
                title: title.trim(),
                description: description.trim() || null,
                dueDate: dueDate || null,
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
                checklist: checklist.filter((c) => c.text.trim()),
                priority,
            });
            setTodos([res.data, ...todos]);
            setTitle('');
            setDescription('');
            setDueDate('');
            setTags('');
            setChecklist([]);
            setSubtask('');
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

    const updateTodo = async (id, patch) => {
        try {
            const res = await api.put(`/todos/${id}`, patch);
            setTodos((prev) => prev.map((t) => (t.id === id ? res.data : t)));
        } catch (err) { console.error(err); }
    };

    const addSubtask = () => {
        if (!subtask.trim()) return;
        setChecklist((prev) => [...prev, { text: subtask.trim(), done: false }]);
        setSubtask('');
    };

    const toggleChecklistItem = (todo, idx) => {
        const items = Array.isArray(todo.checklist) ? todo.checklist : [];
        const next = items.map((item, i) => (i === idx ? { ...item, done: !item.done } : item));
        updateTodo(todo.id, { checklist: next });
    };

    const reorderTodos = async (nextTodos) => {
        const ids = nextTodos.map((t) => t.id);
        setTodos(nextTodos);
        try {
            const res = await api.post('/todos/reorder', { ids });
            setTodos(res.data);
        } catch (err) {
            console.error(err);
            fetchTodos();
        }
    };

    const onDropTodo = (targetId) => {
        if (!draggedId || draggedId === targetId) return;
        const current = [...todos];
        const from = current.findIndex((t) => t.id === draggedId);
        const to = current.findIndex((t) => t.id === targetId);
        if (from < 0 || to < 0) return;
        const [moved] = current.splice(from, 1);
        current.splice(to, 0, moved);
        setDraggedId(null);
        reorderTodos(current);
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
                <div className="flex-1 space-y-2">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-field"
                        placeholder="Nouvelle tâche..."
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-field resize-none text-sm min-h-20"
                        placeholder="Description (markdown)"
                    />
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="input-field text-sm"
                        />
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="input-field text-sm"
                            placeholder="tags (virgules)"
                        />
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={subtask}
                            onChange={(e) => setSubtask(e.target.value)}
                            className="input-field text-sm"
                            placeholder="Sous-tâche"
                        />
                        <button type="button" onClick={addSubtask} className="btn-ghost whitespace-nowrap">+ Sous-tâche</button>
                    </div>
                    {checklist.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {checklist.map((item, idx) => (
                                <span key={`${item.text}-${idx}`} className="badge badge-in-progress">{item.text}</span>
                            ))}
                        </div>
                    )}
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
                        <div
                            key={todo.id}
                            className="glass-card-hover p-4 flex flex-col gap-3 group animate-slide-up"
                            draggable
                            onDragStart={() => setDraggedId(todo.id)}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => onDropTodo(todo.id)}
                        >
                            <div className="flex items-center gap-4">
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
                            {todo.description && (
                                <div className="prose prose-invert prose-sm max-w-none ml-10">
                                    <ReactMarkdown>{todo.description}</ReactMarkdown>
                                </div>
                            )}
                            <div className="ml-10 flex flex-wrap gap-2 items-center">
                                {Array.isArray(todo.tags) && todo.tags.map((tag) => (
                                    <span key={`${todo.id}-${tag}`} className="badge bg-cyan-500/20 text-cyan-300">#{tag}</span>
                                ))}
                                {todo.dueDate && (() => {
                                    const due = new Date(todo.dueDate);
                                    const isLate = todo.status !== 'DONE' && due < new Date();
                                    return (
                                        <span className={`badge ${isLate ? 'bg-red-500/20 text-red-300' : 'bg-zinc-500/20 text-zinc-300'}`}>
                                            {isLate ? '⚠ En retard' : '📅'} {due.toLocaleDateString('fr-FR')}
                                        </span>
                                    );
                                })()}
                            </div>
                            {Array.isArray(todo.checklist) && todo.checklist.length > 0 && (
                                <div className="ml-10 space-y-1">
                                    {todo.checklist.map((item, idx) => (
                                        <button
                                            type="button"
                                            key={`${todo.id}-check-${idx}`}
                                            className="flex items-center gap-2 text-sm text-zinc-300 hover:text-white"
                                            onClick={() => toggleChecklistItem(todo, idx)}
                                        >
                                            <span className={`w-4 h-4 rounded border ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-500'}`} />
                                            <span className={item.done ? 'line-through text-zinc-500' : ''}>{item.text}</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
