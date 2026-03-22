import { Plus, TrendingUp, Zap } from 'lucide-react';

export default function RightSidebar({ isDarkMode, categories, onStartThread }) {
  return (
    <aside className="hidden xl:block w-80 shrink-0 space-y-4">
      <div className={`p-4 rounded border ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
        <div className="flex items-center gap-2 mb-4">
          <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white">
            <TrendingUp className="w-6 h-6" />
          </div>
          <h3 className="font-bold">Top Forums</h3>
        </div>
        <div className="space-y-4">
          {categories.slice(0, 5).map((forum, index) => (
            <div key={forum.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold text-sm w-4">{index + 1}</span>
                <span className="text-xl">{forum.icon}</span>
                <span className="text-sm font-medium">{forum.name}</span>
              </div>
              <button className="px-4 py-1 rounded-full bg-indigo-600 text-white text-xs font-bold hover:bg-opacity-90">Join</button>
            </div>
          ))}
          <button className="w-full py-2 mt-2 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-opacity-90">View All</button>
        </div>
      </div>

      <div className={`p-4 rounded border ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
        <h3 className="font-bold mb-4">Create Discussion</h3>
        <p className="text-sm opacity-70 mb-4">Share questions, projects, or requests with students and alumni.</p>
        <button
          onClick={onStartThread}
          className="w-full flex items-center justify-center gap-2 py-2 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-opacity-90"
        >
          <Plus className="w-5 h-5" /> Start Thread
        </button>
      </div>

      <div className={`p-4 rounded border ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
        <h3 className="font-bold mb-2 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Alumni Activity
        </h3>
        <p className="text-xs opacity-60">We send a reminder mail every fortnight if there is any activity in your subscribed threads.</p>
      </div>
    </aside>
  );
}