import { useState } from "react";
import { Reply, Paperclip } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { Comment } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { commentApi } from "@/lib/api";
import { qk } from "@/lib/queries";
import { toast } from "sonner";

export function CommentItem({ comment, depth = 0 }: { comment: Comment; depth?: number }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const qc = useQueryClient();

  const replyMut = useMutation({
    mutationFn: () =>
      commentApi.create(comment.thread, {
        content: text.trim(),
        parentCommentId: comment._id,
        attachment: file,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.comments(comment.thread) });
      qc.invalidateQueries({ queryKey: qk.thread(comment.thread) });
      setText("");
      setFile(null);
      setReplyOpen(false);
      toast.success("Reply posted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const submit = () => {
    if (!text.trim()) return;
    replyMut.mutate();
  };

  const cap = depth >= 4;
  const isImage = comment.attachments && /\.(png|jpe?g|gif|webp)(\?|$)/i.test(comment.attachments);

  return (
    <div className={`relative ${depth > 0 ? "pl-4 border-l-2 border-border ml-2" : ""}`}>
      <div className="flex gap-3 py-3">
        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold overflow-hidden">
          {comment.author?.avatar ? (
            <img src={comment.author.avatar} alt={comment.author.name} className="h-full w-full object-cover" />
          ) : (
            (comment.author?.name?.charAt(0) ?? "?").toUpperCase()
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
            <span className="font-semibold text-foreground">{comment.author?.name ?? "Unknown"}</span>
            <span>·</span>
            <span>{timeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-sm text-foreground/90 whitespace-pre-wrap">{comment.content}</p>
          {comment.attachments && (
            <div className="mt-2">
              {isImage ? (
                <a href={comment.attachments} target="_blank" rel="noreferrer">
                  <img
                    src={comment.attachments}
                    alt="attachment"
                    className="max-h-64 rounded-lg border border-border"
                  />
                </a>
              ) : (
                <a
                  href={comment.attachments}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <Paperclip className="h-3.5 w-3.5" /> View attachment
                </a>
              )}
            </div>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
            {!cap && (
              <button
                onClick={() => setReplyOpen((v) => !v)}
                className="inline-flex items-center gap-1 hover:text-primary"
              >
                <Reply className="h-3.5 w-3.5" /> Reply
              </button>
            )}
          </div>
          {replyOpen && (
            <div className="mt-3 flex flex-col gap-2">
              <input
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Write a reply…"
                autoFocus
                className="h-9 px-3 rounded-lg bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && submit()}
              />
              <div className="flex items-center gap-2">
                <label className="inline-flex items-center gap-1 text-xs text-muted-foreground cursor-pointer hover:text-primary">
                  <Paperclip className="h-3.5 w-3.5" />
                  {file ? file.name : "Attach"}
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    className="hidden"
                    onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                  />
                </label>
                <button
                  onClick={submit}
                  disabled={replyMut.isPending}
                  className="ml-auto px-3 h-9 rounded-lg bg-primary text-primary-foreground text-sm font-medium disabled:opacity-50"
                >
                  {replyMut.isPending ? "Posting…" : "Post"}
                </button>
              </div>
            </div>
          )}
          {comment.replies && comment.replies.length > 0 && (
            <div className="mt-2">
              {comment.replies.map((r) => (
                <CommentItem key={r._id} comment={r} depth={depth + 1} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
