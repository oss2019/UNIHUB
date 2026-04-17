import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  ArrowBigUp,
  ArrowBigDown,
  MessageSquare,
  Share2,
  Pin,
  CheckCircle2,
  Flame,
  Sparkles,
  BarChart2,
  ChevronRight,
  Eye,
  Clock3,
} from 'lucide-react';
import { Badge, Button } from '../ui';
import EmptyState from '../common/EmptyState';

const numberFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });
const formatCount = (value) => numberFormatter.format(value ?? 0);

// ── Sort helpers ─────────────────────────────────────────────────────────────
const SORT_OPTIONS = [
  { key: 'hot', label: 'Hot', icon: Flame },
  { key: 'new', label: 'New', icon: Sparkles },
  { key: 'top', label: 'Top', icon: BarChart2 },
];

function sortThreads(threads, sortBy, votes) {
  const withVotes = threads.map((t) => ({
    ...t,
    effectiveLikes: (t.likes ?? 0) + (votes[t.id] ?? 0),
  }));

  switch (sortBy) {
    case 'new':
      // threads at the top of the array are newest (already insertion order)
      return [...withVotes];
    case 'top':
      return [...withVotes].sort((a, b) => b.effectiveLikes - a.effectiveLikes);
    case 'hot':
    default: {
      // hot = blended score: likes weighted by recency signal (replies count)
      const score = (t) => t.effectiveLikes * 0.7 + (t.replies ?? 0) * 0.3;
      return [...withVotes].sort((a, b) => score(b) - score(a));
    }
  }
}

// ── Thread row card ───────────────────────────────────────────────────────────
function ThreadRow({ thread, subforum, forum, isDarkMode, onVote, onOpen, userVote }) {
  const handleVote = (dir, e) => {
    e.stopPropagation();
    onVote(thread.id, dir);
  };

  const voteCount = (thread.likes ?? 0) + (userVote ?? 0);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      className={`group flex rounded-3xl border transition-all ${
        isDarkMode
          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      {/* Vote column */}
      <div
        className={`flex w-12 flex-col items-center gap-1 py-3 rounded-l-3xl ${
          isDarkMode ? 'bg-white/5' : 'bg-slate-50'
        }`}
      >
        <button
          onClick={(e) => handleVote('up', e)}
          className={`rounded-lg p-0.5 transition-colors hover:bg-cyan-100 dark:hover:bg-cyan-900/30 ${
            userVote === 1 ? 'text-cyan-500' : 'opacity-50 hover:opacity-100'
          }`}
          aria-label="Upvote"
        >
          <ArrowBigUp className={`h-6 w-6 ${userVote === 1 ? 'fill-current' : ''}`} />
        </button>
        <span
          className={`text-xs font-bold ${
            userVote === 1 ? 'text-cyan-500' : userVote === -1 ? 'text-rose-500' : ''
          }`}
        >
          {formatCount(voteCount)}
        </span>
        <button
          onClick={(e) => handleVote('down', e)}
          className={`rounded-lg p-0.5 transition-colors hover:bg-rose-100 dark:hover:bg-rose-900/30 ${
            userVote === -1 ? 'text-rose-500' : 'opacity-50 hover:opacity-100'
          }`}
          aria-label="Downvote"
        >
          <ArrowBigDown className={`h-6 w-6 ${userVote === -1 ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Content */}
      <button
        type="button"
        onClick={() => onOpen(thread)}
        className="flex-1 min-w-0 p-4 text-left"
      >
        {/* Breadcrumb + meta */}
        <div className="flex flex-wrap items-center gap-2 text-xs opacity-60 mb-2">
          <span>{forum.name}</span>
          <ChevronRight className="h-3 w-3" />
          <span>{subforum.name}</span>
          <span className="ml-auto flex items-center gap-1">
            <Clock3 className="h-3 w-3" /> {thread.createdAt}
          </span>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap gap-1.5 mb-2">
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
          {(thread.tags ?? []).slice(0, 3).map((tag) => (
            <span
              key={tag}
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                isDarkMode ? 'bg-white/10' : 'bg-slate-100'
              }`}
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold leading-6 transition-colors group-hover:text-cyan-500">
          {thread.title}
        </h3>
        <p className="mt-1 text-sm leading-6 opacity-70 line-clamp-2">{thread.excerpt}</p>

        {/* Footer stats */}
        <div className="mt-3 flex flex-wrap items-center gap-4 text-xs opacity-60">
          <span className="font-medium opacity-100">{thread.author}</span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {formatCount(thread.views)}
          </span>
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {formatCount(thread.replies)} replies
          </span>
          <span className="ml-auto flex items-center gap-1 hover:opacity-100 cursor-pointer">
            <Share2 className="h-3.5 w-3.5" /> Share
          </span>
        </div>
      </button>
    </motion.div>
  );
}

// ── Sort tab bar ──────────────────────────────────────────────────────────────
function SortTabBar({ sortBy, onSort, isDarkMode }) {
  return (
    <div
      className={`flex items-center gap-1 rounded-2xl border p-1 ${
        isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
      }`}
    >
      {SORT_OPTIONS.map(({ key, label, icon: Icon }) => (
        <button
          key={key}
          onClick={() => onSort(key)}
          className={`flex items-center gap-1.5 rounded-xl px-4 py-1.5 text-sm font-semibold transition-all ${
            sortBy === key
              ? 'bg-cyan-500 text-white shadow'
              : isDarkMode
              ? 'opacity-60 hover:opacity-100 hover:bg-white/10'
              : 'opacity-60 hover:opacity-100 hover:bg-slate-100'
          }`}
        >
          <Icon className="h-4 w-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ── Main export ───────────────────────────────────────────────────────────────
export default function ThreadsView({
  isDarkMode,
  forum,
  subforum,
  onBackToForum,
  onBackToForums,
  onOpenThread,
  onCreateThread,
}) {
  const [sortBy, setSortBy] = useState('hot');
  // votes: { [threadId]: -1 | 0 | 1 }
  const [votes, setVotes] = useState({});

  const handleVote = (threadId, dir) => {
    setVotes((prev) => {
      const current = prev[threadId] ?? 0;
      const next = dir === 'up' ? (current === 1 ? 0 : 1) : current === -1 ? 0 : -1;
      return { ...prev, [threadId]: next };
    });
  };

  const sortedThreads = useMemo(
    () => sortThreads(subforum.threads, sortBy, votes),
    [subforum.threads, sortBy, votes],
  );

  // Pinned threads always float to top regardless of sort
  const pinned = sortedThreads.filter((t) => t.isPinned);
  const rest = sortedThreads.filter((t) => !t.isPinned);
  const displayed = [...pinned, ...rest];

  return (
    <div className="space-y-6">
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
        <span className="font-medium opacity-100">{subforum.name}</span>
      </div>

      {/* Subforum header */}
      <div
        className={`rounded-4xl border p-6 md:p-8 ${
          isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'
        }`}
      >
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="primary">{forum.name}</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">
              {subforum.name}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 opacity-75 md:text-base">
              {subforum.description}
            </p>
            <div className="mt-4 flex flex-wrap gap-3 text-xs opacity-60">
              <span>{formatCount(subforum.threadCount)} threads</span>
              <span>·</span>
              <span>{subforum.activeNow} active now</span>
            </div>
          </div>
          <Button variant="primary" onClick={onCreateThread} isDarkMode={isDarkMode}>
            Start a thread
          </Button>
        </div>
      </div>

      {/* Sort bar + thread list */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <SortTabBar sortBy={sortBy} onSort={setSortBy} isDarkMode={isDarkMode} />
        <p className="text-xs opacity-50">
          {displayed.length} thread{displayed.length !== 1 ? 's' : ''}
        </p>
      </div>

      {displayed.length > 0 ? (
        <AnimatePresence mode="popLayout">
          <div className="space-y-3">
            {displayed.map((thread) => (
              <ThreadRow
                key={thread.id}
                thread={thread}
                subforum={subforum}
                forum={forum}
                isDarkMode={isDarkMode}
                onVote={handleVote}
                onOpen={onOpenThread}
                userVote={votes[thread.id] ?? 0}
              />
            ))}
          </div>
        </AnimatePresence>
      ) : (
        <EmptyState
          isDarkMode={isDarkMode}
          icon={MessageSquare}
          title="No threads yet"
          description="Be the first to start a discussion in this board."
          action={
            <Button variant="primary" onClick={onCreateThread} isDarkMode={isDarkMode}>
              Create first thread
            </Button>
          }
        />
      )}
    </div>
  );
}
