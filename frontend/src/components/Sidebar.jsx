export default function Sidebar({ user, logout, widgets, activeWidget, setActiveWidget, isOpen, toggle }) {
    return (
        <aside
            className={`fixed top-0 left-0 h-screen glass-card rounded-none border-t-0 border-l-0 border-b-0
        flex flex-col transition-all duration-300 z-20 ${isOpen ? 'w-64' : 'w-16'}`}
        >
            {/* Logo */}
            <div className={`px-4 py-5 flex items-center ${isOpen ? 'gap-3' : 'justify-center'}`}>
                <div className="w-9 h-9 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-xl flex items-center justify-center text-lg shadow-md shadow-brand-500/20 flex-shrink-0">
                    ⚡
                </div>
                {isOpen && (
                    <span className="text-lg font-bold bg-gradient-to-r from-brand-400 to-cyan-400 bg-clip-text text-transparent whitespace-nowrap">
                        Productive
                    </span>
                )}
            </div>

            {/* Nav */}
            <nav className="flex-1 px-2 py-4 space-y-1">
                {widgets.map((w) => (
                    <button
                        key={w.id}
                        onClick={() => setActiveWidget(w.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200
              ${activeWidget === w.id
                                ? 'bg-gradient-to-r from-brand-600/30 to-cyan-500/20 text-white border border-brand-500/30 shadow-sm shadow-brand-500/10'
                                : 'text-zinc-400 hover:text-white hover:bg-white/5'
                            }
              ${!isOpen ? 'justify-center' : ''}
            `}
                        title={w.label}
                    >
                        <span className="text-lg flex-shrink-0">{w.icon}</span>
                        {isOpen && <span>{w.label}</span>}
                    </button>
                ))}
            </nav>

            {/* User */}
            <div className={`px-3 py-4 border-t border-white/10 ${!isOpen ? 'flex justify-center' : ''}`}>
                {isOpen ? (
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-brand-500 to-cyan-400 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {user?.name?.[0]?.toUpperCase() || '?'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-white truncate">{user?.name}</p>
                            <p className="text-xs text-zinc-500 truncate">{user?.email}</p>
                        </div>
                        <button onClick={logout} className="btn-ghost text-xs" title="Déconnexion">
                            🚪
                        </button>
                    </div>
                ) : (
                    <button onClick={logout} className="btn-ghost text-lg" title="Déconnexion">
                        🚪
                    </button>
                )}
            </div>
        </aside>
    );
}
