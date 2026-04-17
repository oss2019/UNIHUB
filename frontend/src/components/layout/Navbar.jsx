import { useMemo, useState } from 'react';
import { Bell, Calendar, ChevronRight, Home, LogIn, Menu, Moon, Search, ShieldAlert, Sun, UserPlus, X } from 'lucide-react';
import { Button } from '../ui';

export default function Navbar({
  isDarkMode,
  searchQuery,
  setSearchQuery,
  onToggleTheme,
  onOpenLogin,
  onOpenSignup,
  onGoHome,
  activeNotifications = 0,
  selectedForum,
  selectedSubforum,
  forums = [],
  currentView,
  setCurrentView,
  setSelectedForumId,
  setSelectedSubforumId,
  onOpenNotifications,
}) {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const drawerForums = useMemo(() => forums.slice(0, 4), [forums]);

  const navigate = (viewId) => {
    setCurrentView(viewId);
    setIsDrawerOpen(false);
  };

  return (
    <nav className={`sticky top-0 z-50 border-b backdrop-blur-xl ${isDarkMode ? 'border-white/10 bg-slate-950/85' : 'border-slate-200 bg-white/85'}`}>
      <div className="mx-auto flex w-full max-w-7xl items-center gap-3 px-4 py-3 lg:px-5">
        <button className="flex items-center gap-3 text-left" onClick={onGoHome}>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-lg font-semibold text-white">
            A
          </div>
          <div className="hidden sm:block">
            <div className="text-lg font-semibold tracking-tight">AlumniConnect</div>
            <div className="text-xs uppercase tracking-[0.28em] opacity-50">Campus community network</div>
          </div>
        </button>

        <div className={`hidden flex-1 items-center gap-3 rounded-full border px-4 py-2.5 transition-colors md:flex ${isDarkMode ? 'border-white/10 bg-white/5 focus-within:border-cyan-400/50' : 'border-slate-200 bg-white focus-within:border-cyan-500/40'}`}>
          <Search className="h-5 w-5 opacity-50" />
          <input
            type="text"
            placeholder="Search forums, boards, or threads"
            className="w-full bg-transparent text-sm outline-none placeholder:opacity-50"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
          />
        </div>

        <div className="hidden items-center gap-2 lg:flex">
          

          <button onClick={onToggleTheme} className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}>
            {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <button onClick={onOpenLogin} className={`items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition-colors sm:flex ${isDarkMode ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-white hover:bg-slate-50'}`}>
            <LogIn className="h-4 w-4" /> Log in
          </button>

          <button onClick={onOpenSignup} className="items-center gap-2 rounded-full bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 sm:flex">
            <UserPlus className="h-4 w-4" /> Sign up
          </button>

          <button
            type="button"
            onClick={onOpenNotifications}
            className={`relative flex h-11 w-11 items-center justify-center rounded-full ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}
            aria-label="Open notifications"
          >
            <Bell className="h-5 w-5 opacity-70" />
            {activeNotifications > 0 && <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-cyan-500" />}
          </button>
        </div>

        <button
          type="button"
          onClick={() => setIsDrawerOpen(true)}
          className={`ml-auto flex h-11 w-11 items-center justify-center rounded-full lg:hidden ${isDarkMode ? 'bg-white/5' : 'bg-slate-100'}`}
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {isDrawerOpen && (
        <div className={`fixed inset-0 z-[60] lg:hidden ${isDarkMode ? 'bg-black/50' : 'bg-black/30'}`} onClick={() => setIsDrawerOpen(false)}>
          <div
            className={`absolute right-0 top-0 h-full w-[88vw] max-w-sm overflow-y-auto border-l ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className={`flex items-center justify-between border-b px-4 py-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-50">Menu</p>
                <h2 className="text-lg font-semibold">AlumniConnect</h2>
              </div>
              <button onClick={() => setIsDrawerOpen(false)} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5 px-4 py-4">
              <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                <Search className="h-4 w-4 opacity-50" />
                <input
                  type="text"
                  placeholder="Search forums or threads"
                  className="w-full bg-transparent text-sm outline-none"
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => navigate('home')} className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold ${currentView === 'home' ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10'}`}>
                  <Home className="mb-2 h-4 w-4" /> Home
                </button>
                <button onClick={() => navigate('resources')} className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold ${currentView === 'resources' ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10'}`}>
                  <ChevronRight className="mb-2 h-4 w-4" /> Resources
                </button>
                <button onClick={() => navigate('calendar')} className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold ${currentView === 'calendar' ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10'}`}>
                  <Calendar className="mb-2 h-4 w-4" /> Calendar
                </button>
                <button onClick={() => navigate('complaints')} className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold ${currentView === 'complaints' ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/10'}`}>
                  <ShieldAlert className="mb-2 h-4 w-4" /> Reports
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  onOpenNotifications?.();
                  setIsDrawerOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-2xl border px-4 py-3 text-left text-sm font-semibold ${isDarkMode ? 'border-white/10 bg-white/5 hover:bg-white/10' : 'border-slate-200 bg-slate-50 hover:bg-slate-100'}`}
              >
                <span className="flex items-center gap-2">
                  <Bell className="h-4 w-4" /> Notifications
                </span>
                {activeNotifications > 0 && (
                  <span className="rounded-full bg-cyan-500 px-2 py-0.5 text-xs font-semibold text-white">{activeNotifications}</span>
                )}
              </button>

              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-50">Communities</p>
                {drawerForums.map((forum) => (
                  <button
                    key={forum.id}
                    onClick={() => {
                      setSelectedForumId(forum.id);
                      setSelectedSubforumId(null);
                      setCurrentView('home');
                      setIsDrawerOpen(false);
                    }}
                    className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-medium ${selectedForum?.id === forum.id ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg">{forum.icon}</span>
                      <span>{forum.name}</span>
                    </span>
                    <ChevronRight className="h-4 w-4 opacity-50" />
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <Button variant="ghost" onClick={onToggleTheme} isDarkMode={isDarkMode} className="justify-center">
                  {isDarkMode ? 'Light mode' : 'Dark mode'}
                </Button>
                <Button variant="primary" onClick={onOpenSignup} isDarkMode={isDarkMode} className="justify-center">
                  Sign up
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
