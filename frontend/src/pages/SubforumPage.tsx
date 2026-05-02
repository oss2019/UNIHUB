import { Link, useParams } from "react-router-dom";
import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ChevronRight, Bell, BellOff, Plus, Check, Briefcase } from "lucide-react";
import { ThreadCard } from "@/components/posts/ThreadCard";
import { Button } from "@/components/ui/button";
import { compact } from "@/lib/format";
import {
  meQuery,
  forumQuery,
  subforumQuery,
  threadsBySubforumQuery,
  workRequestsQuery,
  qk,
} from "@/lib/queries";
import { subforumApi } from "@/lib/api";
import { useUI } from "@/lib/uiStore";
import { toast } from "sonner";
import { WorkRequestPanel } from "@/components/WorkRequestPanel";

export function SubforumPage() {
  const params = useParams<{ slug: string; subId: string }>();
  const slug = params.slug ?? "";
  const subId = params.subId ?? "";
  const { setCreateOpen, setAuthOpen } = useUI();
  const qc = useQueryClient();
  const { data: user } = useQuery(meQuery());
  const { data: forumData } = useQuery(forumQuery(slug));
  const { data: sub, isLoading, error } = useQuery(subforumQuery(subId));
  const { data: paged, error: threadsError } = useQuery(threadsBySubforumQuery(subId));
  const threads = paged?.pagination?.threads ?? (paged as any)?.threads ?? [];

  useEffect(() => {
    document.title = sub?.name ? `${sub.name} — PeerHive` : "Subforum — PeerHive";
  }, [sub?.name]);

  const parentForum = sub && typeof sub.forum === "object" ? sub.forum : null;
  const isCollab = forumData?.forum?.type === "collab";
  const userId = user?._id ?? user?.id;
  const subOwnerId = typeof sub?.createdBy === "object" ? sub.createdBy?._id : undefined;
  const canCreateWorkRequest = Boolean(userId && subOwnerId && userId === subOwnerId && isCollab);
  const { data: workRequests = [] } = useQuery({
    ...workRequestsQuery(subId),
    enabled: !!user && isCollab,
  });

  const joined = user?.joinedSubForums?.includes(subId) ?? false;
  const muted = user?.mutedSubForums?.includes(subId) ?? false;

  const optimisticUser = (mutator: (u: NonNullable<typeof user>) => typeof user) =>
    qc.setQueryData(qk.me, (prev: any) => (prev ? mutator(prev) : prev));

  const joinMut = useMutation({
    mutationFn: () => subforumApi.join(subId),
    onMutate: () => optimisticUser((u) => ({ ...u, joinedSubForums: [...(u.joinedSubForums ?? []), subId] })),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: qk.me });
    },
    onSuccess: () => toast.success("Joined"),
  });
  const leaveMut = useMutation({
    mutationFn: () => subforumApi.leave(subId),
    onMutate: () =>
      optimisticUser((u) => ({ ...u, joinedSubForums: (u.joinedSubForums ?? []).filter((x) => x !== subId) })),
    onError: (e: Error) => {
      toast.error(e.message);
      qc.invalidateQueries({ queryKey: qk.me });
    },
    onSuccess: () => toast.success("Left"),
  });
  const muteMut = useMutation({
    mutationFn: () => subforumApi.mute(subId),
    onMutate: () => optimisticUser((u) => ({ ...u, mutedSubForums: [...(u.mutedSubForums ?? []), subId] })),
    onError: (e: Error) => toast.error(e.message),
  });
  const unmuteMut = useMutation({
    mutationFn: () => subforumApi.unmute(subId),
    onMutate: () =>
      optimisticUser((u) => ({ ...u, mutedSubForums: (u.mutedSubForums ?? []).filter((x) => x !== subId) })),
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-32 rounded-2xl bg-card border border-border animate-pulse" />
        <div className="h-24 rounded-2xl bg-card border border-border animate-pulse" />
      </div>
    );
  }

  if (error || !sub) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        Couldn't load this subforum. {(error as Error)?.message}
      </div>
    );
  }

  const requireAuth = (fn: () => void) => () => (user ? fn() : setAuthOpen(true));

  return (
    <div className="space-y-6">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground flex-wrap">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link to={`/f/${slug}`} className="hover:text-foreground">
          {parentForum?.name ?? "Forum"}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{sub.name}</span>
      </nav>

      <header className="rounded-2xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="font-display text-2xl md:text-3xl font-bold">{sub.name}</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">{sub.description || "—"}</p>
            {sub.tags?.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {sub.tags.map((t) => (
                  <span key={t} className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                    #{t}
                  </span>
                ))}
              </div>
            )}
            {sub.threadCount !== undefined && (
              <div className="mt-3 text-xs text-muted-foreground">{compact(sub.threadCount)} threads</div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {joined ? (
              <Button
                variant="outline"
                size="sm"
                onClick={requireAuth(() => leaveMut.mutate())}
                disabled={leaveMut.isPending}
              >
                <Check className="h-4 w-4" /> Joined
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={requireAuth(() => joinMut.mutate())}
                disabled={joinMut.isPending}
                className="bg-primary text-primary-foreground border-0"
              >
                <Plus className="h-4 w-4" /> Join
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={requireAuth(() => (muted ? unmuteMut.mutate() : muteMut.mutate()))}
            >
              {muted ? <BellOff className="h-4 w-4" /> : <Bell className="h-4 w-4" />}
              {muted ? "Muted" : "Mute"}
            </Button>
            <Button size="sm" onClick={requireAuth(() => setCreateOpen(true, subId))}>
              <Plus className="h-4 w-4" /> New post
            </Button>
          </div>
        </div>
      </header>

      {user && isCollab && (workRequests.length > 0 || canCreateWorkRequest) && (
        <section className="rounded-2xl border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-3">
            <Briefcase className="h-4 w-4 text-primary" />
            <h2 className="font-display font-bold">Work opportunities</h2>
          </div>
          <WorkRequestPanel
            subforumId={subId}
            requests={workRequests}
            canCreate={canCreateWorkRequest}
            forumId={slug}
            currentUserId={userId}
          />
        </section>
      )}

      <div className="space-y-3">
        {threadsError && (
          <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Couldn't load threads. {(threadsError as Error)?.message}
          </div>
        )}
        {threads.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <p className="text-muted-foreground">No threads yet. Be the first to post!</p>
          </div>
        ) : (
          threads.map((t, i) => <ThreadCard key={t._id} thread={t} index={i} />)
        )}
      </div>
    </div>
  );
}