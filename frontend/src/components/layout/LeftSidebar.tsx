import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, Library, Calendar, Users, HelpCircle } from "lucide-react";
import { forumsQuery } from "@/lib/queries";
import { useTourStore } from "@/lib/tourStore";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/resources", label: "Resources", icon: Library },
  { to: "/calendar", label: "Calendar", icon: Calendar },
];

export function LeftSidebar() {
  const { data: forums = [] } = useQuery(forumsQuery());
  const loc = useLocation();
  const startTour = useTourStore((s) => s.startTour);

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20 space-y-6">
        <nav data-tour="sidebar-nav" className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                data-tour={`sidebar-${label.toLowerCase()}`}
                className={`flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>

        <div data-tour="sidebar-forums">
          <div className="flex items-center gap-2 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Forums
          </div>
          <div className="space-y-0.5">
            {forums.length === 0 && (
              <p className="px-3 text-xs text-muted-foreground">
                No forums yet.
              </p>
            )}
            {forums.map((f) => (
              <Link
                key={f._id}
                to={`/f/${f._id}`}
                className="flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition group"
              >
                <span className="text-base">
                  {f.type === "collab" ? "🛠️" : "💬"}
                </span>
                <span className="truncate">{f.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground group-hover:text-foreground">
                  {f.subForumCount ?? 0}
                </span>
              </Link>
            ))}
          </div>
        </div>

        <div className="pt-4 border-t border-border/40">
          <button
            onClick={startTour}
            className="w-full flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium text-foreground/70 hover:text-foreground hover:bg-secondary transition"
          >
            <HelpCircle className="h-4 w-4 text-primary animate-pulse" /> Take
            Site Tour
          </button>
        </div>
      </div>
    </aside>
  );
}
