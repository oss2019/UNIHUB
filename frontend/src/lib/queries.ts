// Centralised query keys + query option factories.
import { queryOptions } from "@tanstack/react-query";
import {
  authApi,
  forumApi,
  subforumApi,
  threadApi,
  commentApi,
  notificationApi,
  workRequestApi,
  ApiError,
} from "./api";

export const qk = {
  me: ["me"] as const,
  forums: ["forums"] as const,
  forum: (id: string) => ["forum", id] as const,
  subforumsByForum: (forumId: string) => ["subforums", "forum", forumId] as const,
  subforum: (id: string) => ["subforum", id] as const,
  threadsBySubforum: (id: string) => ["threads", "sub", id] as const,
  threadsByForum: (id: string) => ["threads", "forum", id] as const,
  thread: (id: string) => ["thread", id] as const,
  comments: (threadId: string) => ["comments", threadId] as const,
  notifications: ["notifications"] as const,
  unreadCount: ["notifications", "unread"] as const,
  workRequests: (subforumId: string) => ["workRequests", subforumId] as const,
  searchThreads: (q: string) => ["search", q] as const,
};

export const meQuery = () =>
  queryOptions({
    queryKey: qk.me,
    queryFn: () => authApi.me(),
    retry: (count, err) => {
      // 401 = not logged in, don't retry
      if (err instanceof ApiError && err.status === 401) return false;
      return count < 1;
    },
    staleTime: 30_000,
  });

export const forumsQuery = () =>
  queryOptions({
    queryKey: qk.forums,
    queryFn: () => forumApi.list(),
    staleTime: 30_000,
  });

export const forumQuery = (id: string) =>
  queryOptions({
    queryKey: qk.forum(id),
    queryFn: () => forumApi.get(id),
    enabled: !!id,
  });

export const subforumQuery = (id: string) =>
  queryOptions({
    queryKey: qk.subforum(id),
    queryFn: () => subforumApi.get(id),
    enabled: !!id,
  });

export const subforumsByForumQuery = (forumId: string) =>
  queryOptions({
    queryKey: qk.subforumsByForum(forumId),
    queryFn: () => subforumApi.byForum(forumId),
    enabled: !!forumId,
  });

export const threadsBySubforumQuery = (id: string) =>
  queryOptions({
    queryKey: qk.threadsBySubforum(id),
    queryFn: () => threadApi.bySubforum(id),
    enabled: !!id,
  });

export const threadsByForumQuery = (id: string) =>
  queryOptions({
    queryKey: qk.threadsByForum(id),
    queryFn: () => threadApi.byForum(id),
    enabled: !!id,
  });

export const threadQuery = (id: string) =>
  queryOptions({
    queryKey: qk.thread(id),
    queryFn: () => threadApi.get(id),
    enabled: !!id,
  });

export const commentsQuery = (threadId: string) =>
  queryOptions({
    queryKey: qk.comments(threadId),
    queryFn: () => commentApi.list(threadId),
    enabled: !!threadId,
  });

export const notificationsQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: qk.notifications,
    queryFn: () => notificationApi.list(1, 50),
    enabled,
    staleTime: 15_000,
  });

export const unreadCountQuery = (enabled: boolean) =>
  queryOptions({
    queryKey: qk.unreadCount,
    queryFn: () => notificationApi.unreadCount(),
    enabled,
    refetchInterval: enabled ? 30_000 : false,
    staleTime: 15_000,
  });

export const workRequestsQuery = (subforumId: string) =>
  queryOptions({
    queryKey: qk.workRequests(subforumId),
    queryFn: () => workRequestApi.bySubforum(subforumId),
    enabled: !!subforumId,
  });
