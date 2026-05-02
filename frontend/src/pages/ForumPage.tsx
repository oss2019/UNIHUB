import { Link, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronRight, Users, MessageSquare, Plus, X } from "lucide-react";
import { forumQuery, meQuery, qk } from "@/lib/queries";
import { subforumRequestApi } from "@/lib/api";
import { useUI } from "@/lib/uiStore";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Modal } from "@/components/Modal";

export function ForumPage() {
  const { slug } = useParams<{ slug: string }>();
  const qc = useQueryClient();
  const { setAuthOpen } = useUI();
  const { data: user } = useQuery(meQuery());
  const { data, isLoading, error } = useQuery(forumQuery(slug!));
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  useEffect(() => {
    document.title = data?.forum?.name
      ? `${data.forum.name} — PeerHive`
      : "Forum — PeerHive";
  }, [data?.forum?.name]);

  const createSubforumMut = useMutation({
    mutationFn: () =>
      subforumRequestApi.create(slug!, {
        name: name.trim(),
        description: description.trim() || undefined,
        tags,
      }),
    onSuccess: (res: any) => {
      const createdDirectly = Boolean(res?.subForum);
      toast.success(createdDirectly ? "Subforum created." : "Subforum request submitted.");
      qc.invalidateQueries({ queryKey: qk.forum(slug!) });
      resetForm();
      setOpenCreate(false);
    },
    onError: (e: Error) => toast.error(e.message),
  });

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
  const isCollab = forum.type === "collab";
  const submitLabel = "Add subforum";
  const helperText = isCollab
    ? "Use this to add a project subforum."
    : "In this forum type, requests require admin approval.";

  const addTag = () => {
    const t = tagInput.trim().toLowerCase().replace(/^#/, "");
    if (t && !tags.includes(t) && tags.length < 8) setTags((prev) => [...prev, t]);
    setTagInput("");
  };

  const resetForm = () => {
    setName("");
    setDescription("");
    setTagInput("");
    setTags([]);
  };

  const submitSubforum = () => {
    if (!name.trim()) {
      toast.error("Subforum name is required.");
      return;
    }
    createSubforumMut.mutate();
  };

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
            <p className="mt-2 text-xs text-muted-foreground">{helperText}</p>
          </div>
          <div className="ml-auto">
            <Button
              size="sm"
              onClick={() => (user ? setOpenCreate(true) : setAuthOpen(true))}
              className="bg-primary text-primary-foreground border-0"
            >
              <Plus className="h-4 w-4" /> Add subforum
            </Button>
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
                  to={`/f/${forum._id}/${s._id}`}
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

      <Modal open={openCreate} onClose={() => setOpenCreate(false)} title={submitLabel} maxWidth="max-w-xl">
        <div className="p-6 space-y-4">
          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Subforum name
            </span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. React + Node Project Team"
              className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={80}
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Description
            </span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What should this subforum focus on?"
              rows={4}
              className="w-full px-3 py-2.5 rounded-xl bg-secondary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
              maxLength={500}
            />
          </label>

          <label className="block">
            <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">
              Tags (optional)
            </span>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/15 text-primary text-xs font-medium"
                >
                  #{t}
                  <button onClick={() => setTags(tags.filter((x) => x !== t))}>
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  addTag();
                }
              }}
              placeholder="Type and press Enter"
              className="w-full h-10 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
          </label>

          <div className="text-xs text-muted-foreground rounded-lg bg-secondary/50 px-3 py-2">
            {isCollab
              ? "Submission will be processed by the current backend policy for this forum."
              : "This will submit a request. Admin approval is required before creation."}
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-border">
            <Button variant="ghost" onClick={() => setOpenCreate(false)}>
              Cancel
            </Button>
            <Button
              onClick={submitSubforum}
              disabled={createSubforumMut.isPending}
              className="bg-primary text-primary-foreground border-0"
            >
              {createSubforumMut.isPending ? "Submitting..." : submitLabel}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
