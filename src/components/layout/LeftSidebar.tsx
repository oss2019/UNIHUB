import { Link, useLocation } from "@tanstack/react-router";
import { Home, Library, Calendar, Flag, Users } from "lucide-react";
import { useStore } from "@/lib/store";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/resources", label: "Resources", icon: Library },
  { to: "/calendar", label: "Calendar", icon: Calendar },
  { to: "/complaints", label: "Complaints", icon: Flag },
];

export function LeftSidebar() {
  const forums = useStore((s) => s.forums);
  const loc = useLocation();

  return (
    <aside className="hidden lg:block w-64 shrink-0">
      <div className="sticky top-20 space-y-6">
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => {
            const active = loc.pathname === to;
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-3 px-3 h-10 rounded-xl text-sm font-medium transition ${
                  active
                    ? "bg-gradient-primary text-primary-foreground shadow-glow"
                    : "text-foreground/70 hover:text-foreground hover:bg-secondary"
                }`}
              >
                <Icon className="h-4 w-4" /> {label}
              </Link>
            );
          })}
        </nav>

        <div>
          <div className="flex items-center gap-2 px-3 mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <Users className="h-3.5 w-3.5" /> Forums
          </div>
          <div className="space-y-0.5">
            {forums.map((f) => (
              <Link
                key={f.id}
                to="/f/$slug"
                params={{ slug: f.slug }}
                className="flex items-center gap-3 px-3 h-9 rounded-lg text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition group"
              >
                <span className="text-base">{f.icon}</span>
                <span className="truncate">{f.name}</span>
                <span className="ml-auto text-[10px] text-muted-foreground group-hover:text-foreground">
                  {f.subforums.length}
                </span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </aside>
  );
}
