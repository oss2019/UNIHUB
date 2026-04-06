import { useState } from 'react';
import { ArrowBigDown, ArrowBigUp, MessageSquare, ChevronDown } from 'lucide-react';
import CommentForm from './CommentForm';

const MAX_DEPTH = 5;

export default function CommentItem({ comment, onReply, isDarkMode, depth = 0 }) {
  const [isReplying, setIsReplying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);
  const isMaxDepth = depth >= MAX_DEPTH;
  const hasReplies = comment.replies && comment.replies.length > 0;

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* Avatar and threading line */}
        <div className="flex flex-col items-center">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-cyan-500 text-xs font-bold text-white shadow-sm">
            {comment.author[0].toUpperCase()}
          </div>
          {isExpanded && hasReplies && (
            <div
              className="flex-1 w-0.5 bg-gray-300 dark:bg-reddit-border-dark my-1 cursor-pointer hover:bg-reddit-blue transition-colors"
              onClick={() => setIsExpanded(false)}
            />
          )}
        </div>

        {/* Comment content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs mb-1 flex-wrap">
            <span className="font-bold">{comment.author}</span>
            <span className="opacity-50 text-xs">{comment.timestamp}</span>
            {!isExpanded && hasReplies && (
              <button onClick={() => setIsExpanded(true)} className="text-reddit-blue font-bold text-xs">
                [+] {comment.replies.length} more
              </button>
            )}
          </div>

          {isExpanded && (
            <>
              <p className="mb-2 text-sm wrap-break-word">{comment.content}</p>

              {/* Actions */}
              <div className="flex items-center gap-3 text-xs font-bold opacity-60 mb-3 flex-wrap">
                <div className="flex items-center gap-1">
                  <ArrowBigUp className="w-4 h-4 hover:text-reddit-orange cursor-pointer transition-colors" />
                  <span>{comment.votes}</span>
                  <ArrowBigDown className="w-4 h-4 hover:text-reddit-blue cursor-pointer transition-colors" />
                </div>
                {!isMaxDepth && (
                  <button
                    onClick={() => setIsReplying(!isReplying)}
                    className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-reddit-border-dark px-2 py-1 rounded transition-colors"
                  >
                    <MessageSquare className="w-4 h-4" /> Reply
                  </button>
                )}
                <button className="hover:bg-gray-100 dark:hover:bg-reddit-border-dark px-2 py-1 rounded transition-colors">Share</button>
              </div>

              {/* Reply form */}
              {isReplying && !isMaxDepth && (
                <div className="mb-4">
                  <CommentForm
                    placeholder={`Reply to ${comment.author}`}
                    onAdd={(content) => {
                      onReply(content, comment.id);
                      setIsReplying(false);
                    }}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {/* Max depth reached indicator */}
              {isMaxDepth && hasReplies && (
                <div className="mb-4 p-2 bg-gray-100 dark:bg-reddit-border-dark rounded text-xs opacity-70 flex items-center gap-2">
                  <ChevronDown className="w-3 h-3" />
                  <span>{comment.replies.length} replies (max depth reached)</span>
                </div>
              )}

              {/* Nested replies */}
              {hasReplies && isExpanded && (
                <div className={`space-y-4 mt-4 border-l-2 pl-2 md:pl-4 dark:border-reddit-border-dark`}>
                  {isMaxDepth ? (
                    // Show collapsed view at max depth
                    <div className="text-xs opacity-70 py-2">
                      <button className="text-reddit-blue font-bold hover:underline">View {comment.replies.length} replies</button>
                    </div>
                  ) : (
                    // Recursively render replies
                    comment.replies.map((reply) => (
                      <CommentItem key={reply.id} comment={reply} onReply={onReply} isDarkMode={isDarkMode} depth={depth + 1} />
                    ))
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
