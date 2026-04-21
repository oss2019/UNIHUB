import { useLocation } from "@tanstack/react-router";
import { AnimatePresence, motion } from "framer-motion";
import type { ReactNode } from "react";

/**
 * Barba-style page transitions for React.
 * On every route change, a solid slab sweeps across the screen while the
 * outgoing page fades out and the incoming page fades in underneath.
 */
export function PageTransition({ children }: { children: ReactNode }) {
  const loc = useLocation();
  const key = loc.pathname;

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.div
          key={key}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.45, ease: [0.65, 0, 0.35, 1], delay: 0.35 }}
        >
          {children}
        </motion.div>
      </AnimatePresence>

      <AnimatePresence mode="wait">
        <motion.div
          key={`overlay-${key}`}
          className="pointer-events-none fixed inset-0 z-[60] bg-foreground origin-bottom"
          initial={{ scaleY: 1 }}
          animate={{ scaleY: 0 }}
          exit={{ scaleY: 1, originY: 1 }}
          transition={{ duration: 0.55, ease: [0.85, 0, 0.15, 1] }}
          style={{ originY: 0 }}
        />
      </AnimatePresence>
    </>
  );
}
