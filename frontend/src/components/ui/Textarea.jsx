import { AlertCircle } from 'lucide-react';

export default function Textarea({
  placeholder = '',
  value = '',
  onChange = null,
  error = '',
  label = '',
  isDarkMode = false,
  disabled = false,
  rows = 4,
  maxLength = 500,
  className = '',
  required = false,
  showCounter = true,
}) {
  const textareaClasses = `w-full rounded border px-3 py-3 text-sm transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-50 ${
    error ? 'border-red-500' : isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'
  }`;

  return (
    <div className="space-y-1">
      {label && (
        <div className="flex justify-between items-center">
          <label className="text-xs font-bold uppercase opacity-60">
            {label} {required && <span className="text-red-500">*</span>}
          </label>
          {showCounter && <span className={`text-xs opacity-60 ${value.length > maxLength ? 'text-red-500 opacity-100' : ''}`}>{value.length}/{maxLength}</span>}
        </div>
      )}
      <textarea
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        disabled={disabled}
        rows={rows}
        maxLength={maxLength}
        className={`${textareaClasses} ${className}`}
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
