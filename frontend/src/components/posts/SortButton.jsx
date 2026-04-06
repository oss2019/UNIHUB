export default function SortButton({ active, onClick, icon, label, isDarkMode }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all ${active ? (isDarkMode ? 'bg-reddit-border-dark text-white' : 'bg-gray-100 text-indigo-600') : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-reddit-border-dark'}`}
    >
      {icon} {label}
    </button>
  );
}
