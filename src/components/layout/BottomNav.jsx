import { BookOpen, Calendar, Home, Menu, MessageSquare, ShieldAlert } from 'lucide-react';
import { useState } from 'react';

export default function BottomNav({ currentView, setCurrentView, isDarkMode, forums, selectedForumId, setSelectedForumId, setSelectedSubforumId, onGoHome }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navItems = [
    { id: 'home', icon: Home, label: 'Home' },
    { id: 'resources', icon: BookOpen, label: 'Resources' },
    { id: 'calendar', icon: Calendar, label: 'Events' },
    { id: 'complaints', icon: ShieldAlert, label: 'Reports' },
  ];

  const handleNavClick = (viewId) => {
    setCurrentView(viewId);
    if (viewId === 'home') {
      onGoHome();
    }
    setIsMenuOpen(false);
  };

  return (
    <>
      <div className={`fixed inset-x-0 bottom-0 z-50 border-t backdrop-blur-xl lg:hidden ${isDarkMode ? 'border-white/10 bg-slate-950/90' : 'border-slate-200 bg-white/90'}`}>
        <div className="flex flex-nowrap justify-between overflow-x-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`flex flex-1 flex-col items-center justify-center py-3 px-2 transition-colors ${isActive ? 'text-cyan-500' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'}`}
              >
                <Icon className="mx-auto h-6 w-6" />
                <span className="mt-1 text-xs font-semibold">{item.label}</span>
              </button>
            );
          })}

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex flex-1 flex-col items-center justify-center px-2 py-3 text-slate-500 transition-colors hover:text-slate-900 dark:hover:text-slate-200"
          >
            <Menu className="h-6 w-6" />
            <span className="mt-1 text-xs font-semibold">Forums</span>
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className={`fixed inset-0 z-40 lg:hidden ${isDarkMode ? 'bg-black/60' : 'bg-black/35'}`} onClick={() => setIsMenuOpen(false)}>
          <div
            className={`fixed bottom-16 left-0 right-0 max-h-96 overflow-y-auto rounded-t-3xl border-t ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}
            onClick={(event) => event.stopPropagation()}
          >
            <div className="p-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-cyan-500" />
                <h3 className="font-semibold">Communities</h3>
              </div>
              <div className="mt-3 space-y-2">
                {forums.map((forum) => (
                  <button
                    key={forum.id}
                    onClick={() => {
                      setSelectedForumId(forum.id);
                      setSelectedSubforumId(null);
                      setCurrentView('home');
                      setIsMenuOpen(false);
                    }}
                    className={`flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left transition-colors ${selectedForumId === forum.id ? (isDarkMode ? 'bg-white/10' : 'bg-slate-100') : 'hover:bg-black/5 dark:hover:bg-white/10'}`}
                  >
                    <span className="text-lg">{forum.icon}</span>
                    <span className="font-medium">{forum.name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="h-20 lg:h-0" />
    </>
  );
}
