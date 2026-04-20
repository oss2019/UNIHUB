import { createFileRoute } from "@tanstack/react-router";
import { events } from "@/lib/mockData";
import { Calendar as CalendarIcon, MapPin, Clock, Bell } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/calendar")({
  component: Calendar,
  head: () => ({
    meta: [
      { title: "Calendar — PeerHive" },
      { name: "description", content: "Upcoming events at IIT Dharwad — talks, fests, sports and more." },
    ],
  }),
});

const accentByCategory: Record<string, string> = {
  Culture: "border-l-rose-500",
  Tech: "border-l-amber-600",
  Sports: "border-l-emerald-600",
  Career: "border-l-yellow-600",
};

function Calendar() {
  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold">Calendar</h1>
          <p className="text-muted-foreground mt-1">What's happening on campus.</p>
        </div>
        <div className="text-sm text-muted-foreground inline-flex items-center gap-2">
          <CalendarIcon className="h-4 w-4 text-primary" /> {events.length} upcoming
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {events.map((e, i) => {
          const date = new Date(e.date);
          return (
            <motion.div
              key={e.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`group relative overflow-hidden rounded-2xl border border-l-4 border-border bg-card p-5 hover:border-primary/50 hover:shadow-card transition ${accentByCategory[e.category] ?? "border-l-primary"}`}
            >
              <div className="relative flex gap-5">
                <div className="text-center shrink-0">
                  <div className="text-[11px] uppercase font-bold tracking-wider text-primary">{format(date, "MMM")}</div>
                  <div className="font-display text-4xl font-bold leading-none">{format(date, "dd")}</div>
                  <div className="text-[11px] text-muted-foreground mt-0.5">{format(date, "EEE")}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-background/60 text-foreground">{e.category}</span>
                  <h3 className="font-display font-bold text-lg mt-1.5 group-hover:text-primary">{e.title}</h3>
                  <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <div className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" /> {e.time}</div>
                    <div className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" /> {e.location}</div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-3">
                    <Bell className="h-3.5 w-3.5" /> Remind me
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
