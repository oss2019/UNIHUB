import { createFileRoute } from "@tanstack/react-router";
import { Calendar as CalendarIcon } from "lucide-react";

export const Route = createFileRoute("/calendar")({
  component: Calendar,
  head: () => ({
    meta: [
      { title: "Calendar — PeerHive" },
      { name: "description", content: "Upcoming events at IIT Dharwad." },
    ],
  }),
});

function Calendar() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Calendar</h1>
        <p className="text-muted-foreground mt-1">What's happening on campus.</p>
      </header>
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <CalendarIcon className="h-8 w-8 text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Calendar is coming soon — backend endpoint not yet defined.
        </p>
      </div>
    </div>
  );
}
