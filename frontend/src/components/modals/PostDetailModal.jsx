import { AnimatePresence, motion } from 'motion/react';
import { MessageSquare, Share2, X, Clock3, Eye, Heart, Paperclip } from 'lucide-react';
import CommentForm from '../posts/CommentForm';
import CommentItem from '../posts/CommentItem';
import { Badge } from '../ui';

const numberFormatter = new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 });

const formatCount = (value) => numberFormatter.format(value ?? 0);

export default function PostDetailModal({ selectedThread, onClose, isDarkMode, onAddComment, onDeleteThread, currentUser }) {
  const canDeleteThread =
    Boolean(currentUser) &&
    Boolean(selectedThread) &&
    (currentUser.role === 'admin' || currentUser.id === selectedThread.authorId);

  return (
    <AnimatePresence>
      {selectedThread && (
        <div className="fixed inset-0 z-100 flex items-center justify-center overflow-y-auto bg-black/60 p-4 sm:p-6 md:p-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 20 }}
            className={`relative my-auto flex max-h-[calc(100dvh-2rem)] w-full max-w-5xl flex-col overflow-hidden rounded-4xl border sm:max-h-[calc(100dvh-3rem)] md:max-h-[calc(100dvh-5rem)] ${
              isDarkMode ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-900'
            }`}
          >
            <div className={`flex items-center justify-between border-b px-4 py-3 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2 text-xs opacity-70">
                  <span>{selectedThread.forumName}</span>
                  <span>•</span>
                  <span>{selectedThread.subforumName}</span>
                </div>
                <p className="mt-1 truncate text-sm font-semibold">{selectedThread.title}</p>
              </div>
              <button onClick={onClose} className="flex items-center gap-1 rounded-full px-3 py-1.5 text-xs font-semibold hover:bg-black/5 dark:hover:bg-white/10">
                <X className="h-4 w-4" /> Close
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 md:p-8">
              <div className="mx-auto max-w-3xl">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="primary">{selectedThread.forumName}</Badge>
                  <Badge variant="default">{selectedThread.subforumName}</Badge>
                  {selectedThread.isPinned && <Badge variant="warning">Pinned</Badge>}
                  {selectedThread.isSolved && <Badge variant="success">Solved</Badge>}
                </div>

                <h2 className="mt-4 text-2xl font-semibold tracking-tight md:text-3xl">{selectedThread.title}</h2>

                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm opacity-70">
                  <span className="font-medium opacity-100">{selectedThread.author}</span>
                  <span className="flex items-center gap-1">
                    <Clock3 className="h-4 w-4" /> {selectedThread.createdAt}
                  </span>
                  <span className="flex items-center gap-1">
                    <Eye className="h-4 w-4" /> {formatCount(selectedThread.views)} views
                  </span>
                  <span className="flex items-center gap-1">
                    <Heart className="h-4 w-4" /> {formatCount(selectedThread.likes)} likes
                  </span>
                </div>

                <div className={`mt-5 rounded-3xl border p-5 leading-7 ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                  <p className="whitespace-pre-wrap text-sm md:text-base">{selectedThread.content}</p>
                  {selectedThread.attachments?.length > 0 && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      {selectedThread.attachments.map((attachment) => (
                        <span key={attachment} className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ${isDarkMode ? 'bg-white/10' : 'bg-white'}`}>
                          <Paperclip className="h-3.5 w-3.5" /> {attachment}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4 text-sm opacity-75">
                  <span className="flex items-center gap-1">
                    <MessageSquare className="h-4 w-4" /> {formatCount(selectedThread.comments?.length || 0)} top-level replies
                  </span>
                  <span className="flex items-center gap-1">
                    <Share2 className="h-4 w-4" /> Share
                  </span>
                  {canDeleteThread && (
                    <button
                      type="button"
                      onClick={() => onDeleteThread?.(selectedThread.id)}
                      className="ml-auto rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700"
                    >
                      Delete thread
                    </button>
                  )}
                </div>

                <div className={`mt-8 border-t pt-6 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
                  <CommentForm onAdd={(content) => onAddComment(selectedThread.id, content)} isDarkMode={isDarkMode} placeholder="Add a reply to this thread" />

                  <div className="mt-8 space-y-6">
                    {(selectedThread.comments || []).map((comment) => (
                      <CommentItem
                        key={comment.id}
                        comment={comment}
                        onReply={(content, parentId) => onAddComment(selectedThread.id, content, parentId)}
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