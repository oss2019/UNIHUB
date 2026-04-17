import { useState } from 'react';
import { motion } from 'motion/react';
import {
  ArrowBigDown,
  ArrowBigUp,
  ChevronRight,
  Clock3,
  Eye,
  MessageSquare,
  Paperclip,
  Share2,
  CheckCircle2,
  Pin,
} from 'lucide-react';
import { Badge } from '../ui';
import CommentForm from '../posts/CommentForm';
import CommentItem from '../posts/CommentItem';

const numberFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const formatCount = (value) => numberFormatter.format(value ?? 0);

export default function ThreadDetailView({
  thread,
  forum,
  subforum,
  isDarkMode,
  onBackToThreads,
  onBackToForum,
  onBackToForums,
  onAddComment,
}) {
  const [userVote, setUserVote] = useState(0); // -1 | 0 | 1
  const [copied, setCopied] = useState(false);

  const handleVote = (dir) => {
    setUserVote((prev) => {
      if (dir === 'up') return prev === 1 ? 0 : 1;
      return prev === -1 ? 0 : -1;
    });
  };

  const handleShare = () => {
    navigator.clipboard?.writeText(window.location.href).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const voteCount = (thread.likes ?? 0) + userVote;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Breadcrumb */}
      <div className="flex flex-wrap items-center gap-2 text-sm opacity-70">
        <button onClick={onBackToForums} className="font-medium hover:opacity-100">
          Home
        </button>
        <ChevronRight className="h-4 w-4" />
        <button onClick={onBackToForum} className="font-medium hover:opacity-100">
          {forum.name}
        </button>
        <ChevronRight className="h-4 w-4" />
        <button onClick={onBackToThreads} className="font-medium hover:opacity-100">
          {subforum.name}
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="max-w-[200px] truncate font-medium opacity-100">{thread.title}</span>
      </div>

      {/* Thread card */}
      <div
        className={`flex rounded-4xl border overflow-hidden ${
          isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
        }`}
      >
        {/* Vertical vote strip */}
        <div
          className={`flex w-14 flex-col items-center gap-2 py-6 ${
            isDarkMode ? 'bg-white/5' : 'bg-slate-50'
          }`}
        >
          <button
            onClick={() => handleVote('up')}
            className={`rounded-xl p-1 transition-colors hover:bg-cyan-100 dark:hover:bg-cyan-900/30 ${
              userVote === 1 ? 'text-cyan-500' : 'opacity-50 hover:opacity-100'
            }`}
            aria-label="Upvote"
          >
            <ArrowBigUp className={`h-7 w-7 ${userVote === 1 ? 'fill-current' : ''}`} />
          </button>
          <span
            className={`text-sm font-bold ${
              userVote === 1
                ? 'text-cyan-500'
                : userVote === -1
                ? 'text-rose-500'
                : ''
            }`}
          >
            {formatCount(voteCount)}
          </span>
          <button
            onClick={() => handleVote('down')}
            className={`rounded-xl p-1 transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/30 ${
              userVote === -1 ? 'text-rose-500' : 'opacity-50 hover:opacity-100'
            }`}
            aria-label="Downvote"
          >
            <ArrowBigDown className={`h-7 w-7 ${userVote === -1 ? 'fill-current' : ''}`} />
          </button>
        </div>

        {/* Main content */}
        <div className="flex-1 min-w-0 p-5 md:p-8">
          {/* Tags + badges */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="primary">{forum.name}</Badge>
            <Badge variant="default">{subforum.name}</Badge>
            {thread.isPinned && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                <Pin className="h-3 w-3" /> Pinned
              </span>
            )}
            {thread.isSolved && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                <CheckCircle2 className="h-3 w-3" /> Solved
              </span>
            )}
          </div>

          {/* Title */}
          <h1 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">{thread.title}</h1>

          {/* Meta row */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-sm opacity-70">
            <span className="font-semibold opacity-100">{thread.author}</span>
            {thread.authorRole && (
              <Badge variant={thread.authorRole === 'alumni' ? 'warning' : 'default'} size="xs">
                {thread.authorRole}
              </Badge>
            )}
            <span className="flex items-center gap-1">
              <Clock3 className="h-4 w-4" /> {thread.createdAt}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" /> {formatCount(thread.views)} views
            </span>
          </div>

          {/* Tags */}
          {(thread.tags ?? []).length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {thread.tags.map((tag) => (
                <span
                  key={tag}
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    isDarkMode ? 'bg-white/10' : 'bg-slate-100'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          {/* Body */}
          <div
            className={`mt-5 rounded-3xl border p-5 leading-7 ${
              isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50'
            }`}
          >
            <p className="whitespace-pre-wrap text-sm md:text-base">{thread.content}</p>

            {(thread.attachments ?? []).length > 0 && (
              <div className="mt-5 flex flex-wrap gap-2">
                {thread.attachments.map((attachment) => (
                  <span
                    key={attachment}
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${
                      isDarkMode ? 'bg-white/10' : 'bg-white border border-slate-200'
                    }`}
                  >
                    <Paperclip className="h-3.5 w-3.5" /> {attachment}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="mt-5 flex flex-wrap items-center gap-4 text-sm opacity-70">
            <span className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />{' '}
              {formatCount(thread.comments?.length ?? 0)} replies
            </span>
            <button
              onClick={handleShare}
              className="flex items-center gap-1 transition-colors hover:opacity-100"
            >
              <Share2 className="h-4 w-4" /> {copied ? 'Copied!' : 'Share'}
            </button>
          </div>
        </div>
      </div>

      {/* Comment section */}
      <div
        className={`rounded-4xl border p-5 md:p-8 ${
          isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
        }`}
      >
        <h2 className="mb-5 text-lg font-semibold">
          Discussion · {formatCount(thread.comments?.length ?? 0)} replies
        </h2>

        <CommentForm
          onAdd={(content) => onAddComment(thread.id, content)}
          isDarkMode={isDarkMode}
          placeholder="Share your thoughts on this thread…"
        />

        {(thread.comments ?? []).length > 0 && (
          <div className="mt-8 space-y-6">
            {thread.comments.map((comment) => (
              <CommentItem
                key={comment.id}
                comment={comment}
                onReply={(content, parentId) => onAddComment(thread.id, content, parentId)}
                isDarkMode={isDarkMode}
              />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
