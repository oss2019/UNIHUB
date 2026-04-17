import { useMemo, useState } from 'react';
import { BookOpen } from 'lucide-react';
import { RESOURCES } from '../../constants/appData';

const FILTERS = ['all', 'course', 'question-bank', 'internship', 'fte'];

export default function ResourcesView({ isDarkMode }) {
  const [filter, setFilter] = useState('all');

  const filteredResources = useMemo(() => {
    if (filter === 'all') return RESOURCES;
    return RESOURCES.filter((resource) => resource.type === filter);
  }, [filter]);

  return (
    <div className="space-y-6">
      <div className={`p-6 rounded border ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark' : 'bg-white border-gray-300'}`}>
        <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-indigo-600" /> Repository & Resources
        </h2>
        <p className="text-sm opacity-70 mb-6">Access course content, question banks, and placement resources curated by students and alumni.</p>

        <div className="flex flex-wrap gap-2 mb-8">
          {FILTERS.map((resourceType) => (
            <button
              key={resourceType}
              onClick={() => setFilter(resourceType)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all ${filter === resourceType ? 'bg-indigo-600 text-white' : 'bg-gray-100 dark:bg-reddit-border-dark hover:bg-gray-200'}`}
            >
              {resourceType.replace('-', ' ')}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredResources.map((resource) => (
            <div key={resource.id} className={`group rounded border p-4 transition-all hover:border-cyan-500 ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-slate-50'}`}>
              <div className="flex items-start justify-between mb-2">
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 rounded">
                  {resource.type.replace('-', ' ')}
                </span>
                <a href={resource.link} className="text-indigo-600 hover:underline text-xs font-bold">
                  Download
                </a>
              </div>
              <h3 className="font-bold mb-1 group-hover:text-indigo-600">{resource.title}</h3>
              <p className="text-xs opacity-70 mb-3">{resource.description}</p>
              <div className="flex flex-wrap gap-1">
                {resource.tags.map((tag) => (
                  <span key={tag} className="text-[10px] opacity-50">
                    #{tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
