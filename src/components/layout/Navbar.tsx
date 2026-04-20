import { Link, useLocation } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Plus, Search, Moon, Sun, Hexagon, Menu } from "lucide-react";
import { useState } from "react";
import { useUI } from "@/lib/uiStore";
import { meQuery, unreadCountQuery } from "@/lib/queries";
import { Button } from "@/components/ui/button";
import { MobileDrawer } from "./MobileDrawer";

export function Navbar() {
  const { isDark, toggleDark, setAuthOpen, setCreateOpen, setNotifOpen } = useUI();
  const { data: user } = useQuery(meQuery());
  const { data: unread = 0 } = useQuery(unreadCountQuery(!!user));
  const loc = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 glass border-b border-border">
        <div className="mx-auto flex h-16 max-w-7xl items-center gap-3 px-4 md:px-6">
          <button
            onClick={() => setDrawerOpen(true)}
            className="md:hidden inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>

          <Link to="/" className="flex items-center gap-2 font-display">
            <div className="relative grid h-9 w-9 place-items-center rounded-xl bg-primary">
              <Hexagon className="h-5 w-5 text-primary-foreground" strokeWidth={2.5} />
            </div>
            <span className="hidden sm:block text-lg font-bold tracking-tight">
              peer<span className="text-primary">hive</span>
            </span>
          </Link>

          <div className="ml-2 hidden md:flex flex-1 max-w-xl">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search threads, forums, people…"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-secondary border border-transparent focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/20 text-sm"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1.5">
            <Button
              size="sm"
              onClick={() => {
                if (!user) return setAuthOpen(true);
                setCreateOpen(true);
              }}
              className="hidden sm:inline-flex bg-primary text-primary-foreground hover:opacity-90 border-0"
            >
              <Plus className="h-4 w-4" /> Post
            </Button>
            <button
              onClick={toggleDark}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>
            <button
              onClick={() => (user ? setNotifOpen(true) : setAuthOpen(true))}
              className="relative inline-flex h-9 w-9 items-center justify-center rounded-lg hover:bg-secondary"
              aria-label="Notifications"
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 h-4 min-w-4 px-1 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground grid place-items-center">
                  {unread > 99 ? "99+" : unread}
                </span>
              )}
            </button>
            {user ? (
              <button
                onClick={() => setAuthOpen(true)}
                className="ml-1 grid h-9 w-9 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold ring-2 ring-background hover:ring-primary/40 transition overflow-hidden"
                aria-label="Profile"
              >
                {user.avatar ? (
                  <img src={user.avatar} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </button>
            ) : (
              <Button size="sm" variant="outline" onClick={() => setAuthOpen(true)}>
                Sign in
              </Button>
            )}
          </div>
        </div>
        {loc.pathname === "/" && (
          <div className="md:hidden px-4 pb-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                placeholder="Search…"
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-secondary text-sm focus:outline-none"
              />
            </div>
          </div>
        )}
      </header>
      <MobileDrawer open={drawerOpen} onClose={() => setDrawerOpen(false)} />
    </>
  );
}
