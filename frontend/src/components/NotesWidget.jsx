import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkBreaks from 'remark-breaks';
import api from '../lib/api';

export default function NotesWidget() {
    const [notes, setNotes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState(null);
    const [editing, setEditing] = useState(false);
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [search, setSearch] = useState('');
    const [folder, setFolder] = useState('');
    const [tags, setTags] = useState('');
    const [folderFilter, setFolderFilter] = useState('ALL');

    useEffect(() => { fetchNotes(); }, [search, folderFilter]);

    const fetchNotes = async () => {
        try {
            const params = {};
            if (search.trim()) params.search = search.trim();
            if (folderFilter !== 'ALL') params.folder = folderFilter;
            const res = await api.get('/notes', { params });
            setNotes(res.data);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const createNote = async () => {
        try {
            const res = await api.post('/notes', { title: 'Nouvelle note', content: '', tags: [], pinned: false });
            setNotes([res.data, ...notes]);
            selectNote(res.data);
            setEditing(true);
        } catch (err) { console.error(err); }
    };

    const selectNote = (note) => {
        setSelected(note);
        setTitle(note.title);
        setContent(note.content);
        setFolder(note.folder || '');
        setTags((note.tags || []).join(', '));
        setEditing(false);
    };

    const saveNote = async () => {
        if (!selected) return;
        try {
            const res = await api.put(`/notes/${selected.id}`, {
                title,
                content,
                folder: folder || null,
                tags: tags.split(',').map((t) => t.trim()).filter(Boolean),
            });
            setNotes(notes.map((n) => (n.id === selected.id ? res.data : n)));
            setSelected(res.data);
            setEditing(false);
        } catch (err) { console.error(err); }
    };

    const deleteNote = async (id) => {
        try {
            await api.delete(`/notes/${id}`);
            setNotes(notes.filter((n) => n.id !== id));
            if (selected?.id === id) { setSelected(null); setEditing(false); }
        } catch (err) { console.error(err); }
    };

    const filtered = notes.filter((n) =>
        n.title.toLowerCase().includes(search.toLowerCase()) ||
        n.content.toLowerCase().includes(search.toLowerCase())
    );

    const togglePin = async (note) => {
        try {
            const res = await api.put(`/notes/${note.id}`, { pinned: !note.pinned });
            setNotes((prev) => prev.map((n) => (n.id === note.id ? res.data : n)));
            if (selected?.id === note.id) setSelected(res.data);
        } catch (err) { console.error(err); }
    };

    const exportMarkdown = () => {
        if (!selected) return;
        const blob = new Blob([`# ${selected.title}\n\n${selected.content || ''}`], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selected.title || 'note'}.md`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const printNote = () => {
        window.print();
    };

    const folders = ['ALL', ...new Set(notes.map((n) => n.folder).filter(Boolean))];

    if (loading) {
        return (
            <div className="glass-card p-8 flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="flex gap-4 h-[calc(100vh-140px)]">
            {/* Sidebar */}
            <div className="w-72 flex-shrink-0 glass-card p-3 flex flex-col">
                <div className="flex gap-2 mb-3">
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="input-field text-sm py-2"
                        placeholder="🔍 Rechercher..."
                    />
                    <button onClick={createNote} className="btn-primary px-3 py-2 text-sm flex-shrink-0">
                        +
                    </button>
                </div>
                <select value={folderFilter} onChange={(e) => setFolderFilter(e.target.value)} className="input-field text-sm py-2 mb-3">
                    {folders.map((f) => <option key={f} value={f}>{f === 'ALL' ? 'Tous les dossiers' : f}</option>)}
                </select>
                <div className="flex-1 overflow-y-auto space-y-1">
                    {filtered.map((note) => (
                        <div
                            key={note.id}
                            onClick={() => selectNote(note)}
                            role="button"
                            tabIndex={0}
                            onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') selectNote(note); }}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 group cursor-pointer ${selected?.id === note.id
                                    ? 'bg-brand-600/20 border border-brand-500/30'
                                    : 'hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-white truncate">{note.title}</p>
                                <div className="flex items-center gap-2">
                                    <button onClick={(e) => { e.stopPropagation(); togglePin(note); }} className="text-xs text-amber-300">{note.pinned ? '📌' : '📍'}</button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); deleteNote(note.id); }}
                                        className="opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-300 text-xs transition-opacity"
                                    >
                                        ✕
                                    </button>
                                </div>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1 truncate">
                                {note.content ? note.content.substring(0, 60) : 'Note vide...'}
                            </p>
                            <p className="text-xs text-zinc-500 mt-1 truncate">
                                {note.folder ? `📁 ${note.folder}` : 'Sans dossier'} {note.tags?.length ? `• ${note.tags.map((t) => `#${t}`).join(' ')}` : ''}
                            </p>
                            <p className="text-xs text-zinc-600 mt-1">
                                {new Date(note.updatedAt).toLocaleDateString('fr-FR')}
                            </p>
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="text-center text-zinc-500 text-sm py-8">
                            {notes.length === 0 ? 'Crée ta première note !' : 'Aucun résultat'}
                        </div>
                    )}
                </div>
            </div>

            {/* Editor / Preview */}
            <div className="flex-1 glass-card p-6 flex flex-col">
                {selected ? (
                    <>
                        <div className="flex items-center gap-3 mb-4">
                            {editing ? (
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="input-field text-lg font-semibold flex-1"
                                />
                            ) : (
                                <h3 className="text-lg font-semibold text-white flex-1">{selected.title}</h3>
                            )}
                            <div className="flex gap-2">
                                {editing ? (
                                    <>
                                        <button onClick={saveNote} className="btn-primary text-sm">Sauvegarder</button>
                                        <button onClick={() => { setEditing(false); setTitle(selected.title); setContent(selected.content); setFolder(selected.folder || ''); setTags((selected.tags || []).join(', ')); }} className="btn-ghost text-sm">
                                            Annuler
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <button onClick={exportMarkdown} className="btn-ghost text-sm">⬇️ MD</button>
                                        <button onClick={printNote} className="btn-ghost text-sm">🖨️ PDF</button>
                                        <button onClick={() => setEditing(true)} className="btn-ghost text-sm">
                                            ✏️ Éditer
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="flex-1 overflow-y-auto">
                            {editing ? (
                                <div className="h-full space-y-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <input value={folder} onChange={(e) => setFolder(e.target.value)} className="input-field text-sm" placeholder="Dossier / catégorie" />
                                        <input value={tags} onChange={(e) => setTags(e.target.value)} className="input-field text-sm" placeholder="Tags (virgules)" />
                                    </div>
                                    <textarea
                                        value={content}
                                        onChange={(e) => setContent(e.target.value)}
                                        className="w-full h-[calc(100%-44px)] input-field resize-none font-mono text-sm"
                                        placeholder="Écris en markdown..."
                                    />
                                </div>
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown remarkPlugins={[remarkBreaks]}>{selected.content || '*Note vide — clique sur Éditer pour commencer*'}</ReactMarkdown>
                                </div>
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center text-zinc-500">
                        <div className="text-center">
                            <p className="text-4xl mb-3">📝</p>
                            <p>Sélectionne ou crée une note</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
