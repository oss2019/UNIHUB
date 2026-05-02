import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { MessageCircle, Pin, Tag } from "lucide-react";
import type { Thread } from "@/lib/types";
import { timeAgo, compact } from "@/lib/format";

export function ThreadCard({ thread, index = 0 }: { thread: Thread; index?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.3 }}
    >
      <Link
        to={`/f/${thread.forum}/${thread.subForum}/${thread._id}`}
        className="group block rounded-2xl border border-border bg-card hover:border-primary/50 hover:shadow-card transition-all p-5"
      >
        <div className="flex items-start gap-4">
          {/* <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground text-sm font-bold overflow-hidden">
            {thread.author?.avatar ? (
              <img src={thread.author.avatar} alt={thread.author.name} className="h-full w-full object-cover" />
            ) : (
              (thread.author?.name?.charAt(0) ?? "?").toUpperCase()
            )}
          </div> */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 text-xs text-muted-foreground flex-wrap">
              {thread.isPinned && (
                <span className="inline-flex items-center gap-1 text-warning">
                  <Pin className="h-3 w-3" /> Pinned
                </span>
              )}
              <span className="font-medium text-foreground">{thread.author?.name ?? "Unknown"}</span>
              <span>·</span>
              <span>{timeAgo(thread.createdAt)}</span>
              {thread.author?.role && thread.author.role !== "student" && (
                <span className="px-1.5 py-0.5 rounded bg-primary/15 text-primary text-[10px] uppercase font-bold">
                  {thread.author.role}
                </span>
              )}
            </div>
            <h3 className="font-display font-bold text-lg leading-snug group-hover:text-primary transition mb-1">
              {thread.title}
            </h3>
            <p className="text-sm text-muted-foreground line-clamp-2">
              {thread.content?.slice(0, 200)}
            </p>
            <div className="flex flex-wrap items-center gap-3 mt-3">
              {thread.tags?.slice(0, 3).map((t) => (
                <span key={t} className="inline-flex items-center gap-1 text-xs text-primary">
                  <Tag className="h-3 w-3" /> {t}
                </span>
              ))}
              <span className="ml-auto inline-flex items-center gap-3 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="h-3.5 w-3.5" /> {compact(thread.commentCount ?? 0)}
                </span>
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
