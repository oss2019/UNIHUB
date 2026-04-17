import { AlertCircle } from 'lucide-react';

export default function Input({
  type = 'text',
  placeholder = '',
  value = '',
  onChange = null,
  error = '',
  label = '',
  isDarkMode = false,
  disabled = false,
  className = '',
  required = false,
}) {
  const inputClasses = `w-full rounded border px-3 py-3 text-sm transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-50 ${
    error ? 'border-red-500' : isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'
  }`;

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs font-bold uppercase opacity-60">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`${inputClasses} ${className}`}
      />
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
