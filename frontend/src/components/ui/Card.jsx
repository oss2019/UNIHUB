export default function Card({ children, isDarkMode = false, className = '', onClick = null }) {
  const baseClasses = `rounded-3xl border transition-colors ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`;

  return (
    <div className={`${baseClasses} ${className}`} onClick={onClick}>
      {children}
    </div>
  );
}
