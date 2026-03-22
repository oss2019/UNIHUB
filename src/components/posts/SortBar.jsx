import { BarChart2, Flame, Sparkles, Zap } from 'lucide-react';
import SortButton from './SortButton';

export default function SortBar({ sortBy, setSortBy, isDarkMode }) {
  return (
    <div className={`flex items-center gap-4 p-3 mb-4 rounded border ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
      <SortButton
        active={sortBy === 'hot'}
        onClick={() => setSortBy('hot')}
        icon={<Flame className="w-5 h-5" />}
        label="Hot"
        isDarkMode={isDarkMode}
      />
      <SortButton
        active={sortBy === 'new'}
        onClick={() => setSortBy('new')}
        icon={<Sparkles className="w-5 h-5" />}
        label="New"
        isDarkMode={isDarkMode}
      />
      <SortButton
        active={sortBy === 'top'}
        onClick={() => setSortBy('top')}
        icon={<BarChart2 className="w-5 h-5" />}
        label="Top"
        isDarkMode={isDarkMode}
      />
      <SortButton
        active={sortBy === 'rising'}
        onClick={() => setSortBy('rising')}
        icon={<Zap className="w-5 h-5" />}
        label="Rising"
        isDarkMode={isDarkMode}
      />
    </div>
  );
}
