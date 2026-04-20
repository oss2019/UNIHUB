import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { ThreadCard } from "@/components/posts/ThreadCard";
import { ArrowRight, Sparkles, Flame, Users } from "lucide-react";
import { compact } from "@/lib/format";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "PeerHive — Home" },
      { name: "description", content: "Latest from forums, subforums, and projects across IIT Dharwad." },
    ],
  }),
  component: Home,
});

function Home() {
  const { forums, threads } = useStore();
  const trending = [...threads].sort((a, b) => b.likes + b.replies - (a.likes + a.replies)).slice(0, 6);
  const totalMembers = forums.reduce((s, f) => s + f.members, 0);
  const totalThreads = forums.reduce((s, f) => s + f.threadCount, 0);

  return (
    <div className="space-y-10">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl border border-border bg-card p-8 md:p-10">
        <div className="absolute inset-0 bg-grid opacity-30 [mask-image:radial-gradient(ellipse_at_center,black_30%,transparent_70%)]" />
        <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-primary/30 blur-3xl" />
        <div className="relative">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl"
          >
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/15 text-primary text-xs font-semibold mb-4">
              <Sparkles className="h-3.5 w-3.5" /> The IIT Dharwad community
            </span>
            <h1 className="font-display text-4xl md:text-5xl font-bold tracking-tight leading-[1.05]">
              Where campus <span className="text-gradient">meets, talks, and builds</span>.
            </h1>
            <p className="mt-4 text-base md:text-lg text-muted-foreground max-w-xl">
              Forums for every department and club. Find collaborators, swap notes, share gigs, and never miss a mess update again.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/f/$slug" params={{ slug: "academics" }} className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-gradient-primary text-primary-foreground text-sm font-semibold shadow-glow hover:opacity-90">
                Explore forums <ArrowRight className="h-4 w-4" />
              </Link>
              <Link to="/resources" className="inline-flex items-center gap-2 px-5 h-11 rounded-xl bg-secondary text-sm font-semibold hover:bg-accent">
                Browse resources
              </Link>
            </div>
            <div className="mt-8 flex flex-wrap gap-6 text-sm">
              <Stat icon={Users} label="Members" value={compact(totalMembers)} />
              <Stat icon={Flame} label="Threads" value={compact(totalThreads)} />
              <Stat icon={Sparkles} label="Forums" value={forums.length} />
            </div>
          </motion.div>
        </div>
      </section>

      {/* Forums grid */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Forums</h2>
            <p className="text-sm text-muted-foreground">Pick a space to dive in.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {forums.map((f, i) => (
            <motion.div key={f.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
              <Link
                to="/f/$slug"
                params={{ slug: f.slug }}
                className="group flex gap-4 p-5 rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-card transition"
              >
                <div className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br from-primary/20 to-primary-glow/10 text-3xl">
                  {f.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg group-hover:text-primary">{f.name}</h3>
                    <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{f.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">{f.description}</p>
                  <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                    <span>{compact(f.members)} members</span>
                    <span>{compact(f.threadCount)} threads</span>
                    <span>{f.subforums.length} subforums</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trending */}
      <section>
        <div className="flex items-end justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold">Trending today</h2>
            <p className="text-sm text-muted-foreground">What the campus is talking about.</p>
          </div>
        </div>
        <div className="space-y-3">
          {trending.map((t, i) => <ThreadCard key={t.id} thread={t} index={i} />)}
        </div>
      </section>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-secondary text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <div className="font-display font-bold leading-none">{value}</div>
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
    </div>
  );
}
