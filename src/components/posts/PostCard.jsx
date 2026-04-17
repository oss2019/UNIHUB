import { motion } from 'motion/react';
import { ArrowBigDown, ArrowBigUp, MessageSquare, MoreHorizontal, Share2, Zap, TrendingUp } from 'lucide-react';
import { Badge } from '../ui';

export default function PostCard({ post, onVote, onOpen, isDarkMode, categories }) {
  const postCategory = categories.find((category) => category.id === post.category);
  const isTrending = post.votes > 500;

  return (
    <motion.div
      layout
      className={`group flex cursor-pointer rounded-3xl border transition-colors ${isDarkMode ? 'border-white/10 bg-slate-950 hover:border-white/20' : 'border-slate-200 bg-white hover:border-slate-300'}`}
    >
      {/* Vote column */}
      <div className={`w-10 flex flex-col items-center gap-1 py-2 ${isDarkMode ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onVote(post.id, 'up');
          }}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-reddit-border-dark transition-colors ${post.userVote === 'up' ? 'text-reddit-orange' : 'text-gray-500'}`}
        >
          <ArrowBigUp className={`w-7 h-7 ${post.userVote === 'up' ? 'fill-current' : ''}`} />
        </button>
        <span className={`text-xs font-bold ${post.userVote === 'up' ? 'text-reddit-orange' : post.userVote === 'down' ? 'text-reddit-blue' : ''}`}>
          {post.votes >= 1000 ? `${(post.votes / 1000).toFixed(1)}k` : post.votes}
        </span>
        <button
          onClick={(event) => {
            event.stopPropagation();
            onVote(post.id, 'down');
          }}
          className={`p-1 rounded hover:bg-gray-200 dark:hover:bg-reddit-border-dark transition-colors ${post.userVote === 'down' ? 'text-reddit-blue' : 'text-gray-500'}`}
        >
          <ArrowBigDown className={`w-7 h-7 ${post.userVote === 'down' ? 'fill-current' : ''}`} />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 p-3" onClick={onOpen}>
        {/* Metadata row */}
        <div className="flex items-center gap-2 mb-2 text-xs flex-wrap">
          <Badge variant="primary" size="xs">
            {postCategory?.icon} {postCategory?.name || post.category}
          </Badge>
          <span className="opacity-60">by</span>
          <span className="font-bold hover:text-reddit-blue transition-colors">{post.author}</span>
          <Badge variant={post.authorRole === 'alumni' ? 'alumni' : 'student'} size="xs">
            {post.authorRole === 'alumni' ? '👨‍🎓' : '📚'} {post.authorRole}
          </Badge>
          {isTrending && (
            <Badge variant="warning" size="xs" className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Trending
            </Badge>
          )}
          {post.isWorkRequest && <Badge variant="warning" size="xs">🤝 Work Request</Badge>}
          {post.pingAlumni && (
            <Badge variant="danger" size="xs" className="flex items-center gap-1">
              <Zap className="w-3 h-3" /> Alumni Pinged
            </Badge>
          )}
          <span className="opacity-50 ml-auto">{post.timestamp}</span>
        </div>

        {/* Title */}
        <h2 className="text-lg font-semibold mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
          {post.title}
        </h2>

        {/* Content preview */}
        {post.content && <p className="text-sm opacity-75 line-clamp-2 mb-3" title={post.content}>{post.content}</p>}

        {/* Image */}
        {post.imageUrl && (
          <div className="rounded overflow-hidden mb-3 max-h-[256px] bg-black/5">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}

        {/* Actions footer */}
        <div className="flex items-center gap-0 text-xs font-semibold opacity-60">
          <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-reddit-border-dark hover:opacity-100 transition-all">
            <MessageSquare className="w-4 h-4" />
            {post.commentCount} {post.commentCount === 1 ? 'Comment' : 'Comments'}
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-reddit-border-dark hover:opacity-100 transition-all">
            <Share2 className="w-4 h-4" /> Share
          </div>
          <div className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-100 dark:hover:bg-reddit-border-dark hover:opacity-100 transition-all ml-auto">
            <MoreHorizontal className="w-4 h-4" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}