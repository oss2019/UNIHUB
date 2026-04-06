import { Bell, FileText, Plus, Sparkles, TrendingUp, Users } from 'lucide-react';

const numberFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

const formatCount = (value) => numberFormatter.format(value ?? 0);

export default function RightSidebar({
  isDarkMode,
  forums = [],
  selectedForum,
  selectedSubforum,
  messages = [],
  notifications = [],
  resources = [],
  subjects = [],
  reports = [],
  events = [],
  onStartThread,
}) {
  const activeNotifications = notifications.filter((notification) => !notification.isRead).length;
  const featuredForums = forums.slice(0, 4);

  return (
    <aside className="hidden w-80 shrink-0 space-y-4 xl:block">
      <div className={`rounded-3xl border p-4 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-cyan-500 text-white">
            <TrendingUp className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-semibold">Community pulse</h3>
            <p className="text-xs opacity-60">Live activity across the network</p>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
          <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-50">Messages</p>
            <p className="mt-2 text-xl font-semibold">{formatCount(messages.length)}</p>
          </div>
          <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-50">Alerts</p>
            <p className="mt-2 text-xl font-semibold">{formatCount(activeNotifications)}</p>
          </div>
          <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-50">Resources</p>
            <p className="mt-2 text-xl font-semibold">{formatCount(resources.length)}</p>
          </div>
          <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
            <p className="text-xs uppercase tracking-[0.2em] opacity-50">Subjects</p>
            <p className="mt-2 text-xl font-semibold">{formatCount(subjects.length)}</p>
          </div>
        </div>
      </div>

      <div className={`rounded-3xl border p-4 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-[0.28em] opacity-50">Featured forums</h3>
          <Users className="h-4 w-4 opacity-40" />
        </div>
        <div className="mt-4 space-y-3">
          {featuredForums.map((forum, index) => (
            <div key={forum.id} className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-5 text-sm font-semibold opacity-50">{index + 1}</span>
                <span className="text-xl">{forum.icon}</span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{forum.name}</p>
                  <p className="truncate text-xs opacity-50">{formatCount(forum.members)} members</p>
                </div>
              </div>
              <span className="text-xs font-semibold text-cyan-500">{formatCount(forum.activeNow)} now</span>
            </div>
          ))}
        </div>
      </div>

      <div className={`rounded-3xl border p-4 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
        <h3 className="flex items-center gap-2 font-semibold">
          <Sparkles className="h-4 w-4 text-cyan-500" /> Current board
        </h3>
        <p className="mt-2 text-sm leading-6 opacity-70">
          {selectedSubforum ? `${selectedForum?.name} / ${selectedSubforum.name}` : selectedForum ? selectedForum.name : 'Open a forum to see its focused boards here.'}
        </p>
        <button
          onClick={onStartThread}
          className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full bg-cyan-500 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600"
        >
          <Plus className="h-4 w-4" /> Start thread
        </button>
      </div>

      <div className={`rounded-3xl border p-4 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white/80'}`}>
        <h3 className="flex items-center gap-2 font-semibold">
          <FileText className="h-4 w-4 text-cyan-500" /> Recent reports
        </h3>
        <p className="mt-2 text-sm leading-6 opacity-70">{reports.length} moderation items currently tracked.</p>
        <p className="mt-3 text-xs uppercase tracking-[0.2em] opacity-50">Upcoming events</p>
        <ul className="mt-2 space-y-2 text-sm">
          {events.slice(0, 2).map((event) => (
            <li key={event.id} className={`rounded-2xl px-3 py-2.5 ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
              {event.title}
            </li>
          ))}
        </ul>
      </div>
    </aside>
  );
}