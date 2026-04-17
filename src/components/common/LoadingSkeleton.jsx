export default function LoadingSkeleton({ isDarkMode = false, variant = 'post', count = 1 }) {
  const skeletons = Array(count).fill(0);

  if (variant === 'post') {
    return (
      <>
        {skeletons.map((_, i) => (
          <div
            key={i}
            className={`flex rounded border animate-pulse ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}
          >
            {/* Vote column */}
            <div className={`w-10 shrink-0 ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'}`} />

            {/* Content */}
            <div className="flex-1 p-3 space-y-3">
              <div className="space-y-2">
                <div className={`h-4 w-2/3 rounded ${isDarkMode ? 'bg-reddit-border-dark' : 'bg-gray-200'}`} />
                <div className={`h-6 w-4/5 rounded ${isDarkMode ? 'bg-reddit-border-dark' : 'bg-gray-200'}`} />
              </div>
              <div className={`h-3 w-full rounded ${isDarkMode ? 'bg-reddit-border-dark' : 'bg-gray-200'}`} />
              <div className="flex gap-4 pt-2">
                <div className={`h-3 w-1/4 rounded ${isDarkMode ? 'bg-reddit-border-dark' : 'bg-gray-200'}`} />
                <div className={`h-3 w-1/4 rounded ${isDarkMode ? 'bg-reddit-border-dark' : 'bg-gray-200'}`} />
              </div>
            </div>
          </div>
        ))}
      </>
    );
  }

  if (variant === 'comment') {
    return (
      <>
        {skeletons.map((_, i) => (
          <div key={i} className="flex gap-2 animate-pulse">
            <div className={`w-8 h-8 rounded-full shrink-0 ${isDarkMode ? 'bg-reddit-border-dark' : 'bg-gray-200'}`} />
            <div className="flex-1 space-y-2">
              <div className={`h-3 w-1/3 rounded ${isDarkMode ? 'bg-reddit-border-dark' : 'bg-gray-200'}`} />
              <div className={`h-12 w-full rounded ${isDarkMode ? 'bg-reddit-border-dark' : 'bg-gray-200'}`} />
            </div>
          </div>
        ))}
      </>
    );
  }

  return null;
}
