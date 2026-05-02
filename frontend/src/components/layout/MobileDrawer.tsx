import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { X, Home, Library, Calendar } from "lucide-react";
import { forumsQuery } from "@/lib/queries";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/resources", label: "Resources", icon: Library },
  { to: "/calendar", label: "Calendar", icon: Calendar },
];

export function MobileDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data: forums = [] } = useQuery(forumsQuery());
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm md:hidden"
          />
          <motion.aside
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260 }}
            className="fixed top-0 left-0 bottom-0 z-50 w-80 bg-card border-r border-border p-6 overflow-y-auto md:hidden"
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-display text-lg font-bold">Menu</h2>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-1 mb-6">
              {items.map(({ to, label, icon: Icon }) => (
                <Link
                  key={to}
                  to={to}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 h-10 rounded-xl text-sm hover:bg-secondary"
                >
                  <Icon className="h-4 w-4" /> {label}
                </Link>
              ))}
            </div>
            <div className="text-xs font-semibold uppercase text-muted-foreground tracking-wider px-3 mb-2">
              Forums
            </div>
            <div className="space-y-1">
              {forums.map((f) => (
                <Link
                  key={f._id}
                  to={`/f/${f._id}`}
                  onClick={onClose}
                  className="flex items-center gap-3 px-3 h-10 rounded-lg text-sm hover:bg-secondary"
                >
                  <span>{f.type === "collab" ? "🛠️" : "💬"}</span> {f.name}
                </Link>
              ))}
            </div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
