import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../lib/api';

const PRIORITY_MAP = { LOW: 'badge-low', MEDIUM: 'badge-medium', HIGH: 'badge-high' };
const STATUS_MAP = { TODO: 'badge-todo', IN_PROGRESS: 'badge-in-progress', DONE: 'badge-done' };
const STATUS_LABELS = { TODO: 'À faire', IN_PROGRESS: 'En cours', DONE: 'Terminé' };
const PRIORITY_LABELS = { LOW: 'Basse', MEDIUM: 'Moyenne', HIGH: 'Haute' };

export default function TodoWidget() {
    const queryClient = useQueryClient();

    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [dueDate, setDueDate] = useState('');
    const [tags, setTags] = useState('');
    const [subtask, setSubtask] = useState('');
    const [checklist, setChecklist] = useState([]);
    const [priority, setPriority] = useState('MEDIUM');
    const [filter, setFilter] = useState('ALL');
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'kanban'
    const [draggedId, setDraggedId] = useState(null);

    const { data: todos = [], isLoading } = useQuery({
        queryKey: ['todos'],
        queryFn: async () => {
            const res = await api.get('/todos');
            return res.data;
        }
    });

    const addTodoMutation = useMutation({
        mutationFn: async (newTodo) => {
            const res = await api.post('/todos', newTodo);
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries(['todos'])
    });

    const updateTodoMutation = useMutation({
        mutationFn: async ({ id, patch }) => {
            const res = await api.put(`/todos/${id}`, patch);
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries(['todos'])
    });

    const deleteTodoMutation = useMutation({
        mutationFn: async (id) => await api.delete(`/todos/${id}`),
        onSuccess: () => queryClient.invalidateQueries(['todos'])
    });

    const reorderTodosMutation = useMutation({
        mutationFn: async (ids) => {
            const res = await api.post('/todos/reorder', { ids });
            return res.data;
        },
        onSuccess: () => queryClient.invalidateQueries(['todos'])
    });

    const addTodo = (e) => {
        e.preventDefault();
        if (!title.trim()) return;
        addTodoMutation.mutate({
            title: title.trim(),
            description: description.trim() || null,
            dueDate: dueDate || null,
            tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            checklist: checklist.filter((c) => c.text.trim()),
            priority,
        }, {
            onSuccess: () => {
                setTitle('');
                setDescription('');
                setDueDate('');
                setTags('');
                setChecklist([]);
                setSubtask('');
            }
        });
    };

    const updateStatus = (id, status) => updateTodoMutation.mutate({ id, patch: { status } });
    const deleteTodo = (id) => deleteTodoMutation.mutate(id);

    const addSubtask = () => {
        if (!subtask.trim()) return;
        setChecklist((prev) => [...prev, { text: subtask.trim(), done: false }]);
        setSubtask('');
    };

    const toggleChecklistItem = (todo, idx) => {
        const items = Array.isArray(todo.checklist) ? todo.checklist : [];
        const next = items.map((item, i) => (i === idx ? { ...item, done: !item.done } : item));
        updateTodoMutation.mutate({ id: todo.id, patch: { checklist: next } });
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
        
        queryClient.setQueryData(['todos'], current);
        reorderTodosMutation.mutate(current.map(t => t.id));
    };

    const onDropColumn = (status) => {
        if (!draggedId) return;
        const todo = todos.find(t => t.id === draggedId);
        if (todo && todo.status !== status) {
            updateStatus(todo.id, status);
        }
        setDraggedId(null);
    };

    const filtered = filter === 'ALL' ? todos : todos.filter((t) => t.status === filter);

    const counts = {
        ALL: todos.length,
        TODO: todos.filter((t) => t.status === 'TODO').length,
        IN_PROGRESS: todos.filter((t) => t.status === 'IN_PROGRESS').length,
        DONE: todos.filter((t) => t.status === 'DONE').length,
    };

    if (isLoading) {
        return (
            <div className="glass-card p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    const renderTodoCard = (todo) => (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            key={todo.id}
            className="glass-card-hover p-4 flex flex-col gap-3 group bg-white/5"
            draggable
            onDragStart={() => setDraggedId(todo.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => { e.stopPropagation(); onDropTodo(todo.id); }}
        >
            <div className="flex items-center gap-4">
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
                    {todo.status === 'IN_PROGRESS' && <div className="w-2 h-2 bg-blue-400 rounded-full" />}
                </button>

                <span className={`flex-1 text-sm transition-colors ${todo.status === 'DONE' ? 'line-through text-zinc-500' : 'text-white'}`}>
                    {todo.title}
                </span>

                <span className={PRIORITY_MAP[todo.priority]}>{PRIORITY_LABELS[todo.priority]}</span>
                {viewMode === 'list' && <span className={STATUS_MAP[todo.status]}>{STATUS_LABELS[todo.status]}</span>}

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
                            <span className={`w-4 h-4 rounded border transition-colors ${item.done ? 'bg-emerald-500 border-emerald-500' : 'border-zinc-500'}`} />
                            <span className={`transition-all ${item.done ? 'line-through text-zinc-500' : ''}`}>{item.text}</span>
                        </button>
                    ))}
                </div>
            )}
        </motion.div>
    );

    return (
        <div className="space-y-4">
            <form onSubmit={addTodo} className="glass-card p-4 flex gap-3 items-end">
                <div className="flex-1 space-y-2">
                    <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="input-field"
                        placeholder="Nouvelle tâche..."
                        disabled={addTodoMutation.isPending}
                    />
                    <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        className="input-field resize-none text-sm min-h-20"
                        placeholder="Description (markdown)"
                        disabled={addTodoMutation.isPending}
                    />
                    <div className="flex gap-2">
                        <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => setDueDate(e.target.value)}
                            className="input-field text-sm"
                            disabled={addTodoMutation.isPending}
                        />
                        <input
                            type="text"
                            value={tags}
                            onChange={(e) => setTags(e.target.value)}
                            className="input-field text-sm"
                            placeholder="tags (virgules)"
                            disabled={addTodoMutation.isPending}
                        />
                    </div>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={subtask}
                            onChange={(e) => setSubtask(e.target.value)}
                            className="input-field text-sm"
                            placeholder="Sous-tâche"
                            disabled={addTodoMutation.isPending}
                        />
                        <button type="button" onClick={addSubtask} className="btn-ghost whitespace-nowrap" disabled={addTodoMutation.isPending}>+ Sous-tâche</button>
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
                    disabled={addTodoMutation.isPending}
                >
                    <option value="LOW">🟢 Basse</option>
                    <option value="MEDIUM">🟡 Moyenne</option>
                    <option value="HIGH">🔴 Haute</option>
                </select>
                <button type="submit" className="btn-primary whitespace-nowrap" disabled={addTodoMutation.isPending}>
                    {addTodoMutation.isPending ? 'Ajout...' : '+ Ajouter'}
                </button>
            </form>

            <div className="flex justify-between items-center bg-white/5 p-2 rounded-xl">
                <div className="flex gap-2 flex-wrap">
                    {['ALL', 'TODO', 'IN_PROGRESS', 'DONE'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setFilter(s)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${filter === s
                                    ? 'bg-brand-600/30 text-white border border-brand-500/30'
                                    : 'text-zinc-400 hover:text-white bg-transparent border border-transparent'
                                }`}
                        >
                            {s === 'ALL' ? 'Tout' : STATUS_LABELS[s]} ({counts[s]})
                        </button>
                    ))}
                </div>
                <div className="flex bg-black/40 rounded-lg p-1 border border-white/5">
                    <button 
                        onClick={() => setViewMode('list')} 
                        className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'list' ? 'bg-white/20 text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                        📝 Liste
                    </button>
                    <button 
                        onClick={() => setViewMode('kanban')} 
                        className={`px-3 py-1 text-sm rounded-md transition-all ${viewMode === 'kanban' ? 'bg-brand-500 text-white' : 'text-zinc-500 hover:text-white'}`}
                    >
                        📋 Kanban
                    </button>
                </div>
            </div>

            {viewMode === 'list' ? (
                <div className="space-y-2">
                    {filtered.length === 0 ? (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-8 text-center text-zinc-500">
                            {filter === 'ALL' ? 'Aucune tâche. Ajoute ta première !' : 'Aucune tâche dans cette catégorie.'}
                        </motion.div>
                    ) : (
                        <AnimatePresence mode="popLayout">
                            {filtered.map(renderTodoCard)}
                        </AnimatePresence>
                    )}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-full min-h-[500px]">
                    {['TODO', 'IN_PROGRESS', 'DONE'].map((status) => (
                        <div 
                            key={status} 
                            className="bg-black/20 rounded-xl p-4 border border-white/5 flex flex-col gap-3"
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={() => onDropColumn(status)}
                        >
                            <h3 className="font-semibold text-white/80 flex items-center justify-between">
                                {STATUS_LABELS[status]}
                                <span className="bg-white/10 text-xs px-2 py-1 rounded-full">{counts[status]}</span>
                            </h3>
                            <div className="flex flex-col gap-2 flex-1 relative min-h-[100px]">
                                <AnimatePresence mode="popLayout">
                                    {todos.filter(t => t.status === status && (filter === 'ALL' || filter === status)).map(renderTodoCard)}
                                </AnimatePresence>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
