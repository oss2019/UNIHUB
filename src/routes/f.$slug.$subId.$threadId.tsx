import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { CommentItem } from "@/components/posts/CommentItem";
import { ChevronRight, ArrowBigUp, MessageCircle, Eye, Tag, Bookmark, Share2, Pin, CheckCircle2 } from "lucide-react";
import { compact, timeAgo } from "@/lib/format";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/f/$slug/$subId/$threadId")({
  component: ThreadPage,
  head: ({ params }) => ({
    meta: [{ title: `Thread — PeerHive` }, { name: "description", content: `Discussion on ${params.threadId}` }],
  }),
});

function ThreadPage() {
  const { slug, subId, threadId } = Route.useParams();
  const { forums, threads, comments, addComment } = useStore();
  const forum = forums.find((f) => f.slug === slug);
  const sub = forum?.subforums.find((s) => s.id === subId);
  const thread = threads.find((t) => t.id === threadId);
  if (!forum || !sub || !thread) throw notFound();

  const list = comments[threadId] ?? [];
  const [text, setText] = useState("");

  const submit = () => {
    if (!text.trim()) return;
    addComment(threadId, text.trim(), null);
    setText("");
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/f/$slug" params={{ slug: forum.slug }} className="hover:text-foreground">{forum.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/f/$slug/$subId" params={{ slug: forum.slug, subId: sub.id }} className="hover:text-foreground">{sub.name}</Link>
      </nav>

      <article className="rounded-2xl border border-border bg-card p-6 md:p-8">
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-3 flex-wrap">
          {thread.isPinned && <span className="inline-flex items-center gap-1 text-warning"><Pin className="h-3 w-3" /> Pinned</span>}
          {thread.isSolved && <span className="inline-flex items-center gap-1 text-success"><CheckCircle2 className="h-3 w-3" /> Solved</span>}
          <div className="grid h-7 w-7 place-items-center rounded-full bg-gradient-primary text-primary-foreground text-xs font-bold">
            {thread.authorName.charAt(0)}
          </div>
          <span className="font-medium text-foreground">{thread.authorName}</span>
          <span>·</span>
          <span>{timeAgo(thread.createdAt)}</span>
        </div>
        <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{thread.title}</h1>
        <div className="mt-4 prose prose-sm dark:prose-invert max-w-none">
          <p className="text-foreground/90 whitespace-pre-wrap leading-relaxed">{thread.content}</p>
        </div>
        <div className="mt-5 flex flex-wrap gap-2">
          {thread.tags.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              <Tag className="h-3 w-3" /> {t}
            </span>
          ))}
        </div>
        <div className="mt-5 pt-4 border-t border-border flex items-center gap-4 text-sm text-muted-foreground">
          <button className="inline-flex items-center gap-1.5 hover:text-primary"><ArrowBigUp className="h-5 w-5" /> {compact(thread.likes)}</button>
          <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-4 w-4" /> {compact(thread.replies)}</span>
          <span className="inline-flex items-center gap-1.5"><Eye className="h-4 w-4" /> {compact(thread.views)}</span>
          <button className="ml-auto inline-flex items-center gap-1.5 hover:text-primary"><Bookmark className="h-4 w-4" /> Save</button>
          <button className="inline-flex items-center gap-1.5 hover:text-primary"><Share2 className="h-4 w-4" /> Share</button>
        </div>
      </article>

      <section className="rounded-2xl border border-border bg-card p-6">
        <h2 className="font-display font-bold mb-3">Add a comment</h2>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={3}
          placeholder="Share your thoughts…"
          className="w-full p-3 rounded-xl bg-secondary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
        <div className="mt-2 flex justify-end">
          <Button onClick={submit} disabled={!text.trim()} className="bg-gradient-primary text-primary-foreground border-0">
            Post comment
          </Button>
        </div>
      </section>

      <section>
        <h2 className="font-display text-lg font-bold mb-2">{list.length} {list.length === 1 ? "comment" : "comments"}</h2>
        <div className="rounded-2xl border border-border bg-card divide-y divide-border">
          {list.length === 0 ? (
            <div className="p-10 text-center text-muted-foreground text-sm">Be the first to reply.</div>
          ) : (
            <div className="px-5">
              {list.map((c) => <CommentItem key={c.id} comment={c} />)}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
