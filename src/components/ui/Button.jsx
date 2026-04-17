export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick = null,
  className = '',
  type = 'button',
  isDarkMode = false,
  isLoading = false,
}) {
  const baseClasses = 'font-bold rounded-full transition-all disabled:opacity-50 disabled:cursor-not-allowed';

  const sizeClasses = {
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
    lg: 'px-6 py-2 text-base',
    full: 'w-full py-3 text-sm',
  };

  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-opacity-90',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-reddit-border-dark dark:text-white dark:hover:bg-opacity-70',
    ghost: 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-reddit-border-dark',
    danger: 'bg-red-500 text-white hover:bg-red-600',
    success: 'bg-green-500 text-white hover:bg-green-600',
  };

  const finalClasses = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`;

  return (
    <button type={type} disabled={disabled || isLoading} onClick={onClick} className={finalClasses}>
      {isLoading ? 'Loading...' : children}
    </button>
  );
}
