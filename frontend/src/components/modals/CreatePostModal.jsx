import { useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { AlertCircle, X } from 'lucide-react';

export default function CreatePostModal({ isOpen, onClose, isDarkMode, forums = [], selectedForumId, selectedSubforumId, onSubmit = () => {} }) {
  const [forumId, setForumId] = useState(selectedForumId || forums[0]?.id || '');
  const [subforumId, setSubforumId] = useState(selectedSubforumId || '');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setForumId(selectedForumId || forums[0]?.id || '');
    setSubforumId(selectedSubforumId || '');
    setErrors({});
    setTitle('');
    setContent('');
    setTags('');
  }, [isOpen, forums, selectedForumId, selectedSubforumId]);

  const selectedForum = useMemo(() => forums.find((forum) => forum.id === forumId) || null, [forums, forumId]);

  const availableSubforums = selectedForum?.subforums || [];

  useEffect(() => {
    if (!availableSubforums.length) {
      return;
    }

    if (!availableSubforums.some((subforum) => subforum.id === subforumId)) {
      setSubforumId(availableSubforums[0].id);
    }
  }, [availableSubforums, subforumId]);

  const validateForm = () => {
    const nextErrors = {};

    if (!forumId) {
      nextErrors.forumId = 'Pick a forum first';
    }

    if (!subforumId) {
      nextErrors.subforumId = 'Pick a subforum';
    }

    if (!title.trim()) {
      nextErrors.title = 'Thread title is required';
    } else if (title.length < 8) {
      nextErrors.title = 'Thread title should be at least 8 characters';
    } else if (title.length > 140) {
      nextErrors.title = 'Thread title must be 140 characters or less';
    }

    if (!content.trim()) {
      nextErrors.content = 'Thread content is required';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const resetForm = () => {
    setForumId(selectedForumId || forums[0]?.id || '');
    setSubforumId(selectedSubforumId || '');
    setTitle('');
    setContent('');
    setTags('');
    setErrors({});
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setTimeout(() => {
      onSubmit({
        forumId,
        subforumId,
        title,
        content,
        tags: tags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
      });
      setLoading(false);
      resetForm();
    }, 350);
  };

  const handleCancel = () => {
    resetForm();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-110 flex items-center justify-center bg-black/60 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className={`w-full max-w-2xl overflow-hidden rounded-3xl border shadow-2xl ${isDarkMode ? 'border-white/10 bg-slate-950' : 'border-slate-200 bg-white'}`}
          >
            <div className={`flex items-center justify-between border-b px-5 py-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-50">New thread</p>
                <h2 className="mt-1 text-lg font-semibold">Start a conversation in the right board</h2>
              </div>
              <button onClick={handleCancel} className="rounded-full p-2 hover:bg-black/5 dark:hover:bg-white/10">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Forum</label>
                  <select
                    value={forumId}
                    onChange={(event) => setForumId(event.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors ${
                      errors.forumId ? 'border-red-500' : isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <option value="">Choose a forum</option>
                    {forums.map((forum) => (
                      <option key={forum.id} value={forum.id}>
                        {forum.icon} {forum.name}
                      </option>
                    ))}
                  </select>
                  {errors.forumId && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" /> {errors.forumId}
                    </p>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Subforum</label>
                  <select
                    value={subforumId}
                    onChange={(event) => setSubforumId(event.target.value)}
                    className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors ${
                      errors.subforumId ? 'border-red-500' : isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <option value="">Choose a subforum</option>
                    {availableSubforums.map((subforum) => (
                      <option key={subforum.id} value={subforum.id}>
                        {subforum.name}
                      </option>
                    ))}
                  </select>
                  {errors.subforumId && (
                    <p className="flex items-center gap-1 text-xs text-red-500">
                      <AlertCircle className="h-3.5 w-3.5" /> {errors.subforumId}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Thread title</label>
                  <span className={`text-xs ${title.length > 140 ? 'text-red-500' : 'opacity-50'}`}>{title.length}/140</span>
                </div>
                <input
                  type="text"
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  placeholder="What should the board discuss?"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors ${
                    errors.title ? 'border-red-500' : isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
                  }`}
                />
                {errors.title && (
                  <p className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.title}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Thread content</label>
                  <span className="text-xs opacity-50">Be specific. A better prompt gets better replies.</span>
                </div>
                <textarea
                  rows={6}
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  placeholder="Share context, ask a question, or post an update."
                  className={`w-full rounded-3xl border px-4 py-3 text-sm outline-none transition-colors ${
                    errors.content ? 'border-red-500' : isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
                  }`}
                />
                {errors.content && (
                  <p className="flex items-center gap-1 text-xs text-red-500">
                    <AlertCircle className="h-3.5 w-3.5" /> {errors.content}
                  </p>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold uppercase tracking-[0.2em] opacity-60">Tags</label>
                <input
                  type="text"
                  value={tags}
                  onChange={(event) => setTags(event.target.value)}
                  placeholder="Example: interview, dsa, referrals"
                  className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none transition-colors ${
                    isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
                  }`}
                />
              </div>

              <div className={`flex flex-col gap-3 border-t pt-4 sm:flex-row sm:justify-end ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                <button
                  type="button"
                  onClick={handleCancel}
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold ${isDarkMode ? 'bg-white/5 hover:bg-white/10' : 'bg-slate-100 hover:bg-slate-200'}`}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="rounded-full bg-cyan-500 px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading ? 'Publishing...' : 'Publish thread'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
