import { useState } from 'react';

export default function CommentForm({ onAdd, isDarkMode, placeholder = 'What are your thoughts?' }) {
  const [content, setContent] = useState('');

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!content.trim()) return;
    onAdd(content);
    setContent('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <textarea
        className={`w-full p-3 rounded border text-sm focus:outline-none focus:border-gray-500 transition-colors ${isDarkMode ? 'bg-[#1a1a1b] border-reddit-border-dark' : 'bg-white border-gray-300'}`}
        placeholder={placeholder}
        rows={3}
        value={content}
        onChange={(event) => setContent(event.target.value)}
      />
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={!content.trim()}
          className="px-6 py-1.5 rounded-full bg-reddit-blue text-white font-bold text-sm disabled:opacity-50 hover:bg-opacity-90"
        >
          Comment
        </button>
      </div>
    </form>
  );
}