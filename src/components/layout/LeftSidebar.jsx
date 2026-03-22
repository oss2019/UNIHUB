import { AlertCircle, BookOpen, Calendar as CalendarIcon, Home } from 'lucide-react';

export default function LeftSidebar({
  currentView,
  selectedCategory,
  setCurrentView,
  setSelectedCategory,
  isDarkMode,
  categories,
}) {
  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="space-y-1">
        <button
          onClick={() => {
            setSelectedCategory(null);
            setCurrentView('forum');
          }}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'forum' && !selectedCategory ? (isDarkMode ? 'bg-reddit-border-dark' : 'bg-white') : 'hover:bg-gray-200 dark:hover:bg-reddit-border-dark'}`}
        >
          <Home className="w-5 h-5" /> Home
        </button>
        <button
          onClick={() => setCurrentView('resources')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'resources' ? (isDarkMode ? 'bg-reddit-border-dark' : 'bg-white') : 'hover:bg-gray-200 dark:hover:bg-reddit-border-dark'}`}
        >
          <BookOpen className="w-5 h-5" /> Resources
        </button>
        <button
          onClick={() => setCurrentView('calendar')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'calendar' ? (isDarkMode ? 'bg-reddit-border-dark' : 'bg-white') : 'hover:bg-gray-200 dark:hover:bg-reddit-border-dark'}`}
        >
          <CalendarIcon className="w-5 h-5" /> Calendar
        </button>
        <button
          onClick={() => setCurrentView('complaints')}
          className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${currentView === 'complaints' ? (isDarkMode ? 'bg-reddit-border-dark' : 'bg-white') : 'hover:bg-gray-200 dark:hover:bg-reddit-border-dark'}`}
        >
          <AlertCircle className="w-5 h-5" /> Grievances
        </button>
      </div>

      <div className="mt-8">
        <h3 className="px-3 text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Forums</h3>
        <div className="space-y-1">
          {categories.map((forum) => (
            <button
              key={forum.id}
              onClick={() => {
                setSelectedCategory(forum.id);
                setCurrentView('forum');
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${selectedCategory === forum.id ? (isDarkMode ? 'bg-reddit-border-dark' : 'bg-white') : 'hover:bg-gray-200 dark:hover:bg-reddit-border-dark'}`}
            >
              <span className="text-xl">{forum.icon}</span> {forum.name}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
}
