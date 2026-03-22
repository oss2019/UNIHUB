import { motion } from 'motion/react';
import { GraduationCap, X } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, isDarkMode, type }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`w-full max-w-md rounded-lg overflow-hidden shadow-2xl p-8 ${isDarkMode ? 'bg-reddit-card-dark border border-reddit-border-dark' : 'bg-white'}`}
      >
        <div className="flex justify-end -mt-4 -mr-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-reddit-border-dark rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center space-y-4">
          <GraduationCap className="w-12 h-12 mx-auto text-indigo-600" />
          <h2 className="text-2xl font-bold">{type === 'login' ? 'Welcome Back' : 'Join AlumniConnect'}</h2>
          <p className="text-sm opacity-60">Connect with your university community and grow your network.</p>

          <div className="space-y-3 pt-4">
            <button className="w-full flex items-center justify-center gap-3 py-2.5 rounded-full border border-gray-300 dark:border-reddit-border-dark font-bold text-sm hover:bg-gray-50 dark:hover:bg-reddit-border-dark transition-colors">
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              Continue with Google
            </button>
            <div className="flex items-center gap-4 py-2">
              <div className="flex-1 h-px bg-gray-200 dark:bg-reddit-border-dark" />
              <span className="text-xs font-bold opacity-40 uppercase">OR</span>
              <div className="flex-1 h-px bg-gray-200 dark:bg-reddit-border-dark" />
            </div>
            <input
              type="email"
              placeholder="Email"
              className={`w-full p-3 rounded border text-sm focus:outline-none focus:border-indigo-600 ${isDarkMode ? 'bg-[#1a1a1b] border-reddit-border-dark' : 'bg-white border-gray-300'}`}
            />
            {type === 'signup' && (
              <select className={`w-full p-3 rounded border text-sm focus:outline-none focus:border-indigo-600 ${isDarkMode ? 'bg-[#1a1a1b] border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
                <option value="student">I am a Student</option>
                <option value="alumni">I am an Alumnus</option>
              </select>
            )}
            <button className="w-full py-3 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-opacity-90">
              {type === 'login' ? 'Log In' : 'Sign Up'}
            </button>
          </div>

          <p className="text-xs pt-4">
            {type === 'login' ? 'New to AlumniConnect? ' : 'Already have an account? '}
            <button className="text-indigo-600 font-bold hover:underline">{type === 'login' ? 'Sign Up' : 'Log In'}</button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
