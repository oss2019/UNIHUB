import { useEffect } from "react";
import { Library } from "lucide-react";

export function ResourcesPage() {
  useEffect(() => {
    document.title = "Resources — PeerHive";
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-display text-3xl font-bold">Resources</h1>
        <p className="text-muted-foreground mt-1">Curated by students, for students.</p>
      </header>
      <div className="rounded-2xl border border-dashed border-border p-12 text-center">
        <Library className="h-8 w-8 text-primary mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">
          Resources are coming soon — backend endpoint not yet defined.
        </p>
      </div>
    </div>
  );
}
