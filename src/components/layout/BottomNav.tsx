import { Link, useLocation } from "@tanstack/react-router";
import { Home, Library, Calendar, Flag, Plus } from "lucide-react";
import { useStore } from "@/lib/store";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/resources", label: "Resources", icon: Library },
  { to: "/calendar", label: "Events", icon: Calendar },
  { to: "/complaints", label: "Report", icon: Flag },
];

export function BottomNav() {
  const loc = useLocation();
  const setCreateOpen = useStore((s) => s.setCreateOpen);
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-border">
      <div className="grid grid-cols-5 h-16 px-2">
        {items.slice(0, 2).map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to;
          return (
            <Link key={to} to={to} className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" /> {label}
            </Link>
          );
        })}
        <button
          onClick={() => setCreateOpen(true)}
          className="flex flex-col items-center justify-center"
          aria-label="Create"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow -mt-4">
            <Plus className="h-6 w-6" />
          </span>
        </button>
        {items.slice(2).map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to;
          return (
            <Link key={to} to={to} className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}>
              <Icon className="h-5 w-5" /> {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
