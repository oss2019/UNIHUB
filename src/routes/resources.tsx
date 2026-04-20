import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { resources } from "@/lib/mockData";
import { Library, Download, Search } from "lucide-react";
import { motion } from "framer-motion";
import { compact } from "@/lib/format";

export const Route = createFileRoute("/resources")({
  component: Resources,
  head: () => ({
    meta: [
      { title: "Resources — PeerHive" },
      { name: "description", content: "Notes, guides, templates and curated material from the IIT Dharwad community." },
    ],
  }),
});

const categories = ["All", "Academics", "Career", "Campus"];

function Resources() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const filtered = resources.filter(
    (r) => (cat === "All" || r.category === cat) && r.title.toLowerCase().includes(q.toLowerCase()),
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Resources</h1>
        <p className="text-muted-foreground mt-1">Curated by students, for students.</p>
      </header>

      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search resources…"
            className="w-full h-10 pl-9 pr-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>
        <div className="flex gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 h-10 rounded-xl text-sm font-medium transition ${
                cat === c ? "bg-gradient-primary text-primary-foreground shadow-glow" : "bg-secondary hover:bg-accent"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((r, i) => (
          <motion.div
            key={r.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
            className="group rounded-2xl border border-border bg-card p-5 hover:border-primary/50 hover:shadow-card transition cursor-pointer"
          >
            <div className="flex items-start justify-between">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/10 text-primary">
                <Library className="h-5 w-5" />
              </div>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-secondary text-muted-foreground">
                {r.category}
              </span>
            </div>
            <h3 className="font-display font-bold mt-4 group-hover:text-primary leading-snug">{r.title}</h3>
            <p className="text-xs text-muted-foreground mt-1">by {r.author}</p>
            <div className="mt-4 pt-3 border-t border-border flex items-center justify-between text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1"><Download className="h-3.5 w-3.5" /> {compact(r.downloads)}</span>
              <span className="text-primary font-semibold">Open →</span>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
