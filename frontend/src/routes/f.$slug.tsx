import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { ChevronRight, Users, MessageSquare } from "lucide-react";
import { forumQuery } from "@/lib/queries";

export const Route = createFileRoute("/f/$slug")({
  loader: ({ context, params }) => {
    context.queryClient.prefetchQuery(forumQuery(params.slug));
  },
  component: ForumPage,
  head: ({ params }) => ({
    meta: [{ title: `Forum — PeerHive` }, { name: "description", content: `Subforums in ${params.slug}.` }],
  }),
});

function ForumPage() {
  const { slug } = Route.useParams();
  const { data, isLoading, error } = useQuery(forumQuery(slug));

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-32 rounded-3xl bg-card border border-border animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-2xl bg-card border border-border animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-sm">
        Couldn't load this forum. {(error as Error)?.message}
      </div>
    );
  }

  const { forum, subForums } = data;

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{forum.name}</span>
      </nav>

      <header className="rounded-3xl border border-border bg-card p-6 md:p-8 relative overflow-hidden">
        <div className="relative flex items-start gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-primary/10 text-5xl">
            {forum.type === "collab" ? "🛠️" : "💬"}
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-secondary text-muted-foreground">
              {forum.type}
            </span>
            <h1 className="font-display text-3xl font-bold mt-1">{forum.name}</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">{forum.description || "—"}</p>
            <div className="mt-4 flex gap-5 text-sm">
              <span className="inline-flex items-center gap-1.5">
                <Users className="h-4 w-4 text-primary" /> {subForums.length} subforums
              </span>
              <span className="inline-flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-primary" />{" "}
                {forum.createdBy?.name ? `by ${forum.createdBy.name}` : "Community"}
              </span>
            </div>
          </div>
        </div>
      </header>

      <section>
        <h2 className="font-display text-xl font-bold mb-4">Subforums</h2>
        {subForums.length === 0 ? (
          <div className="text-center py-12 rounded-2xl border border-dashed border-border text-muted-foreground text-sm">
            No subforums yet.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {subForums.map((s, i) => (
              <motion.div
                key={s._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Link
                  to="/f/$slug/$subId"
                  params={{ slug: forum._id, subId: s._id }}
                  className="group block p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-card transition"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="font-display font-bold group-hover:text-primary truncate">{s.name}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                        {s.description || "—"}
                      </p>
                    </div>
                  </div>
                  {s.tags?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {s.tags.slice(0, 5).map((t) => (
                        <span
                          key={t}
                          className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground"
                        >
                          #{t}
                        </span>
                      ))}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
