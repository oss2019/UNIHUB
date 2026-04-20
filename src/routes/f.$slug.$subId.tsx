import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { ThreadCard } from "@/components/posts/ThreadCard";
import { Button } from "@/components/ui/button";
import { ChevronRight, Bell, BellOff, Plus, Check } from "lucide-react";
import { compact } from "@/lib/format";

export const Route = createFileRoute("/f/$slug/$subId")({
  component: SubforumPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.subId} — PeerHive` },
    ],
  }),
});

function SubforumPage() {
  const { slug, subId } = Route.useParams();
  const { forums, threads, user, joinSubforum, leaveSubforum, muteSubforum, unmuteSubforum, setCreateOpen } = useStore();
  const forum = forums.find((f) => f.slug === slug);
  const sub = forum?.subforums.find((s) => s.id === subId);
  if (!forum || !sub) throw notFound();

  const subThreads = threads.filter((t) => t.subforumId === sub.id);
  const joined = user?.joinedSubForums.includes(sub.id) ?? false;
  const muted = user?.mutedSubForums.includes(sub.id) ?? false;

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to="/f/$slug" params={{ slug: forum.slug }} className="hover:text-foreground">{forum.name}</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{sub.name}</span>
      </nav>

      <header className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-bold">{sub.name}</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">{sub.description}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {sub.tags.map((t) => <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">#{t}</span>)}
            </div>
            <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
              <span>{compact(sub.members)} members</span>
              <span>{compact(sub.threadCount)} threads</span>
              <span className="text-success">{sub.activeNow} active now</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {joined ? (
              <Button variant="outline" size="sm" onClick={() => leaveSubforum(sub.id)}>
                <Check className="h-4 w-4" /> Joined
              </Button>
            ) : (
              <Button size="sm" onClick={() => joinSubforum(sub.id)} className="bg-gradient-primary text-primary-foreground border-0">
                <Plus className="h-4 w-4" /> Join
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={() => (muted ? unmuteSubforum(sub.id) : muteSubforum(sub.id))}>
              {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {muted ? "Muted" : "Mute"}
            </Button>
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" /> New post
            </Button>
          </div>
        </div>
      </header>

      <div className="space-y-3">
        {subThreads.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">No threads yet. Be the first to post!</p>
          </div>
        ) : (
          subThreads.map((t, i) => <ThreadCard key={t.id} thread={t} index={i} />)
        )}
      </div>
    </div>
  );
}
