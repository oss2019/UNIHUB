export default function Badge({ children, variant = 'default', size = 'sm', className = '' }) {
  const sizeClasses = {
    xs: 'px-2 py-0.5 text-xs',
    sm: 'px-3 py-1 text-xs',
    md: 'px-4 py-1.5 text-sm',
  };

  const variantClasses = {
    default: 'bg-gray-200 text-gray-900 dark:bg-reddit-border-dark dark:text-white',
    primary: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900 dark:text-indigo-200',
    success: 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-200',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-200',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-200',
    alumni: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-200',
    student: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-200',
  };

  return (
    <span className={`inline-block rounded-full font-semibold ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>
      {children}
    </span>
  );
}
