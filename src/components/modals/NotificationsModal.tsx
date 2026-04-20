import { useStore } from "@/lib/store";
import { Modal } from "../Modal";
import { useNavigate } from "@tanstack/react-router";
import { Bell, AtSign, Sparkles, CheckCheck, Trash2, MessageSquare } from "lucide-react";
import { timeAgo } from "@/lib/format";

const iconFor = (t: string) => {
  if (t === "reply") return MessageSquare;
  if (t === "mention") return AtSign;
  if (t === "system") return Sparkles;
  return Bell;
};

export function NotificationsModal() {
  const { notifOpen, setNotifOpen, notifications, markNotifRead, markAllNotifRead, removeNotif, threads, forums } = useStore();
  const navigate = useNavigate();

  const open = (id: string, threadId?: string) => {
    markNotifRead(id);
    if (threadId) {
      const th = threads.find((t) => t.id === threadId);
      const slug = forums.find((f) => f.id === th?.forumId)?.slug;
      if (th && slug) {
        setNotifOpen(false);
        navigate({ to: "/f/$slug/$subId/$threadId", params: { slug, subId: th.subforumId, threadId: th.id } });
      }
    }
  };

  return (
    <Modal open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifications" maxWidth="max-w-md">
      <div className="px-6 py-3 flex items-center justify-between border-b border-border">
        <span className="text-xs text-muted-foreground">{notifications.filter((n) => !n.isRead).length} unread</span>
        <button onClick={markAllNotifRead} className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline">
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </button>
      </div>
      <ul className="divide-y divide-border">
        {notifications.length === 0 && (
          <li className="p-10 text-center text-sm text-muted-foreground">You're all caught up ✨</li>
        )}
        {notifications.map((n) => {
          const Icon = iconFor(n.type);
          return (
            <li
              key={n.id}
              onClick={() => open(n.id, n.threadId)}
              className={`group flex gap-3 px-6 py-4 cursor-pointer hover:bg-secondary/50 ${!n.isRead ? "bg-primary/5" : ""}`}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {n.sender && <span className="font-semibold">{n.sender} </span>}
                  <span className="text-foreground/80">{n.message}</span>
                </p>
                <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removeNotif(n.id); }}
                className="opacity-0 group-hover:opacity-100 self-start p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive transition"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
              {!n.isRead && <span className="self-center h-2 w-2 rounded-full bg-primary" />}
            </li>
          );
        })}
      </ul>
    </Modal>
  );
}
