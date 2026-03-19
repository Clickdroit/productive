import { useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { format, subDays, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from '../lib/api';

const MOODS = [
    { emoji: '😊', label: 'Bien' },
    { emoji: '😐', label: 'Neutre' },
    { emoji: '😔', label: 'Pas top' },
    { emoji: '🔥', label: 'Productif' },
    { emoji: '😴', label: 'Fatigué' },
    { emoji: '🎉', label: 'Excellent' },
];

export default function JournalWidget() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [entry, setEntry] = useState(null);
    const [content, setContent] = useState('');
    const [mood, setMood] = useState(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [editing, setEditing] = useState(false);
    const [entries, setEntries] = useState([]);
    const [search, setSearch] = useState('');
    const [template, setTemplate] = useState('');
    const [moodStats, setMoodStats] = useState({});

    useEffect(() => { fetchEntry(); fetchRecentEntries(); fetchMoodStats(); }, [currentDate]);

    const fetchEntry = async () => {
        setLoading(true);
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const res = await api.get(`/journal/date/${dateStr}`);
            setEntry(res.data);
            setContent(res.data.content || '');
            setMood(res.data.mood || null);
            setEditing(res.data.isNew === true);
        } catch (err) { console.error(err); }
        finally { setLoading(false); }
    };

    const fetchRecentEntries = async () => {
        try {
            const params = {};
            if (search.trim()) params.search = search.trim();
            const res = await api.get('/journal', { params });
            setEntries(res.data);
        } catch (err) { console.error(err); }
    };

    const fetchMoodStats = async () => {
        try {
            const res = await api.get('/journal/stats/mood');
            setMoodStats(res.data);
        } catch (err) { console.error(err); }
    };

    const saveEntry = async () => {
        setSaving(true);
        try {
            const dateStr = format(currentDate, 'yyyy-MM-dd');
            const res = await api.post('/journal', { date: dateStr, content, mood });
            setEntry(res.data);
            setEditing(false);
            fetchRecentEntries();
            fetchMoodStats();
        } catch (err) { console.error(err); }
        finally { setSaving(false); }
    };

    const goToDate = (date) => {
        setCurrentDate(date);
    };

    const isToday = format(currentDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

    const applyTemplate = (kind) => {
        const contentByTemplate = {
            matin: '## Matin\n- Priorité 1:\n- Priorité 2:\n- Intention du jour:\n',
            soir: '## Soir\n- Ce qui a bien marché:\n- Ce que je peux améliorer:\n- Gratitude:\n',
        };
        const next = contentByTemplate[kind] || '';
        setTemplate(kind);
        setContent((prev) => (prev ? `${prev}\n\n${next}` : next));
        setEditing(true);
    };

    const exportAllEntries = () => {
        const body = entries
            .slice()
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .map((e) => `# ${format(new Date(e.date), 'yyyy-MM-dd')} ${e.mood || ''}\n\n${e.content || ''}\n`)
            .join('\n---\n');
        const blob = new Blob([body], { type: 'text/markdown;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'journal-export.md';
        a.click();
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex gap-4 h-[calc(100vh-140px)]">
            {/* Left: Recent entries */}
            <div className="w-64 flex-shrink-0 glass-card p-3 flex flex-col">
                <h3 className="text-sm font-semibold text-zinc-300 px-2 mb-3">Entrées récentes</h3>
                <input
                    className="input-field text-sm py-2 mb-3"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="🔎 Rechercher..."
                />
                <div className="flex-1 overflow-y-auto space-y-1">
                    {entries.map((e) => (
                        <button
                            key={e.id}
                            onClick={() => goToDate(new Date(e.date))}
                            className={`w-full text-left p-3 rounded-xl transition-all duration-200 ${format(new Date(e.date), 'yyyy-MM-dd') === format(currentDate, 'yyyy-MM-dd')
                                    ? 'bg-brand-600/20 border border-brand-500/30'
                                    : 'hover:bg-white/5 border border-transparent'
                                }`}
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-sm">{e.mood || '📓'}</span>
                                <span className="text-sm font-medium text-white">
                                    {format(new Date(e.date), 'dd MMM', { locale: fr })}
                                </span>
                            </div>
                            <p className="text-xs text-zinc-500 mt-1 truncate">
                                {e.content ? e.content.substring(0, 50) : 'Entrée vide'}
                            </p>
                        </button>
                    ))}
                    {entries.length === 0 && (
                        <div className="text-center text-zinc-500 text-sm py-8">
                            Aucune entrée encore
                        </div>
                    )}
                </div>
            </div>

            {/* Right: Current entry */}
            <div className="flex-1 glass-card p-6 flex flex-col">
                {/* Date nav */}
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => goToDate(subDays(currentDate, 1))} className="btn-ghost">←</button>
                    <div className="text-center">
                        <h3 className="text-lg font-semibold text-white capitalize">
                            {format(currentDate, 'EEEE dd MMMM yyyy', { locale: fr })}
                        </h3>
                        {isToday && (
                            <span className="text-xs text-brand-400">Aujourd'hui</span>
                        )}
                    </div>
                    <button onClick={() => goToDate(addDays(currentDate, 1))} className="btn-ghost">→</button>
                </div>
                <div className="flex items-center gap-2 mb-4">
                    <button onClick={() => applyTemplate('matin')} className={`btn-ghost text-sm ${template === 'matin' ? 'text-white' : ''}`}>Template matin</button>
                    <button onClick={() => applyTemplate('soir')} className={`btn-ghost text-sm ${template === 'soir' ? 'text-white' : ''}`}>Template soir</button>
                    <button onClick={exportAllEntries} className="btn-ghost text-sm ml-auto">⬇️ Export journal</button>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                ) : (
                    <>
                        {/* Mood selector */}
                        <div className="flex items-center gap-3 mb-4">
                            <span className="text-sm text-zinc-400">Humeur :</span>
                            <div className="flex gap-1">
                                {MOODS.map((m) => (
                                    <button
                                        key={m.emoji}
                                        onClick={() => setMood(m.emoji)}
                                        className={`w-10 h-10 rounded-xl text-xl flex items-center justify-center transition-all duration-200 ${mood === m.emoji
                                                ? 'bg-brand-600/30 border border-brand-500/30 scale-110'
                                                : 'bg-white/5 hover:bg-white/10'
                                            }`}
                                        title={m.label}
                                    >
                                        {m.emoji}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Editor / Preview */}
                        <div className="flex-1 overflow-y-auto">
                            {editing ? (
                                <textarea
                                    value={content}
                                    onChange={(e) => setContent(e.target.value)}
                                    className="w-full h-full input-field resize-none font-mono text-sm"
                                    placeholder="Comment s'est passée ta journée ? Écris en markdown..."
                                    autoFocus
                                />
                            ) : (
                                <div className="prose prose-invert prose-sm max-w-none">
                                    <ReactMarkdown>
                                        {content || "*Rien d'écrit pour ce jour — clique sur Éditer pour commencer*"}
                                    </ReactMarkdown>
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3 mt-4 pt-4 border-t border-white/10">
                            {editing ? (
                                <>
                                    <button onClick={saveEntry} disabled={saving} className="btn-primary">
                                        {saving ? 'Sauvegarde...' : '💾 Sauvegarder'}
                                    </button>
                                    <button
                                        onClick={() => { setEditing(false); setContent(entry?.content || ''); setMood(entry?.mood || null); }}
                                        className="btn-ghost"
                                    >
                                        Annuler
                                    </button>
                                </>
                            ) : (
                                <button onClick={() => setEditing(true)} className="btn-ghost">
                                    ✏️ Éditer
                                </button>
                            )}
                            {!isToday && (
                                <button onClick={() => goToDate(new Date())} className="btn-ghost ml-auto">
                                    Aujourd'hui →
                                </button>
                            )}
                        </div>
                        <div className="mt-4 grid grid-cols-3 gap-2">
                            {Object.entries(moodStats).map(([m, c]) => (
                                <div key={m} className="glass-card p-2 text-center">
                                    <p className="text-lg">{m === 'none' ? '📓' : m}</p>
                                    <p className="text-xs text-zinc-400">{c}</p>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
