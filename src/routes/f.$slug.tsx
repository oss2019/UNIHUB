import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { compact } from "@/lib/format";
import { ChevronRight, Users, MessageSquare, Activity } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/f/$slug")({
  component: ForumPage,
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — PeerHive` },
      { name: "description", content: `Subforums and threads in ${params.slug}.` },
    ],
  }),
});

function ForumPage() {
  const { slug } = Route.useParams();
  const forum = useStore((s) => s.forums.find((f) => f.slug === slug));
  if (!forum) throw notFound();

  return (
    <div className="space-y-8">
      <nav className="flex items-center gap-1.5 text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">Home</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-medium">{forum.name}</span>
      </nav>

      <header className="rounded-3xl border border-border bg-card p-6 md:p-8 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 h-60 w-60 rounded-full bg-primary/20 blur-3xl" />
        <div className="relative flex items-start gap-5">
          <div className="grid h-20 w-20 shrink-0 place-items-center rounded-3xl bg-gradient-to-br from-primary/30 to-primary-glow/10 text-5xl">
            {forum.icon}
          </div>
          <div className="flex-1">
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-secondary text-muted-foreground">{forum.type}</span>
            <h1 className="font-display text-3xl font-bold mt-1">{forum.name}</h1>
            <p className="text-muted-foreground mt-1 max-w-2xl">{forum.description}</p>
            <div className="mt-4 flex gap-5 text-sm">
              <span className="inline-flex items-center gap-1.5"><Users className="h-4 w-4 text-primary" /> {compact(forum.members)} members</span>
              <span className="inline-flex items-center gap-1.5"><MessageSquare className="h-4 w-4 text-primary" /> {compact(forum.threadCount)} threads</span>
            </div>
          </div>
        </div>
      </header>

      <section>
        <h2 className="font-display text-xl font-bold mb-4">Subforums</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {forum.subforums.map((s, i) => (
            <motion.div key={s.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link
                to="/f/$slug/$subId"
                params={{ slug: forum.slug, subId: s.id }}
                className="group block p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-card transition"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display font-bold group-hover:text-primary">{s.name}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{s.description}</p>
                  </div>
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-success/15 text-success text-[11px] font-semibold shrink-0">
                    <Activity className="h-3 w-3" /> {s.activeNow}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {s.tags.map((t) => (
                    <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-muted-foreground">#{t}</span>
                  ))}
                </div>
                <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                  <span>{compact(s.members)} members</span>
                  <span>{compact(s.threadCount)} threads</span>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
