import { motion } from 'motion/react';
import { GraduationCap, LogOut, X } from 'lucide-react';

export default function AuthModal({
  isOpen,
  onClose,
  isDarkMode,
  currentUser = null,
  onGoogleLogin = () => {},
  onLogout = () => {},
}) {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 md:p-10">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`my-auto w-full max-w-md overflow-hidden rounded-lg p-8 shadow-2xl ${isDarkMode ? 'border border-reddit-border-dark bg-reddit-card-dark' : 'bg-white'}`}
      >
        <div className="flex justify-end -mt-4 -mr-4">
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-reddit-border-dark rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center space-y-4">
          <GraduationCap className="w-12 h-12 mx-auto text-indigo-600" />
          <h2 className="text-2xl font-bold">{currentUser ? 'You are signed in' : 'Sign in with IIT Dharwad email'}</h2>
          <p className="text-sm opacity-60">
            Authentication is handled via Google OAuth and secure cookies.
          </p>

          {currentUser ? (
            <div className={`space-y-3 rounded-2xl border p-4 text-left ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <p className="text-sm">
                <span className="font-semibold">Name:</span> {currentUser.name}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Email:</span> {currentUser.email}
              </p>
              <p className="text-sm">
                <span className="font-semibold">Role:</span> {currentUser.role}
              </p>

              <button
                type="button"
                onClick={onLogout}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-full bg-red-600 py-2.5 text-sm font-bold text-white transition-colors hover:bg-red-700"
              >
                <LogOut className="h-4 w-4" /> Logout
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={onGoogleLogin}
              className="w-full flex items-center justify-center gap-3 py-3 rounded-full border border-gray-300 dark:border-reddit-border-dark font-bold text-sm hover:bg-gray-50 dark:hover:bg-reddit-border-dark transition-colors"
            >
              <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
              Continue with Google
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}
