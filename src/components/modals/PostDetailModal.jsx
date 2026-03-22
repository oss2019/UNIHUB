import { AnimatePresence, motion } from 'motion/react';
import { ArrowBigDown, ArrowBigUp, MessageSquare, Share2, X } from 'lucide-react';
import CommentForm from '../posts/CommentForm';
import CommentItem from '../posts/CommentItem';

export default function PostDetailModal({ selectedPost, onClose, isDarkMode, onAddComment, categories }) {
  return (
    <AnimatePresence>
      {selectedPost && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4 md:p-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`relative w-full max-w-5xl h-full flex flex-col rounded-lg overflow-hidden ${isDarkMode ? 'bg-reddit-card-dark border border-reddit-border-dark' : 'bg-white'}`}
          >
            <div className={`flex items-center justify-between px-4 py-2 border-b ${isDarkMode ? 'bg-[#1a1a1b] border-reddit-border-dark' : 'bg-black text-white'}`}>
              <div className="flex items-center gap-4 min-w-0">
                <div className="flex items-center gap-1">
                  <ArrowBigUp className="w-5 h-5" />
                  <span className="text-xs font-bold">{selectedPost.votes}</span>
                  <ArrowBigDown className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold truncate">{selectedPost.title}</span>
              </div>
              <button onClick={onClose} className="flex items-center gap-1 text-xs font-bold hover:bg-white/10 px-2 py-1 rounded">
                <X className="w-4 h-4" /> Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="max-w-3xl mx-auto">
                <div className="flex items-center gap-2 mb-2 text-xs">
                  <span className="font-bold">r/{categories.find((category) => category.id === selectedPost.category)?.name || selectedPost.category}</span>
                  <span className="opacity-50">• Posted by u/{selectedPost.author} {selectedPost.timestamp}</span>
                </div>
                <h2 className="text-xl font-bold mb-4">{selectedPost.title}</h2>

                {selectedPost.content && <p className="text-sm leading-relaxed mb-6 whitespace-pre-wrap">{selectedPost.content}</p>}

                {selectedPost.imageUrl && (
                  <img src={selectedPost.imageUrl} alt={selectedPost.title} className="w-full rounded-lg mb-6 max-h-[600px] object-contain bg-black/5" referrerPolicy="no-referrer" />
                )}

                <div className="flex items-center gap-4 mb-8 text-sm font-bold opacity-60">
                  <div className="flex items-center gap-1">
                    <MessageSquare className="w-5 h-5" /> {selectedPost.commentCount} Comments
                  </div>
                  <div className="flex items-center gap-1">
                    <Share2 className="w-5 h-5" /> Share
                  </div>
                </div>

                <div className="border-t pt-6 dark:border-reddit-border-dark">
                  <CommentForm onAdd={(content) => onAddComment(selectedPost.id, content)} isDarkMode={isDarkMode} />

                  <div className="mt-8 space-y-6">
                    {selectedPost.comments.map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={(content, parentId) => onAddComment(selectedPost.id, content, parentId)}
                        isDarkMode={isDarkMode}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}