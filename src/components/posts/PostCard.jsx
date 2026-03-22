import { motion } from 'motion/react';
import { ArrowBigDown, ArrowBigUp, MessageSquare, MoreHorizontal, Share2, Zap } from 'lucide-react';

export default function PostCard({ post, onVote, onOpen, isDarkMode, categories }) {
  return (
    <motion.div
      layout
      className={`flex rounded border cursor-pointer group transition-colors ${isDarkMode ? 'bg-reddit-card-dark border-reddit-border-dark hover:border-gray-500' : 'bg-white border-gray-300 hover:border-gray-400'}`}
    >
      <div className={`w-10 flex flex-col items-center py-2 gap-1 ${isDarkMode ? 'bg-[#151516]' : 'bg-gray-50'}`}>
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

      <div className="flex-1 p-2" onClick={onOpen}>
        <div className="flex items-center gap-2 mb-2 text-xs flex-wrap">
          <span className="font-bold hover:underline">{categories.find((category) => category.id === post.category)?.name || post.category}</span>
          <span className="opacity-50">• Posted by u/{post.author}</span>
          <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${post.authorRole === 'alumni' ? 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'}`}>
            {post.authorRole}
          </span>
          <span className="opacity-50">{post.timestamp}</span>
          {post.isWorkRequest && (
            <span className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase">
              Work Request
            </span>
          )}
          {post.pingAlumni && (
            <span className="bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 px-1.5 py-0.5 rounded text-[10px] font-bold uppercase flex items-center gap-1">
              <Zap className="w-3 h-3" /> Alumni Pinged
            </span>
          )}
        </div>
        <h2 className="text-lg font-medium mb-2 group-hover:text-reddit-blue transition-colors">{post.title}</h2>

        {post.content && <p className="text-sm opacity-80 line-clamp-3 mb-3">{post.content}</p>}

        {post.imageUrl && (
          <div className="rounded overflow-hidden mb-3 max-h-[512px] bg-black/5">
            <img src={post.imageUrl} alt={post.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
          </div>
        )}

        <div className="flex items-center gap-1 text-xs font-bold opacity-60">
          <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-reddit-border-dark">
            <MessageSquare className="w-5 h-5" /> {post.commentCount} Comments
          </div>
          <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-reddit-border-dark">
            <Share2 className="w-5 h-5" /> Share
          </div>
          <div className="flex items-center gap-2 p-2 rounded hover:bg-gray-100 dark:hover:bg-reddit-border-dark">
            <MoreHorizontal className="w-5 h-5" />
          </div>
        </div>
      </div>
    </motion.div>
  );
}