import { CheckCircle, AlertCircle, Info, X } from 'lucide-react';

export default function Toast({ message, type = 'info', isDarkMode = false, onClose = null, autoClose = true }) {
  const icon = {
    success: CheckCircle,
    error: AlertCircle,
    info: Info,
  }[type];

  const Icon = icon;
  const bgColor = {
    success: isDarkMode ? 'bg-green-900/30 border-green-800' : 'bg-green-50 border-green-200',
    error: isDarkMode ? 'bg-red-900/30 border-red-800' : 'bg-red-50 border-red-200',
    info: isDarkMode ? 'bg-blue-900/30 border-blue-800' : 'bg-blue-50 border-blue-200',
  }[type];

  const textColor = {
    success: 'text-green-700 dark:text-green-200',
    error: 'text-red-700 dark:text-red-200',
    info: 'text-blue-700 dark:text-blue-200',
  }[type];

  return (
    <div className={`fixed bottom-24 right-6 z-50 flex max-w-sm items-center gap-3 rounded-lg border p-4 ${bgColor} animate-in slide-in-from-bottom-2 duration-300`}>
      <Icon className={`h-5 w-5 shrink-0 ${textColor}`} />
      <p className={`text-sm font-medium ${textColor} flex-1`}>{message}</p>
      {onClose && (
        <button onClick={onClose} className={`shrink-0 ${textColor} hover:opacity-70`}>
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
