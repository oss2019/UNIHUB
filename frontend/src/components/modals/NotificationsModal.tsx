import { useUI } from "@/lib/uiStore";
import { Modal } from "../Modal";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Bell, AtSign, Sparkles, CheckCheck, Trash2, MessageSquare, Briefcase } from "lucide-react";
import { timeAgo } from "@/lib/format";
import { meQuery, notificationsQuery, qk } from "@/lib/queries";
import { notificationApi, threadApi } from "@/lib/api";
import { toast } from "sonner";
import type { NotificationType } from "@/lib/types";

const iconFor = (t: NotificationType) => {
  if (t === "COMMENT_ON_THREAD" || t === "REPLY_TO_COMMENT") return MessageSquare;
  if (t === "MENTION") return AtSign;
  if (t === "WORK_OPPORTUNITY") return Briefcase;
  if (t === "WEEKLY_DIGEST" || t === "FORTNIGHTLY_DIGEST" || t === "THRESHOLD_EMAIL") return Sparkles;
  return Bell;
};

export function NotificationsModal() {
  const { notifOpen, setNotifOpen } = useUI();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { data: user } = useQuery(meQuery());
  const { data: notifications = [], isLoading } = useQuery(notificationsQuery(notifOpen && !!user));

  const readMut = useMutation({
    mutationFn: (id: string) => notificationApi.readOne(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications });
      qc.invalidateQueries({ queryKey: qk.unreadCount });
    },
  });
  const readAllMut = useMutation({
    mutationFn: () => notificationApi.readAll(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications });
      qc.invalidateQueries({ queryKey: qk.unreadCount });
      toast.success("All marked as read");
    },
  });
  const removeMut = useMutation({
    mutationFn: (id: string) => notificationApi.remove(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.notifications });
      qc.invalidateQueries({ queryKey: qk.unreadCount });
    },
  });

  const open = async (id: string, entityId: string, entityType: string) => {
    if (!notifications.find((n) => n._id === id)?.isRead) readMut.mutate(id);
    if (entityType === "Thread") {
      try {
        const thread = await threadApi.get(entityId);
        setNotifOpen(false);
        navigate(`/f/${thread.forum}/${thread.subForum}/${thread._id}`);
      } catch (e) {
        toast.error((e as Error).message);
      }
    } else if (entityType === "Comment") {
      // resolve comment → thread
      try {
        const { commentApi } = await import("@/lib/api");
        const c = await commentApi.get(entityId);
        const thread = await threadApi.get(c.thread);
        setNotifOpen(false);
        navigate(`/f/${thread.forum}/${thread.subForum}/${thread._id}`);
      } catch (e) {
        toast.error((e as Error).message);
      }
    }
  };

  const unread = notifications.filter((n) => !n.isRead).length;

  return (
    <Modal open={notifOpen} onClose={() => setNotifOpen(false)} title="Notifications" maxWidth="max-w-md">
      <div className="px-6 py-3 flex items-center justify-between border-b border-border">
        <span className="text-xs text-muted-foreground">{unread} unread</span>
        <button
          onClick={() => readAllMut.mutate()}
          disabled={readAllMut.isPending || unread === 0}
          className="text-xs font-medium text-primary inline-flex items-center gap-1 hover:underline disabled:opacity-50"
        >
          <CheckCheck className="h-3.5 w-3.5" /> Mark all read
        </button>
      </div>
      <ul className="divide-y divide-border">
        {isLoading && (
          <li className="p-10 text-center text-sm text-muted-foreground">Loading…</li>
        )}
        {!isLoading && notifications.length === 0 && (
          <li className="p-10 text-center text-sm text-muted-foreground">You're all caught up ✨</li>
        )}
        {notifications.map((n) => {
          const Icon = iconFor(n.type);
          return (
            <li
              key={n._id}
              onClick={() => open(n._id, n.entityId, n.entityType)}
              className={`group flex gap-3 px-6 py-4 cursor-pointer hover:bg-secondary/50 ${!n.isRead ? "bg-primary/5" : ""}`}
            >
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm">
                  {n.sender?.name && <span className="font-semibold">{n.sender.name} </span>}
                  <span className="text-foreground/80">{n.message}</span>
                </p>
                <span className="text-[11px] text-muted-foreground">{timeAgo(n.createdAt)}</span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeMut.mutate(n._id);
                }}
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
