export default function EmptyState({ isDarkMode = false, icon: Icon, title, description, action = null }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center opacity-70">
      {Icon && <Icon className="w-16 h-16 mx-auto mb-4 opacity-50" />}
      <h3 className="text-xl font-semibold mb-2">{title}</h3>
      <p className="text-sm mb-6">{description}</p>
      {action && <>{action}</>}
    </div>
  );
}
