import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import TodoWidget from '../components/TodoWidget';
import NotesWidget from '../components/NotesWidget';
import PomodoroWidget from '../components/PomodoroWidget';
import HabitWidget from '../components/HabitWidget';
import JournalWidget from '../components/JournalWidget';

const WIDGETS = [
    { id: 'todos', label: 'Tâches', icon: '✅', component: TodoWidget },
    { id: 'notes', label: 'Notes', icon: '📝', component: NotesWidget },
    { id: 'pomodoro', label: 'Pomodoro', icon: '🍅', component: PomodoroWidget },
    { id: 'habits', label: 'Habitudes', icon: '📅', component: HabitWidget },
    { id: 'journal', label: 'Journal', icon: '📓', component: JournalWidget },
];

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [activeWidget, setActiveWidget] = useState('todos');
    const [sidebarOpen, setSidebarOpen] = useState(true);

    const ActiveComponent = WIDGETS.find((w) => w.id === activeWidget)?.component || TodoWidget;

    return (
        <div className="min-h-screen bg-zinc-950 flex">
            {/* Background effects */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-0 left-1/3 w-[600px] h-[600px] bg-brand-600/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/5 rounded-full blur-3xl" />
            </div>

            {/* Sidebar */}
            <Sidebar
                user={user}
                logout={logout}
                widgets={WIDGETS}
                activeWidget={activeWidget}
                setActiveWidget={setActiveWidget}
                isOpen={sidebarOpen}
                toggle={() => setSidebarOpen(!sidebarOpen)}
            />

            {/* Main content */}
            <main className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-16'}`}>
                {/* Top bar */}
                <header className="sticky top-0 z-10 glass-card rounded-none border-x-0 border-t-0 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="btn-ghost text-xl"
                        >
                            ☰
                        </button>
                        <h2 className="text-xl font-semibold text-white">
                            {WIDGETS.find((w) => w.id === activeWidget)?.icon}{' '}
                            {WIDGETS.find((w) => w.id === activeWidget)?.label}
                        </h2>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="text-sm text-zinc-400">
                            {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                        </span>
                    </div>
                </header>

                {/* Widget area */}
                <div className="p-6 relative z-0">
                    <div className="animate-fade-in" key={activeWidget}>
                        <ActiveComponent />
                    </div>
                </div>
            </main>
        </div>
    );
}
