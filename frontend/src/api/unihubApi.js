import { API_BASE_URL, del, get, patch, post, put } from './http';
import {
  mapComment,
  mapForum,
  mapNotification,
  mapSubforum,
  mapThread,
  mapUser,
  mapWorkRequest,
} from './mappers';

export const authApi = {
  getGoogleAuthUrl() {
    return `${API_BASE_URL}/auth/google`;
  },
  getMe: async () => {
    const response = await get('/auth/me');
    return mapUser(response?.data?.user);
  },
  logout: async () => post('/auth/logout'),
};

export const forumApi = {
  getForums: async () => {
    const response = await get('/api/forums');
    return (response?.data?.forums || []).map(mapForum);
  },
  getForumDetails: async (forumId) => {
    const response = await get(`/api/forums/${forumId}`);
    const details = response?.data?.forumDetails || {};
    return {
      forum: details.forum ? mapForum(details.forum) : null,
      subforums: (details.subForums || []).map(mapSubforum),
    };
  },
  getSubforums: async (forumId, search = '') => {
    const response = await get(`/api/forums/${forumId}/subforums`, search ? { search } : {});
    return (response?.data?.subForums || []).map(mapSubforum);
  },
  requestForum: async (payload) => {
    const response = await post('/api/forum-requests', payload);
    return response;
  },
  getMyForumRequests: async () => {
    const response = await get('/api/forum-requests/my');
    return response?.data?.requests || [];
  },
  getForumRequests: async (status) => {
    const response = await get('/api/forum-requests', status ? { status } : {});
    return response?.data?.requests || [];
  },
  reviewForumRequest: async (requestId, payload) => {
    const response = await patch(`/api/forum-requests/${requestId}/review`, payload);
    return response?.data || null;
  },
};

export const subforumApi = {
  getSubforum: async (subforumId) => {
    const response = await get(`/api/subforums/${subforumId}`);
    return mapSubforum(response?.data?.subForum);
  },
  join: async (subforumId) => post(`/api/subforums/${subforumId}/join`),
  leave: async (subforumId) => post(`/api/subforums/${subforumId}/leave`),
  mute: async (subforumId) => post(`/api/subforums/${subforumId}/mute`),
  unmute: async (subforumId) => post(`/api/subforums/${subforumId}/unmute`),
  requestSubforum: async (forumId, payload) => post(`/api/forums/${forumId}/subforum-requests`, payload),
  getMySubforumRequests: async () => {
    const response = await get('/api/subforum-requests/my');
    return response?.data?.requests || [];
  },
  getSubforumRequests: async (status) => {
    const response = await get('/api/subforum-requests', status ? { status } : {});
    return response?.data?.requests || [];
  },
  reviewSubforumRequest: async (requestId, payload) => {
    const response = await patch(`/api/subforum-requests/${requestId}/review`, payload);
    return response?.data || null;
  },
};

export const userApi = {
  getUser: async (userId) => {
    const response = await get(`/api/users/${userId}`);
    return mapUser(response?.data?.user);
  },
  updateUser: async (userId, payload) => {
    const response = await patch(`/api/users/${userId}`, payload);
    return mapUser(response?.data?.user);
  },
};

export const threadApi = {
  createThread: async (payload) => {
    const response = await post('/api/threads', payload);
    return mapThread(response?.data?.thread);
  },
  searchThreads: async ({ q, page = 1, limit = 20 }) => {
    const response = await get('/api/threads/search', { q, page, limit });
    const pagination = response?.data?.pagination || {};
    return {
      threads: (pagination.threads || []).map(mapThread),
      totalCount: pagination.totalCount || 0,
      hasMore: Boolean(pagination.hasMore),
    };
  },
  getThreadsBySubforum: async (subforumId, page = 1, limit = 20) => {
    const response = await get(`/api/threads/subforums/${subforumId}`, { page, limit });
    const pagination = response?.data?.pagination || {};
    return {
      threads: (pagination.threads || []).map(mapThread),
      totalCount: pagination.totalCount || 0,
      hasMore: Boolean(pagination.hasMore),
    };
  },
  getThreadsByForum: async (forumId, page = 1, limit = 20) => {
    const response = await get(`/api/threads/forums/${forumId}`, { page, limit });
    const pagination = response?.data?.pagination || {};
    return {
      threads: (pagination.threads || []).map(mapThread),
      totalCount: pagination.totalCount || 0,
      hasMore: Boolean(pagination.hasMore),
    };
  },
  getThread: async (threadId) => {
    const response = await get(`/api/threads/${threadId}`);
    return mapThread(response?.data?.thread);
  },
  updateThread: async (threadId, payload) => {
    const response = await patch(`/api/threads/${threadId}`, payload);
    return mapThread(response?.data?.thread);
  },
  deleteThread: async (threadId) => del(`/api/threads/${threadId}`),
  getUserThreads: async (userId, page = 1, limit = 20) => {
    const response = await get(`/api/dummy/users/${userId}/threads`, { page, limit });
    const pagination = response?.data?.pagination || {};
    return {
      threads: (pagination.threads || []).map(mapThread),
      totalCount: pagination.totalCount || 0,
      hasMore: Boolean(pagination.hasMore),
    };
  },
};

export const commentApi = {
  getThreadComments: async (threadId) => {
    const response = await get(`/api/comments/threads/${threadId}/comments`);
    return (response?.data?.comments || []).map(mapComment);
  },
  getComment: async (commentId) => {
    const response = await get(`/api/comments/${commentId}`);
    return mapComment(response?.data?.comment);
  },
  createComment: async ({ threadId, content, parentCommentId, attachmentFile }) => {
    if (attachmentFile) {
      const formData = new FormData();
      formData.append('content', content);
      if (parentCommentId) {
        formData.append('parentCommentId', parentCommentId);
      }
      formData.append('attachment', attachmentFile);

      const response = await post(`/api/comments/threads/${threadId}/comments`, formData);
      return mapComment(response?.data?.comment);
    }

    const response = await post(`/api/comments/threads/${threadId}/comments`, {
      content,
      ...(parentCommentId ? { parentCommentId } : {}),
    });
    return mapComment(response?.data?.comment);
  },
  updateComment: async ({ commentId, content, attachmentFile }) => {
    if (attachmentFile) {
      const formData = new FormData();
      formData.append('content', content);
      formData.append('attachment', attachmentFile);
      const response = await put(`/api/comments/${commentId}`, formData);
      return mapComment(response?.data?.comment);
    }

    const response = await put(`/api/comments/${commentId}`, { content });
    return mapComment(response?.data?.comment);
  },
  deleteComment: async (commentId) => del(`/api/comments/${commentId}`),
  deleteAttachment: async (commentId) => del(`/api/comments/${commentId}/attachment`),
  reportComment: async (commentId) => post(`/api/comments/${commentId}/report`),
};

export const notificationApi = {
  getNotifications: async ({ page = 1, limit = 20, unreadOnly = false } = {}) => {
    const response = await get('/api/notifications', { page, limit, unreadOnly: String(unreadOnly) });
    return {
      notifications: (response?.data?.notifications || []).map(mapNotification),
      totalCount: response?.results || 0,
    };
  },
  getUnreadCount: async () => {
    const response = await get('/api/notifications/unread-count');
    return response?.data?.unreadCount || 0;
  },
  readAll: async () => patch('/api/notifications/read-all'),
  readOne: async (notificationId) => patch(`/api/notifications/${notificationId}/read`),
  remove: async (notificationId) => del(`/api/notifications/${notificationId}`),
};

export const workRequestApi = {
  createWorkRequest: async (subforumId, payload) => {
    const response = await post(`/api/subforums/${subforumId}/work-requests`, payload);
    return mapWorkRequest(response?.data?.workRequest);
  },
  getWorkRequestsBySubforum: async (subforumId, status) => {
    const response = await get(`/api/subforums/${subforumId}/work-requests`, status ? { status } : {});
    return (response?.data?.workRequests || []).map(mapWorkRequest);
  },
  updateWorkRequest: async (workRequestId, payload) => {
    const response = await patch(`/api/work-requests/${workRequestId}`, payload);
    return mapWorkRequest(response?.data?.workRequest);
  },
  getMyWorkRequests: async () => {
    const response = await get('/api/work-requests/mine');
    return (response?.data?.workRequests || []).map(mapWorkRequest);
  },
};
