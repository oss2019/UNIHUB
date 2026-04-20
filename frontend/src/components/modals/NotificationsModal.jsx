import { Bell, Check, CheckCheck, X } from 'lucide-react';
import { Button } from '../ui';

const typeConfig = {
  THREAD_MENTION: {
    title: 'You were mentioned in a thread',
    tone: 'text-cyan-500',
  },
  REPLY: {
    title: 'Someone replied to your comment',
    tone: 'text-emerald-500',
  },
  default: {
    title: 'New activity',
    tone: 'text-slate-500',
  },
};

function getTypeMeta(type) {
  return typeConfig[type] || typeConfig.default;
}

export default function NotificationsModal({
  isOpen,
  isDarkMode,
  notifications = [],
  onClose,
  onMarkRead,
  onMarkAllRead,
  onOpenNotification,
  onDeleteNotification,
}) {
  if (!isOpen) return null;

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  return (
    <div
      className="fixed inset-0 z-70 flex items-start justify-center overflow-y-auto bg-black/45 p-4 sm:p-6 md:p-10"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Notifications"
    >
      <div
        className={`mt-8 w-full max-w-xl overflow-hidden rounded-3xl border shadow-xl sm:mt-12 md:mt-16 ${isDarkMode ? 'border-white/10 bg-slate-950 text-slate-100' : 'border-slate-200 bg-white text-slate-900'}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div className={`flex items-center justify-between border-b px-5 py-4 ${isDarkMode ? 'border-white/10' : 'border-slate-200'}`}>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.26em] opacity-50">Inbox</p>
            <h2 className="mt-1 text-lg font-semibold">Notifications</h2>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" isDarkMode={isDarkMode} onClick={onMarkAllRead}>
                <CheckCheck className="h-4 w-4" /> Mark all read
              </Button>
            )}
            <button
              type="button"
              onClick={onClose}
              className={`rounded-full p-2 transition-colors ${isDarkMode ? 'hover:bg-white/10' : 'hover:bg-slate-100'}`}
              aria-label="Close notifications"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="max-h-[calc(100dvh-12rem)] overflow-y-auto p-4 sm:max-h-[calc(100dvh-14rem)] md:max-h-[calc(100dvh-16rem)]">
          {notifications.length === 0 ? (
            <div className={`flex flex-col items-center rounded-2xl border px-4 py-12 text-center ${isDarkMode ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
              <Bell className="h-6 w-6 text-cyan-500" />
              <p className="mt-3 font-semibold">No notifications yet</p>
              <p className="mt-1 text-sm opacity-70">Activity from mentions and replies will appear here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification) => {
                const typeMeta = getTypeMeta(notification.type);

                return (
                  <div
                    key={notification.id}
                    onClick={() => onOpenNotification?.(notification)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault();
                        onOpenNotification?.(notification);
                      }
                    }}
                    className={`rounded-2xl border p-4 transition-colors ${
                      notification.isRead
                        ? isDarkMode
                          ? 'border-white/10 bg-white/5'
                          : 'border-slate-200 bg-slate-50'
                        : isDarkMode
                          ? 'border-cyan-400/30 bg-cyan-500/10'
                          : 'border-cyan-200 bg-cyan-50/70'
                    } ${onOpenNotification ? 'cursor-pointer' : ''}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className={`text-xs font-semibold uppercase tracking-[0.24em] ${typeMeta.tone}`}>{notification.type.replace('_', ' ')}</p>
                        <p className="mt-1 text-sm font-semibold">{notification.message || typeMeta.title}</p>
                        <p className="mt-1 text-sm opacity-75">
                          Sender: <span className="font-medium">{notification.sender}</span>
                        </p>
                        <p className="mt-0.5 text-sm opacity-75">
                          {notification.entityType}: <span className="font-medium">{notification.entityId}</span>
                        </p>
                        <p className="mt-2 text-xs opacity-60">{notification.createdAt}</p>
                      </div>

                      {!notification.isRead && (
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            onMarkRead(notification.id);
                          }}
                          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${isDarkMode ? 'bg-white/10 hover:bg-white/20' : 'bg-white hover:bg-slate-100 border border-slate-200'}`}
                        >
                          <Check className="h-3.5 w-3.5" /> Read
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          onDeleteNotification?.(notification.id);
                        }}
                        className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition-colors ${isDarkMode ? 'bg-red-500/20 hover:bg-red-500/30 text-red-200' : 'bg-red-50 hover:bg-red-100 text-red-700 border border-red-200'}`}
                      >
                        <X className="h-3.5 w-3.5" /> Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
