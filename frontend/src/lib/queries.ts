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
  resourceApi,
  facultyReviewApi,
  teamApi,
  reportApi,
  ApiError,
} from "./api";
import type { TeamCategory, ReportStatus, ReportCategory } from "./types";

export const qk = {
  me: ["me"] as const,
  forums: ["forums"] as const,
  forum: (id: string) => ["forum", id] as const,
  subforumsByForum: (forumId: string) =>
    ["subforums", "forum", forumId] as const,
  subforum: (id: string) => ["subforum", id] as const,
  threadsBySubforum: (id: string) => ["threads", "sub", id] as const,
  threadsByForum: (id: string) => ["threads", "forum", id] as const,
  thread: (id: string) => ["thread", id] as const,
  comments: (threadId: string) => ["comments", threadId] as const,
  notifications: ["notifications"] as const,
  unreadCount: ["notifications", "unread"] as const,
  workRequests: (subforumId: string) => ["workRequests", subforumId] as const,
  searchThreads: (q: string) => ["search", q] as const,
  resources: (filters: Record<string, string | number | undefined>) =>
    ["resources", filters] as const,
  facultyReviews: ["facultyReviews"] as const,
  facultyReview: (id: string) => ["facultyReview", id] as const,
  teamGrouped: ["team", "grouped"] as const,
  team: (category?: string) => ["team", category ?? "all"] as const,
  myReports: (page?: number, limit?: number) =>
    ["reports", "my", { page, limit }] as const,
  allReports: (filters?: {
    status?: ReportStatus;
    category?: ReportCategory;
    page?: number;
    limit?: number;
  }) => ["reports", "all", filters] as const,
  reportStats: ["reports", "stats"] as const,
  report: (id: string) => ["report", id] as const,
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

export const resourcesQuery = (
  filters: { category?: string; semester?: number; search?: string } = {},
) =>
  queryOptions({
    queryKey: qk.resources(filters),
    queryFn: () => resourceApi.list(filters),
    staleTime: 30_000,
  });

export const facultyReviewsQuery = () =>
  queryOptions({
    queryKey: qk.facultyReviews,
    queryFn: () => facultyReviewApi.list(),
    staleTime: 60_000,
  });

export const teamGroupedQuery = () =>
  queryOptions({
    queryKey: qk.teamGrouped,
    queryFn: () => teamApi.listGrouped(),
    staleTime: 60_000,
  });

export const teamListQuery = (category?: TeamCategory) =>
  queryOptions({
    queryKey: qk.team(category),
    queryFn: () => teamApi.list(category),
    staleTime: 60_000,
  });

export const myReportsQuery = (page = 1, limit = 20, enabled = true) =>
  queryOptions({
    queryKey: qk.myReports(page, limit),
    queryFn: () => reportApi.myReports(page, limit),
    enabled,
    staleTime: 15_000,
  });

export const allReportsQuery = (
  filters: {
    status?: ReportStatus;
    category?: ReportCategory;
    page?: number;
    limit?: number;
  } = {},
  enabled = true,
) =>
  queryOptions({
    queryKey: qk.allReports(filters),
    queryFn: () => reportApi.list(filters),
    enabled,
    staleTime: 15_000,
  });

export const reportStatsQuery = (enabled = true) =>
  queryOptions({
    queryKey: qk.reportStats,
    queryFn: () => reportApi.stats(),
    enabled,
    staleTime: 15_000,
  });

