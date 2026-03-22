import { useState } from 'react';
import { ArrowBigDown, ArrowBigUp, MessageSquare } from 'lucide-react';
import CommentForm from './CommentForm';

export default function CommentItem({ comment, onReply, isDarkMode }) {
  const [isReplying, setIsReplying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="relative">
      <div className="flex gap-2">
        <div className="flex flex-col items-center">
          <div className="w-7 h-7 bg-gray-300 rounded-full flex items-center justify-center text-xs font-bold text-gray-600">
            {comment.author[0].toUpperCase()}
          </div>
          {isExpanded && comment.replies.length > 0 && (
            <div
              className="flex-1 w-0.5 bg-gray-200 dark:bg-reddit-border-dark my-1 cursor-pointer hover:bg-reddit-blue"
              onClick={() => setIsExpanded(false)}
            />
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center gap-2 text-xs mb-1">
            <span className="font-bold">{comment.author}</span>
            <span className="opacity-50">{comment.timestamp}</span>
            {!isExpanded && (
              <button onClick={() => setIsExpanded(true)} className="text-reddit-blue font-bold">
                [+] expand
              </button>
            )}
          </div>

          {isExpanded && (
            <>
              <p className="text-sm mb-2">{comment.content}</p>

              <div className="flex items-center gap-4 text-xs font-bold opacity-60 mb-3">
                <div className="flex items-center gap-1">
                  <ArrowBigUp className="w-5 h-5 hover:text-reddit-orange cursor-pointer" />
                  <span>{comment.votes}</span>
                  <ArrowBigDown className="w-5 h-5 hover:text-reddit-blue cursor-pointer" />
                </div>
                <button
                  onClick={() => setIsReplying(!isReplying)}
                  className="flex items-center gap-1 hover:bg-gray-100 dark:hover:bg-reddit-border-dark p-1 rounded"
                >
                  <MessageSquare className="w-4 h-4" /> Reply
                </button>
                <button className="hover:bg-gray-100 dark:hover:bg-reddit-border-dark p-1 rounded">Share</button>
              </div>

              {isReplying && (
                <div className="mb-4">
                  <CommentForm
                    placeholder={`Reply to u/${comment.author}`}
                    onAdd={(content) => {
                      onReply(content, comment.id);
                      setIsReplying(false);
                    }}
                    isDarkMode={isDarkMode}
                  />
                </div>
              )}

              {comment.replies.length > 0 && (
                <div className="space-y-6 mt-4 border-l-2 pl-4 dark:border-reddit-border-dark">
                  {comment.replies.map((reply) => (
                    <CommentItem key={reply.id} comment={reply} onReply={onReply} isDarkMode={isDarkMode} />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
