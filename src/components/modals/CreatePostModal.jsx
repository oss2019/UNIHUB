import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';

export default function CreatePostModal({ isOpen, onClose, isDarkMode, categories }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`w-full max-w-xl rounded-lg overflow-hidden shadow-2xl ${isDarkMode ? 'bg-reddit-card-dark border border-reddit-border-dark' : 'bg-white'}`}
          >
            <div className="flex items-center justify-between p-4 border-b dark:border-reddit-border-dark">
              <h2 className="font-bold">Create a new thread</h2>
              <button onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <select className={`w-full p-2 rounded border text-sm focus:outline-none ${isDarkMode ? 'bg-[#1a1a1b] border-reddit-border-dark' : 'bg-white border-gray-300'}`} defaultValue="">
                <option value="" disabled>
                  Choose a category
                </option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.icon} {category.name}
                  </option>
                ))}
              </select>
              <input type="text" placeholder="Title" className={`w-full p-2 rounded border text-sm focus:outline-none ${isDarkMode ? 'bg-[#1a1a1b] border-reddit-border-dark' : 'bg-white border-gray-300'}`} />
              <textarea placeholder="Text (optional)" rows={5} className={`w-full p-2 rounded border text-sm focus:outline-none ${isDarkMode ? 'bg-[#1a1a1b] border-reddit-border-dark' : 'bg-white border-gray-300'}`} />

              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" />
                  <span className="text-sm">
                    Ping Alumni <span className="text-xs opacity-50">(Sends a notification to relevant alumni)</span>
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer group">
                  <input type="checkbox" className="w-4 h-4 accent-indigo-600" />
                  <span className="text-sm">
                    Work Request <span className="text-xs opacity-50">(Mark this as a request for help)</span>
                  </span>
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button onClick={onClose} className="px-4 py-1.5 rounded-full border font-bold text-sm hover:bg-gray-100 dark:hover:bg-reddit-border-dark">
                  Cancel
                </button>
                <button onClick={onClose} className="px-4 py-1.5 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-opacity-90">
                  Post
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
