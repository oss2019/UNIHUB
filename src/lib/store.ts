import { create } from "zustand";
import {
  currentUser as initialUser,
  forums as initialForums,
  threads as initialThreads,
  notifications as initialNotifs,
  commentsByThread as initialComments,
  type User,
  type Forum,
  type Thread,
  type Notification,
  type Comment,
} from "./mockData";

type State = {
  user: User | null;
  forums: Forum[];
  threads: Thread[];
  comments: Record<string, Comment[]>;
  notifications: Notification[];
  isDark: boolean;
  // modals
  authOpen: boolean;
  createOpen: boolean;
  notifOpen: boolean;
};

type Actions = {
  toggleDark: () => void;
  setAuthOpen: (v: boolean) => void;
  setCreateOpen: (v: boolean) => void;
  setNotifOpen: (v: boolean) => void;
  login: () => void;
  logout: () => void;
  joinSubforum: (id: string) => void;
  leaveSubforum: (id: string) => void;
  muteSubforum: (id: string) => void;
  unmuteSubforum: (id: string) => void;
  createThread: (input: {
    forumId: string;
    subforumId: string;
    title: string;
    content: string;
    tags: string[];
  }) => Thread;
  addComment: (threadId: string, content: string, parentId?: string | null) => void;
  markNotifRead: (id: string) => void;
  markAllNotifRead: () => void;
  removeNotif: (id: string) => void;
  unreadCount: () => number;
};

const findAndAppendReply = (list: Comment[], parentId: string, reply: Comment): Comment[] =>
  list.map((c) =>
    c.id === parentId
      ? { ...c, replies: [...c.replies, reply] }
      : { ...c, replies: findAndAppendReply(c.replies, parentId, reply) },
  );

export const useStore = create<State & Actions>((set, get) => ({
  user: initialUser,
  forums: initialForums,
  threads: initialThreads,
  comments: initialComments,
  notifications: initialNotifs,
  isDark: true,
  authOpen: false,
  createOpen: false,
  notifOpen: false,

  toggleDark: () => set((s) => ({ isDark: !s.isDark })),
  setAuthOpen: (v) => set({ authOpen: v }),
  setCreateOpen: (v) => set({ createOpen: v }),
  setNotifOpen: (v) => set({ notifOpen: v }),

  login: () => set({ user: initialUser, authOpen: false }),
  logout: () => set({ user: null, authOpen: false }),

  joinSubforum: (id) =>
    set((s) =>
      s.user
        ? { user: { ...s.user, joinedSubForums: [...new Set([...s.user.joinedSubForums, id])] } }
        : s,
    ),
  leaveSubforum: (id) =>
    set((s) =>
      s.user
        ? { user: { ...s.user, joinedSubForums: s.user.joinedSubForums.filter((x) => x !== id) } }
        : s,
    ),
  muteSubforum: (id) =>
    set((s) =>
      s.user
        ? { user: { ...s.user, mutedSubForums: [...new Set([...s.user.mutedSubForums, id])] } }
        : s,
    ),
  unmuteSubforum: (id) =>
    set((s) =>
      s.user
        ? { user: { ...s.user, mutedSubForums: s.user.mutedSubForums.filter((x) => x !== id) } }
        : s,
    ),

  createThread: ({ forumId, subforumId, title, content, tags }) => {
    const user = get().user ?? initialUser;
    const t: Thread = {
      id: `t_${Date.now()}`,
      forumId,
      subforumId,
      title,
      excerpt: content.slice(0, 140),
      content,
      authorId: user.id,
      authorName: user.name,
      authorRole: user.role,
      createdAt: new Date().toISOString(),
      views: 1,
      replies: 0,
      likes: 0,
      tags,
    };
    set((s) => ({ threads: [t, ...s.threads], createOpen: false }));
    return t;
  },

  addComment: (threadId, content, parentId = null) => {
    const user = get().user ?? initialUser;
    const c: Comment = {
      id: `c_${Date.now()}`,
      threadId,
      parentId,
      authorId: user.id,
      authorName: user.name,
      content,
      createdAt: new Date().toISOString(),
      votes: 0,
      replies: [],
    };
    set((s) => {
      const existing = s.comments[threadId] ?? [];
      const updated = parentId ? findAndAppendReply(existing, parentId, c) : [...existing, c];
      return { comments: { ...s.comments, [threadId]: updated } };
    });
  },

  markNotifRead: (id) =>
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)) })),
  markAllNotifRead: () =>
    set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, isRead: true })) })),
  removeNotif: (id) =>
    set((s) => ({ notifications: s.notifications.filter((n) => n.id !== id) })),

  unreadCount: () => get().notifications.filter((n) => !n.isRead).length,
}));
