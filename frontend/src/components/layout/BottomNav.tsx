import { Link, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Home, Library, Calendar, Plus, User } from "lucide-react";
import { useUI } from "@/lib/uiStore";
import { meQuery } from "@/lib/queries";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/resources", label: "Resources", icon: Library },
  { to: "/calendar", label: "Events", icon: Calendar },
];

export function BottomNav() {
  const loc = useLocation();
  const { setCreateOpen, setAuthOpen } = useUI();
  const { data: user } = useQuery(meQuery());
  return (
    <nav className="md:hidden fixed bottom-0 inset-x-0 z-30 glass border-t border-border">
      <div className="grid grid-cols-5 h-16 px-2">
        {items.slice(0, 2).map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5" /> {label}
            </Link>
          );
        })}
        <button
          onClick={() => (user ? setCreateOpen(true) : setAuthOpen(true))}
          className="flex flex-col items-center justify-center"
          aria-label="Create"
        >
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-primary text-primary-foreground -mt-4">
            <Plus className="h-6 w-6" />
          </span>
        </button>
        {items.slice(2).map(({ to, label, icon: Icon }) => {
          const active = loc.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center justify-center gap-0.5 text-[10px] ${active ? "text-primary" : "text-muted-foreground"}`}
            >
              <Icon className="h-5 w-5" /> {label}
            </Link>
          );
        })}
        <button
          onClick={() => setAuthOpen(true)}
          className="flex flex-col items-center justify-center gap-0.5 text-[10px] text-muted-foreground"
          aria-label={user ? "Profile" : "Sign in"}
        >
          <span className="grid h-8 w-8 place-items-center rounded-full bg-primary/10 text-primary overflow-hidden">
            {user?.avatar ? (
              <div className = "h-full w-full">
                  <img className="h-full w-full" src={user.avatar} alt={user.name} />
                </div>
            ) : user ? (
              <span className="text-[11px] font-bold">{user.name.charAt(0).toUpperCase()}</span>
            ) : (
              <User className="h-4 w-4" />
            )}
          </span>

          
          {user ? "Profile" : "Sign in"}
        </button>
      </div>
    </nav>
  );
}
