import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowBigUp, MessageCircle, Eye, Pin, Tag } from "lucide-react";
import type { Thread } from "@/lib/mockData";
import { useStore } from "@/lib/store";
import { timeAgo, compact } from "@/lib/format";

export function ThreadCard({ thread, index = 0 }: { thread: Thread; index?: number }) {
  const forums = useStore((s) => s.forums);
  const slug = forums.find((f) => f.id === thread.forumId)?.slug ?? "";

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        to="/f/$slug/$subId/$threadId"
        params={{ slug, subId: thread.subforumId, threadId: thread.id }}
        className="group block rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-card transition-all p-5"
      >
        <div className="flex items-start gap-4">
          <div className="flex flex-col items-center gap-1 text-muted-foreground shrink-0 pt-0.5">
            <button onClick={(e) => e.preventDefault()} className="p-1 rounded-md hover:bg-primary/10 hover:text-primary">
              <ArrowBigUp className="h-5 w-5" />
            </button>
            <span className="text-sm font-bold text-foreground">{compact(thread.likes)}</span>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground">
              {thread.isPinned && (
                <span className="inline-flex items-center gap-1 text-warning"><Pin className="h-3 w-3" /> Pinned</span>
              )}
              <span className="font-medium text-foreground">{thread.authorName}</span>
              <span>·</span>
              <span>{timeAgo(thread.createdAt)}</span>
              {thread.authorRole !== "student" && (
                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] uppercase font-bold">
                  {thread.authorRole}
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-lg leading-snug group-hover:text-primary transition mb-1">
              {thread.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">{thread.excerpt}</p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {thread.tags.slice(0, 3).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-xs text-primary">
                  <Tag className="h-3 w-3" /> {t}
                </span>
              ))}
              <span className="ml-auto inline-flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" /> {compact(thread.replies)}</span>
                <span className="inline-flex items-center gap-1"><Eye className="h-3.5 w-3.5" /> {compact(thread.views)}</span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
