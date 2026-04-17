import { useState } from 'react';

export default function CommentForm({ onAdd, isDarkMode, placeholder = 'What are your thoughts?' }) {
  const [content, setContent] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    onAdd(content);
    setContent('');
  };

  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to submit
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && content.trim()) {
      handleSubmit(e);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="relative">
        <textarea
          className={`w-full rounded border px-3 py-3 text-sm transition-colors focus:border-cyan-500 focus:outline-none ${isDarkMode ? 'border-white/10 bg-slate-900/80' : 'border-slate-200 bg-white'}`}
          placeholder={placeholder}
          rows={3}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          onKeyDown={handleKeyDown}
        />
        <span className={`absolute bottom-2 right-3 text-xs opacity-50 ${content.length > 500 ? 'text-red-500 opacity-100' : ''}`}>
          {content.length}/500
        </span>
      </div>
      <div className="flex justify-end gap-2">
        <button
          type="submit"
          disabled={!content.trim()}
          className="rounded-full bg-cyan-500 px-6 py-1.5 text-sm font-bold text-white transition-all hover:bg-cyan-600 disabled:opacity-50"
        >
          Comment
        </button>
        <span className="text-xs opacity-50 flex items-center">Ctrl+Enter</span>
      </div>
    </form>
  );
}