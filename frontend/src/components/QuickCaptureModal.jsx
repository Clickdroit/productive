import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export default function QuickCaptureModal({ isOpen, onClose }) {
    const [text, setText] = useState('');
    const [type, setType] = useState('todo'); // 'todo' | 'note'
    const inputRef = useRef(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 50);
        } else {
            setText('');
            setType('todo');
        }
    }, [isOpen]);

    const addTodoMutation = useMutation({
        mutationFn: async (title) => await api.post('/todos', { title, priority: 'MEDIUM', status: 'TODO' }),
        onSuccess: () => {
            queryClient.invalidateQueries(['todos']);
            onClose();
        }
    });

    const addNoteMutation = useMutation({
        mutationFn: async (content) => await api.post('/notes', { title: 'Note rapide', content }),
        onSuccess: () => {
            queryClient.invalidateQueries(['notes']);
            onClose();
        }
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!text.trim()) return;

        if (type === 'todo') {
            addTodoMutation.mutate(text.trim());
        } else {
            addNoteMutation.mutate(text.trim());
        }
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') onClose();
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="glass-card relative z-10 w-full max-w-2xl overflow-hidden shadow-2xl shadow-brand-500/10 border-brand-500/30"
                    >
                        <form onSubmit={handleSubmit} className="p-4 flex flex-col gap-3">
                            <div className="flex gap-2 mb-2">
                                <button
                                    type="button"
                                    onClick={() => setType('todo')}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${type === 'todo' ? 'bg-brand-500 text-white' : 'hover:bg-white/10 text-zinc-400'}`}
                                >
                                    ✅ Tâche
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setType('note')}
                                    className={`px-3 py-1.5 rounded-lg text-sm transition-all ${type === 'note' ? 'bg-cyan-500 text-white' : 'hover:bg-white/10 text-zinc-400'}`}
                                >
                                    📝 Note
                                </button>
                            </div>

                            <textarea
                                ref={inputRef}
                                value={text}
                                onChange={(e) => setText(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={type === 'todo' ? "Nouvelle tâche... (Appuyez sur Entrée)" : "Idée brillante... (Appuyez sur Entrée)"}
                                className="w-full bg-transparent text-white text-lg placeholder:text-zinc-600 outline-none resize-none overflow-hidden h-24"
                                disabled={addTodoMutation.isPending || addNoteMutation.isPending}
                            />

                            <div className="flex justify-between items-center mt-2 pt-3 border-t border-white/10">
                                <span className="text-xs text-zinc-500">
                                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 mx-1">Esc</kbd> annuler
                                    <kbd className="px-1.5 py-0.5 rounded bg-white/10 ml-3 mx-1">Entrée</kbd> sauvegarder
                                </span>
                                <button 
                                    type="submit" 
                                    className="btn-primary py-1.5 px-4 text-sm"
                                    disabled={!text.trim() || addTodoMutation.isPending || addNoteMutation.isPending}
                                >
                                    {(addTodoMutation.isPending || addNoteMutation.isPending) ? 'Sauvegarde...' : 'Sauvegarder'}
                                </button>
                            </div>
                        </form>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
}
