// UI-only state. Server state lives in TanStack Query.
import { create } from "zustand";

type UI = {
  isDark: boolean;
  authOpen: boolean;
  createOpen: boolean;
  notifOpen: boolean;
  // when set, CreatePost modal opens with this subforum preselected
  createDefaultSubforumId: string | null;
  toggleDark: () => void;
  setAuthOpen: (v: boolean) => void;
  setCreateOpen: (v: boolean, defaultSubforumId?: string | null) => void;
  setNotifOpen: (v: boolean) => void;
};

export const useUI = create<UI>((set) => ({
  isDark: true,
  authOpen: false,
  createOpen: false,
  notifOpen: false,
  createDefaultSubforumId: null,
  toggleDark: () => set((s) => ({ isDark: !s.isDark })),
  setAuthOpen: (v) => set({ authOpen: v }),
  setCreateOpen: (v, defaultSubforumId = null) =>
    set({ createOpen: v, createDefaultSubforumId: v ? defaultSubforumId : null }),
  setNotifOpen: (v) => set({ notifOpen: v }),
}));
