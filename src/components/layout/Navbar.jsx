import { LogIn, Moon, Search, Sun, UserPlus } from 'lucide-react';

export default function Navbar({
  isDarkMode,
  searchQuery,
  setSearchQuery,
  onToggleTheme,
  onOpenLogin,
  onOpenSignup,
  onGoHome,
}) {
  return (
    <nav className={`sticky top-0 z-50 flex items-center justify-between px-4 py-1.5 border-b ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
      <div className="flex items-center gap-2 cursor-pointer" onClick={onGoHome}>
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xl">A</div>
        <span className="hidden md:block font-bold text-xl tracking-tight">AlumniConnect</span>
      </div>

      <div className={`flex-1 max-w-2xl mx-4 flex items-center px-4 py-2 rounded-full border ${isDarkMode ? 'bg-[#272729] border-reddit-border-dark' : 'bg-gray-100 border-transparent'} focus-within:border-reddit-blue focus-within:bg-white transition-all`}>
        <Search className="w-5 h-5 text-gray-500 mr-2" />
        <input
          type="text"
          placeholder="Search Reddit"
          className="bg-transparent border-none outline-none w-full text-sm"
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onToggleTheme}
          className={`p-2 rounded-full transition-all ${isDarkMode ? 'hover:bg-reddit-border-dark text-amber-400' : 'hover:bg-gray-100 text-gray-600'}`}
        >
          {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
        </button>
        <button
          onClick={onOpenLogin}
          className={`hidden sm:flex items-center gap-1 px-4 py-1.5 rounded-full border font-bold text-sm transition-colors ${isDarkMode ? 'border-reddit-border-dark hover:bg-reddit-border-dark' : 'border-gray-300 hover:bg-gray-100 text-indigo-600'}`}
        >
          <LogIn className="w-4 h-4" /> Log In
        </button>
        <button
          onClick={onOpenSignup}
          className="hidden sm:flex items-center gap-1 px-4 py-1.5 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-opacity-90 transition-colors"
        >
          <UserPlus className="w-4 h-4" /> Sign Up
        </button>
      </div>
    </nav>
  );
}
