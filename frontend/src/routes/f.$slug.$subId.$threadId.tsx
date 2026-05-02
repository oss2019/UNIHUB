import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ChevronRight,
  MessageCircle,
  Tag,
  Bookmark,
  Share2,
  Pin,
  Trash2,
  Paperclip,
} from "lucide-react";
import { CommentItem } from "@/components/posts/CommentItem";
import { Button } from "@/components/ui/button";
import { compact, timeAgo } from "@/lib/format";
import { commentsQuery, meQuery, threadQuery, qk } from "@/lib/queries";
import { commentApi, threadApi } from "@/lib/api";
import { useUI } from "@/lib/uiStore";
import { toast } from "sonner";

export const Route = createFileRoute("/f/$slug/$subId/$threadId")({
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(threadQuery(params.threadId));
    context.queryClient.prefetchQuery(commentsQuery(params.threadId));
  },
  component: ThreadPage,
  head: () => ({ meta: [{ title: "Thread — PeerHive" }] }),
});

function ThreadPage() {
  const { slug, subId, threadId } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { setAuthOpen } = useUI();
  const { data: user } = useQuery(meQuery());
  const { data: thread, isLoading, error } = useQuery(threadQuery(threadId));
  const { data: comments = [] } = useQuery(commentsQuery(threadId));

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const commentMut = useMutation({
    mutationFn: () =>
      commentApi.create(threadId, {
        content: text.trim(),
        parentCommentId: null,
        attachment: file,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.comments(threadId) });
      qc.invalidateQueries({ queryKey: qk.thread(threadId) });
      setText("");
      setFile(null);
      toast.success("Comment posted");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteThreadMut = useMutation({
    mutationFn: () => threadApi.remove(threadId),
    onSuccess: () => {
      toast.success("Thread deleted");
      qc.invalidateQueries({ queryKey: qk.threadsBySubforum(subId) });
      navigate({ to: "/f/$slug/$subId", params: { slug, subId } });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-3xl">
        <div className="h-48 rounded-2xl bg-card border border-border animate-pulse" />
        <div className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
      </div>
    );
  }
  if (error || !thread) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        Couldn't load this thread. {(error as Error)?.message}
      </div>
    );
  }

  const submit = () => {
    if (!user) return setAuthOpen(true);
    if (!text.trim()) return;
    commentMut.mutate();
  };

  const canDelete = user && (user.role === "admin" || user._id === thread.author?._id);

  return (
    <div className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/f/$slug" params={{ slug }} className="hover:text-foreground">Forum</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/f/$slug/$subId" params={{ slug, subId }} className="hover:text-foreground">Subforum</Link>
      </nav>

      <article className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
          {thread.isPinned && (
            <span className="inline-flex items-center gap-1 text-warning">
              <Pin className="h-3 w-3" /> Pinned
            </span>
          )}
          {/* <div className="grid h-7 w-7 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold overflow-hidden">
            {thread.author?.avatar ? (
              <img src={thread.author.avatar} alt="" className="h-full w-full object-cover" />
            ) : (
              (thread.author?.name?.charAt(0) ?? "?").toUpperCase()
            )}
          </div> */}
          <span className="font-medium text-foreground">{thread.author?.name ?? "Unknown"}</span>
          <span>·</span>
          <span>{timeAgo(thread.createdAt)}</span>
          {canDelete && (
            <button
              onClick={() => {
                if (confirm("Delete this thread?")) deleteThreadMut.mutate();
              }}
              className="ml-auto inline-flex items-center gap-1 text-destructive hover:underline text-xs"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          )}
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{thread.title}</h1>
        <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{thread.content}</p>
        </div>
        {thread.attachments?.length > 0 && (
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
            {thread.attachments.map((a, i) => (
              <a key={i} href={a} target="_blank" rel="noreferrer" className="block">
                <img src={a} alt={`attachment ${i + 1}`} className="rounded-lg border border-border" />
              </a>
            ))}
          </div>
        )}
        {thread.warnings?.length ? (
          <div className="mt-4 rounded-lg bg-warning/10 border border-warning/30 p-3 text-xs text-warning">
            {thread.warnings.join(" · ")}
          </div>
        ) : null}
        {thread.tags.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {thread.tags.map((t) => (
              <span
                key={t}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary"
              >
                <Tag className="h-3 w-3" /> {t}
              </span>
            ))}
          </div>
        )}
        <div className="mt-5 pt-4 border-t border-border flex items-center gap-4 text-sm text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-4 w-4" /> {compact(thread.commentCount)}
          </span>
          <button className="ml-auto inline-flex items-center gap-1.5 hover:text-primary">
            <Bookmark className="h-4 w-4" /> Save
          </button>
          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              toast.success("Link copied");
            }}
            className="inline-flex items-center gap-1.5 hover:text-primary"
          >
            <Share2 className="h-4 w-4" /> Share
          </button>
        </div>
      </article>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display font-bold mb-3">Add a comment</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder={user ? "Share your thoughts…" : "Sign in to comment"}
          disabled={!user}
          className="w-full p-3 rounded-xl bg-secondary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 disabled:opacity-60"
        />
        <div className="mt-2 flex items-center gap-2">
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
          <Button
            onClick={submit}
            disabled={!text.trim() || commentMut.isPending}
            className="ml-auto bg-primary text-primary-foreground border-0"
          >
            {commentMut.isPending ? "Posting…" : "Post comment"}
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold mb-2">
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </h2>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {comments.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">Be the first to reply.</div>
          ) : (
            <div className="px-5">
              {comments.map((c) => (
                <CommentItem key={c._id} comment={c} />
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
