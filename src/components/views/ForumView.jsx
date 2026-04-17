import { motion } from 'motion/react';
import {
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  FolderKanban,
  Layers3,
  MessageSquare,
  Search,
  Users,
} from 'lucide-react';
import { Badge, Button, Card } from '../ui';
import EmptyState from '../common/EmptyState';

const numberFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

const formatCount = (value) => numberFormatter.format(value ?? 0);

const forumAccentClasses = ['bg-cyan-500', 'bg-sky-500', 'bg-emerald-500', 'bg-amber-500'];

const getForumAccent = (forum, index = 0) => forumAccentClasses[index % forumAccentClasses.length];

function ForumCard({ forum, isDarkMode, onOpenForum, accentClass = 'bg-cyan-500' }) {
  return (
    <motion.button
      layout
      type="button"
      onClick={() => onOpenForum(forum.id)}
      whileHover={{ y: -4 }}
      className={`group flex h-full flex-col rounded-3xl border p-5 text-left transition-all ${
        isDarkMode
          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
          : 'border-slate-200 bg-white/80 hover:border-slate-300 hover:bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${accentClass} text-2xl text-white`}>
            {forum.icon}
          </div>
          <h3 className="text-lg font-semibold">{forum.name}</h3>
          <p className="mt-2 text-sm leading-6 opacity-70">{forum.description}</p>
        </div>
        <ArrowRight className="mt-1 h-5 w-5 opacity-40 transition-transform group-hover:translate-x-1 group-hover:opacity-100" />
      </div>

      <div className="mt-5 grid grid-cols-3 gap-3 text-xs">
        <div className={`rounded-2xl px-3 py-3 ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-1.5 opacity-60">
            <Users className="h-3.5 w-3.5" /> Members
          </div>
          <div className="mt-1 text-sm font-semibold">{formatCount(forum.members)}</div>
        </div>
        <div className={`rounded-2xl px-3 py-3 ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-1.5 opacity-60">
            <Layers3 className="h-3.5 w-3.5" /> Boards
          </div>
          <div className="mt-1 text-sm font-semibold">{forum.subforumCount}</div>
        </div>
        <div className={`rounded-2xl px-3 py-3 ${isDarkMode ? 'bg-black/20' : 'bg-slate-50'}`}>
          <div className="flex items-center gap-1.5 opacity-60">
            <MessageSquare className="h-3.5 w-3.5" /> Threads
          </div>
          <div className="mt-1 text-sm font-semibold">{formatCount(forum.threadCount)}</div>
        </div>
      </div>
    </motion.button>
  );
}

function SubforumCard({ forum, subforum, isDarkMode, onOpenSubforum }) {
  const latestThread = subforum.threads[0];

  return (
    <motion.button
      layout
      type="button"
      onClick={() => onOpenSubforum(forum.id, subforum.id)}
      whileHover={{ y: -3 }}
      className={`group flex h-full flex-col rounded-3xl border p-4 text-left transition-all ${
        isDarkMode
          ? 'border-white/10 bg-white/5 hover:border-cyan-400/40 hover:bg-white/8'
          : 'border-slate-200 bg-white/85 hover:border-slate-300 hover:bg-white'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <Badge variant="primary" size="xs">
            {formatCount(subforum.threadCount)} threads
          </Badge>
          <h4 className="mt-3 text-base font-semibold">{subforum.name}</h4>
          <p className="mt-2 text-sm leading-6 opacity-70">{subforum.description}</p>
        </div>
        <ChevronRight className="h-5 w-5 opacity-30 transition-transform group-hover:translate-x-1 group-hover:opacity-90" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {(subforum.tags || []).slice(0, 3).map((tag) => (
          <span key={tag} className={`rounded-full px-3 py-1 text-xs font-medium ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
            {tag}
          </span>
        ))}
      </div>
    </motion.button>
  );
}

function ThreadCard({ forum, subforum, thread, isDarkMode, onOpenThread }) {
  return (
    <motion.button
      layout
      type="button"
      onClick={() => onOpenThread({ forumId: forum.id, subforumId: subforum.id, threadId: thread.id })}
      whileHover={{ y: -2 }}
      className={`group w-full rounded-3xl border p-4 text-left transition-all ${
        isDarkMode
          ? 'border-white/10 bg-white/5 hover:border-white/20 hover:bg-white/8'
          : 'border-slate-200 bg-white hover:border-slate-300'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
            <span>{forum.name}</span>
            <ChevronRight className="h-3 w-3" />
            <span>{subforum.name}</span>
          </div>
          <h4 className="mt-2 text-base font-semibold leading-6 transition-colors group-hover:text-cyan-500">{thread.title}</h4>
          <p className="mt-2 text-sm leading-6 opacity-70">{thread.excerpt}</p>
        </div>
        <div className="rounded-2xl px-3 py-2 text-right text-xs">
          <div className="font-semibold">{formatCount(thread.likes)} likes</div>
          <div className="mt-1 opacity-60">{formatCount(thread.replies)} replies</div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        {thread.isPinned && <Badge variant="warning" size="xs">Pinned</Badge>}
        {thread.isSolved && <Badge variant="success" size="xs">Solved</Badge>}
        {(thread.tags || []).slice(0, 3).map((tag) => (
          <span key={tag} className={`rounded-full px-3 py-1 text-xs font-medium ${isDarkMode ? 'bg-white/10' : 'bg-slate-100'}`}>
            {tag}
          </span>
        ))}
        <span className="ml-auto text-xs opacity-50">{thread.createdAt}</span>
      </div>
    </motion.button>
  );
}

function SectionHeader({ eyebrow, title, description, actions }) {
  return (
    <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.28em] opacity-50">{eyebrow}</p>
        <h2 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">{title}</h2>
        <p className="mt-2 max-w-3xl text-sm leading-7 opacity-70">{description}</p>
      </div>
      {actions}
    </div>
  );
}

export default function ForumView({
  isDarkMode,
  forums,
  selectedForum,
  selectedSubforum,
  searchQuery,
  searchResults,
  topForums,
  communityStats,
  currentUser,
  onOpenForum,
  onOpenSubforum,
  onOpenThread,
  onBackToForums,
  onCreateThread,
}) {
  const hasSearch = Boolean(searchQuery?.trim());
  const forumThreads = selectedForum
    ? selectedForum.subforums.flatMap((subforum) => subforum.threads.map((thread) => ({ thread, subforum })))
    : [];

  if (hasSearch) {
    const { matchedForums, matchedSubforums, matchedThreads } = searchResults;

    return (
      <div className="space-y-6">
        <Card isDarkMode={isDarkMode} className={`overflow-hidden rounded-4xl border ${isDarkMode ? 'border-white/10 bg-slate-950/80' : 'border-slate-200 bg-white/95'}`}>
          <div className="px-6 py-8">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-500">Search</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Results for “{searchQuery}”</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 opacity-70">Search works across forums, subforums, and threads so people can move from broad topics to exact discussions quickly.</p>
          </div>
        </Card>

        {matchedForums.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Forums"
              title="Matching communities"
              description="These boards match the search term at the top level."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {matchedForums.map((forum, index) => (
                <ForumCard key={forum.id} forum={forum} isDarkMode={isDarkMode} onOpenForum={onOpenForum} accentClass={getForumAccent(forum, index)} />
              ))}
            </div>
          </section>
        )}

        {matchedSubforums.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Boards"
              title="Matching subforums"
              description="These subforums match either the board name, tags, or description."
            />
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {matchedSubforums.map((subforum) => (
                <SubforumCard
                  key={`${subforum.forumId}-${subforum.id}`}
                  forum={forums.find((forum) => forum.id === subforum.forumId)}
                  subforum={subforum}
                  isDarkMode={isDarkMode}
                  onOpenSubforum={onOpenSubforum}
                />
              ))}
            </div>
          </section>
        )}

        {matchedThreads.length > 0 && (
          <section>
            <SectionHeader
              eyebrow="Threads"
              title="Matching conversations"
              description="Threads are shown with their parent board and subforum so users can jump back into context."
            />
            <div className="space-y-3">
              {matchedThreads.map((thread) => (
                <ThreadCard
                  key={thread.id}
                  forum={forums.find((forum) => forum.id === thread.forumId)}
                  subforum={forums
                    .find((forum) => forum.id === thread.forumId)
                    ?.subforums.find((subforum) => subforum.id === thread.subforumId)}
                  thread={thread}
                  isDarkMode={isDarkMode}
                  onOpenThread={onOpenThread}
                />
              ))}
            </div>
          </section>
        )}

        {matchedForums.length === 0 && matchedSubforums.length === 0 && matchedThreads.length === 0 && (
          <EmptyState
            isDarkMode={isDarkMode}
            icon={Search}
            title="Nothing matched that search"
            description="Try a forum name, a topic like DSA or referrals, or a thread keyword."
          />
        )}
      </div>
    );
  }

  if (!selectedForum) {
    return (
      <div className="space-y-7">
        <Card
          isDarkMode={isDarkMode}
          className={`rounded-3xl border p-5 md:p-6 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.28em] text-cyan-500">Home</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Browse communities and start conversations</h1>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary" onClick={onCreateThread} isDarkMode={isDarkMode}>
                Add thread
              </Button>
            </div>
          </div>
        </Card>

        <section>
          <SectionHeader
            eyebrow="Featured forums"
            title="Top communities"
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {topForums.map((forum, index) => (
              <ForumCard key={forum.id} forum={forum} isDarkMode={isDarkMode} onOpenForum={onOpenForum} accentClass={getForumAccent(forum, index)} />
            ))}
          </div>
        </section>
      </div>
    );
  }

  if (!selectedSubforum) {
    return (
      <div className="space-y-8">
        <div className="flex flex-wrap items-center gap-2 text-sm opacity-70">
          <button onClick={onBackToForums} className="font-medium hover:opacity-100">
            Home
          </button>
          <ChevronRight className="h-4 w-4" />
          <span className="font-medium opacity-100">{selectedForum.name}</span>
        </div>

        <Card isDarkMode={isDarkMode} className={`rounded-4xl border p-6 md:p-8 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500 text-3xl text-white">{selectedForum.icon}</div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{selectedForum.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 opacity-75 md:text-base">{selectedForum.description}</p>
            </div>
            
          </div>
        </Card>

        <section>
          <SectionHeader
            eyebrow="Boards"
            title="Subforums inside this community"
            actions={<Button variant="primary" onClick={onCreateThread} isDarkMode={isDarkMode}>Start thread here</Button>}
          />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-2">
            {selectedForum.subforums.map((subforum) => (
              <SubforumCard
                key={subforum.id}
                forum={selectedForum}
                subforum={subforum}
                isDarkMode={isDarkMode}
                onOpenSubforum={onOpenSubforum}
              />
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 text-sm opacity-70">
        <button onClick={onBackToForums} className="font-medium hover:opacity-100">
          Home
        </button>
        <ChevronRight className="h-4 w-4" />
        <button onClick={() => onOpenForum(selectedForum.id)} className="font-medium hover:opacity-100">
          {selectedForum.name}
        </button>
        <ChevronRight className="h-4 w-4" />
        <span className="font-medium opacity-100">{selectedSubforum.name}</span>
      </div>

      <Card isDarkMode={isDarkMode} className={`rounded-4xl border p-6 md:p-8 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-white'}`}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <Badge variant="primary">{selectedForum.name}</Badge>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight md:text-4xl">{selectedSubforum.name}</h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 opacity-75 md:text-base">{selectedSubforum.description}</p>
            
          </div>
          <Button variant="primary" onClick={onCreateThread} isDarkMode={isDarkMode}>
            Start a thread
          </Button>
        </div>
      </Card>

      <section>
        <SectionHeader
          eyebrow="Threads"
          title="Discussion threads"
        />

        {forumThreads.length > 0 ? (
          <div className="space-y-3">
            {forumThreads.map(({ thread, subforum }) => (
              <ThreadCard
                key={thread.id}
                forum={selectedForum}
                subforum={subforum}
                thread={thread}
                isDarkMode={isDarkMode}
                onOpenThread={onOpenThread}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            isDarkMode={isDarkMode}
            icon={FolderKanban}
            title="No threads here yet"
            description="Start the first discussion in this board to seed the subforum."
            action={<Button variant="primary" onClick={onCreateThread} isDarkMode={isDarkMode}>Create first thread</Button>}
          />
        )}
      </section>
    </div>
  );
}
