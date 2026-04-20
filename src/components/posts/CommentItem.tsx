import { useState } from "react";
import { ArrowBigUp, ArrowBigDown, Reply } from "lucide-react";
import type { Comment } from "@/lib/mockData";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";

export function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [text, setText] = useState("");
  const addComment = useStore((s) => s.addComment);

  const submit = () => {
    if (!text.trim()) return;
    addComment(comment.threadId, text.trim(), comment.id);
    setText(""); setReplyOpen(false);
  };

  const cap = depth >= 4;

  return (
    <div className={`relative ${depth > 0 ? "pl-4 border-l-2 border-border ml-2" : ""}`}>
      <div className="flex gap-3 py-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold">
          {comment.authorName.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-semibold text-foreground">{comment.authorName}</span>
            <span>·</span>
            <span>{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <button className="hover:text-primary"><ArrowBigUp className="h-4 w-4" /></button>
              <span className="font-semibold text-foreground">{comment.votes}</span>
              <button className="hover:text-destructive"><ArrowBigDown className="h-4 w-4" /></button>
            </span>
            {!cap && (
              <button onClick={() => setReplyOpen((v) => !v)} className="inline-flex items-center gap-1 hover:text-primary">
                <Reply className="h-3.5 w-3.5" /> Reply
              </button>
            )}
          </div>
          {replyOpen && (
            <div className="mt-3 flex gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a reply…"
                autoFocus
                className="flex-1 h-9 px-3 rounded-lg bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => e.key === "Enter" && submit()}
              />
              <button onClick={submit} className="px-3 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium">
                Post
              </button>
            </div>
          )}
          {comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((r) => <CommentItem key={r.id} comment={r} depth={depth + 1} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
