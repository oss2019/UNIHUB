import { Calendar as CalendarIcon } from 'lucide-react';
import { EVENTS } from '../../constants/appData';

export default function CalendarView({ isDarkMode }) {
  return (
    <div className={`p-6 rounded border ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
      <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <CalendarIcon className="w-6 h-6 text-indigo-600" /> Upcoming Events
      </h2>

      <div className="space-y-4">
        {EVENTS.map((event) => (
          <div key={event.id} className={`flex items-center gap-4 rounded border p-4 ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-slate-50'}`}>
            <div className={`w-12 h-12 rounded flex flex-col items-center justify-center font-bold ${isDarkMode ? 'bg-reddit-border-dark' : 'bg-white'}`}>
              <span className="text-[10px] text-indigo-600 uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
              <span className="text-lg">{new Date(event.date).getDate()}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold">{event.title}</h3>
              <div className="flex items-center gap-2 text-xs opacity-60">
                <span className="capitalize">{event.type}</span>
                <span>•</span>
                <span>Online</span>
              </div>
            </div>
            <button className="px-4 py-1.5 rounded-full bg-indigo-600 text-white text-xs font-bold hover:bg-opacity-90">Remind Me</button>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 rounded bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/20">
        <p className="text-sm text-indigo-700 dark:text-indigo-400 font-medium">
          Tip: You can sync these events with your Google Calendar to stay updated on alumni webinars and workshops.
        </p>
      </div>
    </div>
  );
}
