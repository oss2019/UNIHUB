import { useState } from 'react';
import { motion } from 'motion/react';
import { GraduationCap, X, AlertCircle } from 'lucide-react';

export default function AuthModal({ isOpen, onClose, isDarkMode, onSubmit = () => {} }) {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState('student');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };

  const validatePassword = (pwd) => pwd.length >= 6;

  const handleValidation = () => {
    const newErrors = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else if (!validatePassword(password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (isSignUp) {
      if (!confirmPassword.trim()) {
        newErrors.confirmPassword = 'Please confirm your password';
      } else if (password !== confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!handleValidation()) return;

    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      onSubmit({
        email,
        password,
        role,
        isSignUp,
      });
      setLoading(false);
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      onClose();
    }, 500);
  };

  return (
    <div className="fixed inset-0 z-120 flex items-center justify-center bg-black/60 p-4">
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
          <h2 className="text-2xl font-bold">{isSignUp ? 'Join AlumniConnect' : 'Welcome Back'}</h2>
          <p className="text-sm opacity-60">Connect with your university community and grow your network.</p>

          <form onSubmit={handleSubmit} className="space-y-3 pt-4">
            <div className="space-y-1">
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`w-full p-3 rounded border text-sm focus:outline-none focus:border-indigo-600 transition-colors ${
                  errors.email ? 'border-red-500' : isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white border-gray-300'
                }`}
              />
              {errors.email && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.email}</p>}
            </div>

            <div className="space-y-1">
              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={`w-full p-3 rounded border text-sm focus:outline-none focus:border-indigo-600 transition-colors ${
                  errors.password ? 'border-red-500' : isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white border-gray-300'
                }`}
              />
              {errors.password && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.password}</p>}
            </div>

            {isSignUp && (
              <>
                <div className="space-y-1">
                  <input
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`w-full p-3 rounded border text-sm focus:outline-none focus:border-indigo-600 transition-colors ${
                      errors.confirmPassword ? 'border-red-500' : isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white border-gray-300'
                    }`}
                  />
                  {errors.confirmPassword && <p className="text-xs text-red-500 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.confirmPassword}</p>}
                </div>

                <div className="space-y-1">
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className={`w-full p-3 rounded border text-sm focus:outline-none focus:border-indigo-600 transition-colors ${
                      isDarkMode ? 'bg-slate-900/80 border-white/10' : 'bg-white border-gray-300'
                    }`}
                  >
                    <option value="student">I am a Student</option>
                    <option value="alumni">I am an Alumnus</option>
                  </select>
                </div>
              </>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-full bg-indigo-600 text-white font-bold text-sm hover:bg-opacity-90 disabled:opacity-50 transition-all"
            >
              {loading ? 'Processing...' : isSignUp ? 'Sign Up' : 'Log In'}
            </button>
          </form>

          <div className="flex items-center gap-4 py-2">
            <div className="flex-1 h-px bg-gray-200 dark:bg-reddit-border-dark" />
            <span className="text-xs font-bold opacity-40 uppercase">OR</span>
            <div className="flex-1 h-px bg-gray-200 dark:bg-reddit-border-dark" />
          </div>

          <button className="w-full flex items-center justify-center gap-3 py-2.5 rounded-full border border-gray-300 dark:border-reddit-border-dark font-bold text-sm hover:bg-gray-50 dark:hover:bg-reddit-border-dark transition-colors">
            <img src="https://www.google.com/favicon.ico" className="w-4 h-4" alt="Google" />
            Continue with Google
          </button>

          <p className="text-xs pt-4">
            {isSignUp ? 'Already have an account? ' : 'New to AlumniConnect? '}
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setErrors({});
                setEmail('');
                setPassword('');
                setConfirmPassword('');
              }}
              className="text-indigo-600 font-bold hover:underline"
            >
              {isSignUp ? 'Log In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
