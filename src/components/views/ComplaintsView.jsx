import { AlertCircle } from 'lucide-react';

export default function ComplaintsView({ isDarkMode }) {
  return (
    <div className={`p-6 rounded border ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
      <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
        <AlertCircle className="w-6 h-6 text-red-500" /> Complaints & Grievances
      </h2>
      <p className="text-sm opacity-70 mb-8">Submit your concerns or report issues. Your identity can be kept anonymous if requested.</p>

      <form className="space-y-4 max-w-xl">
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase opacity-60">Subject</label>
          <input
            type="text"
            placeholder="Briefly describe the issue"
            className={`w-full p-2 rounded border text-sm focus:outline-none focus:border-red-500 ${isDarkMode ? 'bg-[#1a1a1b] border-reddit-border-dark' : 'bg-white border-gray-300'}`}
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase opacity-60">Category</label>
          <select className={`w-full p-2 rounded border text-sm focus:outline-none ${isDarkMode ? 'bg-[#1a1a1b] border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
            <option>Academic Issue</option>
            <option>Infrastructure</option>
            <option>Placement Cell</option>
            <option>Harassment/Reporting</option>
            <option>Other</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold uppercase opacity-60">Description</label>
          <textarea
            rows={6}
            placeholder="Provide details about your grievance..."
            className={`w-full p-2 rounded border text-sm focus:outline-none focus:border-red-500 ${isDarkMode ? 'bg-[#1a1a1b] border-reddit-border-dark' : 'bg-white border-gray-300'}`}
          />
        </div>
        <div className="flex items-center gap-2 mb-4">
          <input type="checkbox" className="w-4 h-4 accent-red-500" id="anon" />
          <label htmlFor="anon" className="text-sm cursor-pointer">
            Submit Anonymously
          </label>
        </div>
        <button className="px-8 py-2 rounded-full bg-red-500 text-white font-bold text-sm hover:bg-red-600 transition-colors">Submit Grievance</button>
      </form>
    </div>
  );
}