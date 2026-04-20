// Thin fetch wrapper with cookie auth + 401 → /auth/refresh → retry once.
// All requests target VITE_API_BASE_URL (default http://localhost:5000).
import type {
  User, Forum, SubForum, Thread, Comment, Notification, WorkRequest,
  ForumRequest, SubForumRequest, Paginated, RequestStatus, ForumType,
} from "./types";

export const API_BASE =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ||
  "http://localhost:5000";

export class ApiError extends Error {
  constructor(public status: number, message: string, public payload?: unknown) {
    super(message);
  }
}

let refreshing: Promise<boolean> | null = null;

async function doRefresh(): Promise<boolean> {
  if (refreshing) return refreshing;
  refreshing = fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    credentials: "include",
  })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => {
      refreshing = null;
    });
  return refreshing;
}

type RequestOptions = {
  method?: string;
  body?: unknown;
  query?: Record<string, string | number | boolean | undefined>;
  formData?: FormData;
  // when true, do NOT attempt refresh on 401 (used by /auth/refresh + /auth/me bootstrap)
  noRefresh?: boolean;
};

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, query, formData, noRefresh } = opts;

  const url = new URL(`${API_BASE}${path}`);
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, String(v));
    });
  }

  const init: RequestInit = {
    method,
    credentials: "include",
    headers: {},
  };

  if (formData) {
    init.body = formData;
  } else if (body !== undefined) {
    (init.headers as Record<string, string>)["Content-Type"] = "application/json";
    init.body = JSON.stringify(body);
  }

  let res: Response;
  try {
    res = await fetch(url.toString(), init);
  } catch {
    throw new ApiError(0, "Network error — is the backend running on " + API_BASE + "?");
  }

  if (res.status === 401 && !noRefresh && !path.startsWith("/auth/")) {
    const ok = await doRefresh();
    if (ok) {
      // retry once
      try {
        res = await fetch(url.toString(), init);
      } catch {
        throw new ApiError(0, "Network error after refresh.");
      }
    }
  }

  let data: any = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const msg =
      (data && typeof data === "object" && "message" in data && data.message) ||
      `Request failed (${res.status})`;
    throw new ApiError(res.status, String(msg), data);
  }

  return data as T;
}

// helper to unwrap { data: { key: T } }
const data = <T>(p: Promise<{ data?: T } | any>): Promise<T> =>
  p.then((r) => (r && r.data ? r.data : r));

// ───────── Auth ─────────
export const authApi = {
  googleUrl: () => `${API_BASE}/auth/google`,
  me: () => data<{ user: User }>(request("/auth/me", { noRefresh: false })).then((d) => d.user),
  refresh: () => request<{ status: string }>("/auth/refresh", { method: "POST", noRefresh: true }),
  logout: () => request<{ status: string }>("/auth/logout", { method: "POST", noRefresh: true }),
};

// ───────── Users ─────────
export const userApi = {
  get: (id: string) => data<{ user: User }>(request(`/api/users/${id}`)).then((d) => d.user),
  update: (id: string, body: Partial<User>) =>
    data<{ user: User }>(request(`/api/users/${id}`, { method: "PATCH", body })).then((d) => d.user),
  threads: (id: string, page = 1, limit = 20) =>
    data<Paginated<Thread>>(request(`/api/dummy/users/${id}/threads`, { query: { page, limit } })),
};

// ───────── Forums ─────────
export const forumApi = {
  list: () => data<{ forums: Forum[] }>(request("/api/forums")).then((d) => d.forums),
  get: (id: string) =>
    data<{ forumDetails: { forum: Forum; subForums: SubForum[] } }>(
      request(`/api/forums/${id}`),
    ).then((d) => d.forumDetails),
  update: (id: string, body: Partial<Forum>) =>
    request(`/api/forums/${id}`, { method: "PATCH", body }),
  remove: (id: string) => request(`/api/forums/${id}`, { method: "DELETE" }),
};

// ───────── Forum requests ─────────
export const forumRequestApi = {
  create: (body: { name: string; description?: string; type?: ForumType }) =>
    data<{ request: ForumRequest }>(request("/api/forum-requests", { method: "POST", body })),
  mine: () => data<{ requests: ForumRequest[] }>(request("/api/forum-requests/my")).then((d) => d.requests),
  list: (status?: RequestStatus) =>
    data<{ requests: ForumRequest[] }>(request("/api/forum-requests", { query: { status } })).then((d) => d.requests),
  review: (id: string, body: { status: "approved" | "rejected"; reviewNote?: string }) =>
    request(`/api/forum-requests/${id}/review`, { method: "PATCH", body }),
};

// ───────── Subforums ─────────
export const subforumApi = {
  byForum: (forumId: string, search?: string) =>
    data<{ subForums: SubForum[] }>(
      request(`/api/forums/${forumId}/subforums`, { query: { search } }),
    ).then((d) => d.subForums),
  get: (id: string) =>
    data<{ subForum: SubForum }>(request(`/api/subforums/${id}`)).then((d) => d.subForum),
  update: (id: string, body: Partial<SubForum>) =>
    request(`/api/subforums/${id}`, { method: "PATCH", body }),
  remove: (id: string) => request(`/api/subforums/${id}`, { method: "DELETE" }),
  join: (id: string) => request(`/api/subforums/${id}/join`, { method: "POST" }),
  leave: (id: string) => request(`/api/subforums/${id}/leave`, { method: "POST" }),
  mute: (id: string) => request(`/api/subforums/${id}/mute`, { method: "POST" }),
  unmute: (id: string) => request(`/api/subforums/${id}/unmute`, { method: "POST" }),
};

// ───────── Subforum requests ─────────
export const subforumRequestApi = {
  create: (forumId: string, body: { name: string; description?: string; tags?: string[] }) =>
    data<{ request: SubForumRequest }>(
      request(`/api/forums/${forumId}/subforum-requests`, { method: "POST", body }),
    ),
  mine: () => data<{ requests: SubForumRequest[] }>(request("/api/subforum-requests/my")).then((d) => d.requests),
  list: (status?: RequestStatus) =>
    data<{ requests: SubForumRequest[] }>(request("/api/subforum-requests", { query: { status } })).then((d) => d.requests),
  review: (id: string, body: { status: "approved" | "rejected"; reviewNote?: string }) =>
    request(`/api/subforum-requests/${id}/review`, { method: "PATCH", body }),
};

// ───────── Threads ─────────
export type CreateThreadInput = {
  title: string;
  content: string;
  subForumId: string;
  tags: string[];
  attachments?: string[]; // base64 data URLs
  notifyAlumni?: boolean;
};

export const threadApi = {
  create: (body: CreateThreadInput) =>
    data<{ thread: Thread }>(request("/api/threads", { method: "POST", body })).then((d) => d.thread),
  search: (q: string, page = 1, limit = 20) =>
    data<Paginated<Thread>>(request("/api/threads/search", { query: { q, page, limit } })),
  bySubforum: (id: string, page = 1, limit = 20) =>
    data<Paginated<Thread>>(request(`/api/threads/subforums/${id}`, { query: { page, limit } })),
  byForum: (id: string, page = 1, limit = 20) =>
    data<Paginated<Thread>>(request(`/api/threads/forums/${id}`, { query: { page, limit } })),
  get: (id: string) =>
    data<{ thread: Thread }>(request(`/api/threads/${id}`)).then((d) => d.thread),
  update: (id: string, body: Partial<Thread>) =>
    data<{ thread: Thread }>(request(`/api/threads/${id}`, { method: "PATCH", body })).then((d) => d.thread),
  remove: (id: string) => request(`/api/threads/${id}`, { method: "DELETE" }),
};

// ───────── Comments ─────────
export const commentApi = {
  list: (threadId: string) =>
    data<{ comments: Comment[] }>(request(`/api/comments/threads/${threadId}/comments`)).then((d) => d.comments),
  get: (id: string) =>
    data<{ comment: Comment }>(request(`/api/comments/${id}`)).then((d) => d.comment),
  create: (
    threadId: string,
    input: { content: string; parentCommentId?: string | null; attachment?: File | null },
  ) => {
    if (input.attachment) {
      const fd = new FormData();
      fd.append("content", input.content);
      if (input.parentCommentId) fd.append("parentCommentId", input.parentCommentId);
      fd.append("attachment", input.attachment);
      return data<{ comment: Comment }>(
        request(`/api/comments/threads/${threadId}/comments`, { method: "POST", formData: fd }),
      ).then((d) => d.comment);
    }
    return data<{ comment: Comment }>(
      request(`/api/comments/threads/${threadId}/comments`, {
        method: "POST",
        body: { content: input.content, parentCommentId: input.parentCommentId ?? undefined },
      }),
    ).then((d) => d.comment);
  },
  update: (id: string, content: string, attachment?: File | null) => {
    const fd = new FormData();
    fd.append("content", content);
    if (attachment) fd.append("attachment", attachment);
    return data<{ comment: Comment }>(
      request(`/api/comments/${id}`, { method: "PUT", formData: fd }),
    ).then((d) => d.comment);
  },
  remove: (id: string) => request(`/api/comments/${id}`, { method: "DELETE" }),
  removeAttachment: (id: string) =>
    request(`/api/comments/${id}/attachment`, { method: "DELETE" }),
  report: (id: string) => request(`/api/comments/${id}/report`, { method: "POST" }),
};

// ───────── Notifications ─────────
export const notificationApi = {
  list: (page = 1, limit = 20, unreadOnly = false) =>
    data<{ notifications: Notification[] }>(
      request("/api/notifications", { query: { page, limit, unreadOnly: String(unreadOnly) } }),
    ).then((d) => d.notifications),
  unreadCount: () =>
    data<{ unreadCount: number }>(request("/api/notifications/unread-count")).then((d) => d.unreadCount),
  readAll: () => request<{ status: string; message: string }>("/api/notifications/read-all", { method: "PATCH" }),
  readOne: (id: string) => request(`/api/notifications/${id}/read`, { method: "PATCH" }),
  remove: (id: string) => request(`/api/notifications/${id}`, { method: "DELETE" }),
};

// ───────── Work requests ─────────
export const workRequestApi = {
  create: (
    sourceSubforumId: string,
    body: {
      title: string;
      description?: string;
      targetSubForumIds: string[];
      requiredSkills?: string[];
    },
  ) =>
    data<{ workRequest: WorkRequest }>(
      request(`/api/subforums/${sourceSubforumId}/work-requests`, { method: "POST", body }),
    ).then((d) => d.workRequest),
  bySubforum: (id: string, status?: "open" | "closed") =>
    data<{ workRequests: WorkRequest[] }>(
      request(`/api/subforums/${id}/work-requests`, { query: { status } }),
    ).then((d) => d.workRequests),
  update: (id: string, body: Partial<WorkRequest>) =>
    request(`/api/work-requests/${id}`, { method: "PATCH", body }),
  mine: () =>
    data<{ workRequests: WorkRequest[] }>(request("/api/work-requests/mine")).then((d) => d.workRequests),
};

// File → base64 data URL helper for thread attachments
export const fileToDataURL = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(file);
  });
