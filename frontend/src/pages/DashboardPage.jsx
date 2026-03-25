import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TodoWidget from '../components/TodoWidget';
import NotesWidget from '../components/NotesWidget';
import PomodoroWidget from '../components/PomodoroWidget';
import HabitWidget from '../components/HabitWidget';
import JournalWidget from '../components/JournalWidget';
import HomeWidget from '../components/HomeWidget';
import QuickCaptureModal from '../components/QuickCaptureModal';

const WIDGETS = [
    { id: 'home', label: 'Accueil', icon: '🏠', component: HomeWidget },
    { id: 'todos', label: 'Tâches', icon: '✅', component: TodoWidget },
    { id: 'notes', label: 'Notes', icon: '📝', component: NotesWidget },
    { id: 'pomodoro', label: 'Pomodoro', icon: '🍅', component: PomodoroWidget },
    { id: 'habits', label: 'Habitudes', icon: '📅', component: HabitWidget },
    { id: 'journal', label: 'Journal', icon: '📓', component: JournalWidget },
];

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [activeWidget, setActiveWidget] = useState('home');
    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [focusMode, setFocusMode] = useState(false);
    const [quickCaptureOpen, setQuickCaptureOpen] = useState(false);
    const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'violet');

    const ActiveComponent = WIDGETS.find((w) => w.id === activeWidget)?.component || HomeWidget;

    const THEME_CLASS = {
        violet: 'theme-violet',
        emerald: 'theme-emerald',
        amber: 'theme-amber',
    }[theme] || 'theme-violet';

    const setThemeAndSave = (nextTheme) => {
        setTheme(nextTheme);
        localStorage.setItem('theme', nextTheme);
    };

    const requestNotifications = async () => {
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission !== 'granted') {
            try { await Notification.requestPermission(); } catch (err) { console.error(err); }
        }
    };

    const goToWidget = (id) => setActiveWidget(id);

    const toggleFocusMode = () => {
        setFocusMode((prev) => {
            const next = !prev;
            if (next) setActiveWidget('pomodoro');
            return next;
        });
    };

    useEffect(() => {
        const onKeyDown = (e) => {
            if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
                e.preventDefault();
                setQuickCaptureOpen(true);
                return;
            }

            if (e.target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return;
            const keyNum = Number(e.key);
            if (Number.isInteger(keyNum) && keyNum >= 1 && keyNum <= WIDGETS.length) {
                const idx = keyNum - 1;
                if (WIDGETS[idx]) setActiveWidget(WIDGETS[idx].id);
            }
            if (e.key.toLowerCase() === 'f') {
                e.preventDefault();
                toggleFocusMode();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, []);

    return (
        <div className={`min-h-screen bg-zinc-950 flex ${THEME_CLASS}`}>
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
            </div>

            {/* Sidebar */}
            {!focusMode && (
                <Sidebar
                    user={user}
                    logout={logout}
                    widgets={WIDGETS}
                    activeWidget={activeWidget}
                    setActiveWidget={setActiveWidget}
                    isOpen={sidebarOpen}
                    toggle={() => setSidebarOpen(!sidebarOpen)}
                />
            )}

            {/* Main content */}
            <main className={`flex-1 transition-all duration-300 ${focusMode ? 'ml-0' : (sidebarOpen ? 'ml-64' : 'ml-16')}`}>
                {/* Top bar */}
                <header className="sticky top-0 z-10 glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {!focusMode && (
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="btn-ghost text-xl"
                            >
                                ☰
                            </button>
                        )}
                        <h2 className="text-xl font-semibold text-white">
                            {WIDGETS.find((w) => w.id === activeWidget)?.icon}{' '}
                            {WIDGETS.find((w) => w.id === activeWidget)?.label}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <select className="input-field w-auto py-1.5 text-xs" value={theme} onChange={(e) => setThemeAndSave(e.target.value)}>
                            <option value="violet">Violet</option>
                            <option value="emerald">Émeraude</option>
                            <option value="amber">Ambre</option>
                        </select>
                        <button onClick={toggleFocusMode} className="btn-ghost text-xs">
                            {focusMode ? 'Quitter focus' : 'Mode focus'}
                        </button>
                        <button onClick={requestNotifications} className="btn-ghost text-xs">
                            Notifications
                        </button>
                        <span className="text-sm text-zinc-400">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </header>

                {/* Widget area */}
                <div className="p-6 relative z-0">
                    <div className="animate-fade-in" key={activeWidget}>
                        <ActiveComponent goToWidget={goToWidget} />
                    </div>
                </div>
            </main>

            <QuickCaptureModal 
                isOpen={quickCaptureOpen} 
                onClose={() => setQuickCaptureOpen(false)} 
            />
        </div>
    );
}
