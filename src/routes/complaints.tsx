import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Flag, ShieldCheck, CheckCircle2 } from "lucide-react";
import { motion } from "framer-motion";

export const Route = createFileRoute("/complaints")({
  component: Complaints,
  head: () => ({
    meta: [
      { title: "Complaints — PeerHive" },
      { name: "description", content: "Submit a campus complaint or report. Anonymous option available." },
    ],
  }),
});

const categories = ["Hostel", "Mess", "Academics", "Infrastructure", "Harassment", "Other"];

function Complaints() {
  const [category, setCategory] = useState(categories[0]);
  const [title, setTitle] = useState("");
  const [details, setDetails] = useState("");
  const [anon, setAnon] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const submit = () => {
    if (!title.trim() || details.trim().length < 20) {
      setError("Add a title and at least 20 characters of detail.");
      return;
    }
    setError("");
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-xl mx-auto text-center py-20 rounded-3xl border border-border bg-card p-10"
      >
        <div className="grid h-16 w-16 mx-auto place-items-center rounded-2xl bg-success/15 text-success mb-5">
          <CheckCircle2 className="h-8 w-8" />
        </div>
        <h2 className="font-display text-2xl font-bold">Complaint received</h2>
        <p className="text-muted-foreground mt-2">
          We've logged your report{anon ? " anonymously" : ""}. The relevant committee will review within 48 hours.
        </p>
        <Button className="mt-6" onClick={() => { setSubmitted(false); setTitle(""); setDetails(""); }}>
          File another
        </Button>
      </motion.div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <header>
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/10 text-destructive text-xs font-semibold mb-3">
          <Flag className="h-3.5 w-3.5" /> Confidential channel
        </div>
        <h1 className="font-display text-3xl font-bold">File a complaint</h1>
        <p className="text-muted-foreground mt-1">Reports go to the relevant committee, not public forums.</p>
      </header>

      <div className="rounded-2xl border border-border bg-card p-6 space-y-5">
        <Field label="Category">
          <div className="flex flex-wrap gap-2">
            {categories.map((c) => (
              <button
                key={c}
                onClick={() => setCategory(c)}
                className={`px-3 h-9 rounded-lg text-sm font-medium transition ${
                  category === c ? "bg-gradient-primary text-primary-foreground" : "bg-secondary hover:bg-accent"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </Field>

        <Field label="Title">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Brief summary"
            className="w-full h-11 px-3 rounded-xl bg-secondary text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </Field>

        <Field label="Details">
          <textarea
            value={details}
            onChange={(e) => setDetails(e.target.value)}
            rows={6}
            placeholder="What happened? When? Who was involved?"
            className="w-full p-3 rounded-xl bg-secondary text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
          <div className="text-[11px] text-muted-foreground mt-1 text-right">{details.length} chars</div>
        </Field>

        <label className="flex items-start gap-3 p-3 rounded-xl bg-secondary/50 cursor-pointer">
          <input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} className="mt-0.5 accent-primary" />
          <div className="flex-1">
            <div className="text-sm font-medium flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-primary" /> Submit anonymously
            </div>
            <div className="text-xs text-muted-foreground">Your identity will not be shared with the committee.</div>
          </div>
        </label>

        {error && <div className="text-sm text-destructive">{error}</div>}

        <div className="flex justify-end pt-2 border-t border-border">
          <Button onClick={submit} className="bg-gradient-primary text-primary-foreground border-0">
            Submit complaint
          </Button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-1.5">{label}</span>
      {children}
    </label>
  );
}
