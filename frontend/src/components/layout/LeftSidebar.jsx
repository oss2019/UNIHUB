import { AlertCircle, BookOpen, Calendar as CalendarIcon, Home, LayoutGrid, MessageSquare } from 'lucide-react';

export default function LeftSidebar({
  currentView,
  selectedForumId,
  selectedSubforumId,
  setCurrentView,
  setSelectedForumId,
  setSelectedSubforumId,
  isDarkMode,
  forums,
  onGoHome,
}) {
  return (
    <aside className="hidden w-72 shrink-0 lg:block">
      <div className={`rounded-3xl border p-3 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
        <button
          onClick={onGoHome}
          className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${currentView === 'home' ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          <Home className="h-5 w-5" /> Home
        </button>
        <button
          onClick={() => setCurrentView('resources')}
          className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${currentView === 'resources' ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          <BookOpen className="h-5 w-5" /> Resources
        </button>
        <button
          onClick={() => setCurrentView('calendar')}
          className={`mb-2 flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${currentView === 'calendar' ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          <CalendarIcon className="h-5 w-5" /> Calendar
        </button>
        <button
          onClick={() => setCurrentView('complaints')}
          className={`flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-colors ${currentView === 'complaints' ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
        >
          <AlertCircle className="h-5 w-5" /> Reports
        </button>
      </div>

      <div className={`mt-4 rounded-3xl border p-4 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.28em] opacity-50">Forums</h3>
          <LayoutGrid className="h-4 w-4 opacity-40" />
        </div>
        <div className="mt-3 space-y-2">
          {forums.map((forum) => (
            <button
              key={forum.id}
              onClick={() => {
                setCurrentView('home');
                setSelectedForumId(forum.id);
                setSelectedSubforumId(null);
              }}
              className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-medium transition-colors ${selectedForumId === forum.id ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
            >
              <span className="text-lg">{forum.icon}</span>
              <span className="min-w-0 flex-1 truncate">{forum.name}</span>
              {selectedForumId === forum.id && <span className="h-2.5 w-2.5 rounded-full bg-cyan-500" />}
            </button>
          ))}
        </div>
      </div>

      
    </aside>
  );
}
