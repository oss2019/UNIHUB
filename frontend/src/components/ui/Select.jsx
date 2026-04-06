import { AlertCircle } from 'lucide-react';

export default function Select({
  value = '',
  onChange = null,
  options = [],
  error = '',
  label = '',
  isDarkMode = false,
  disabled = false,
  className = '',
  required = false,
  placeholder = 'Select an option',
}) {
  const selectClasses = `w-full rounded border px-3 py-3 text-sm transition-colors focus:border-cyan-500 focus:outline-none disabled:opacity-50 ${
    error ? 'border-red-500' : isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'
  }`;

  return (
    <div className="space-y-1">
      {label && (
        <label className="text-xs font-bold uppercase opacity-60">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select value={value} onChange={onChange} disabled={disabled} className={`${selectClasses} ${className}`}>
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      )}
    </div>
  );
}
