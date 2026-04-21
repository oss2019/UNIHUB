// Backend response types — mirror docs at /api docs v1.1

export type Role = "student" | "alumni" | "admin";
export type ForumType = "normal" | "collab";
export type RequestStatus = "pending" | "approved" | "rejected";

export type User = {
  _id: string;
  id?: string;
  email: string;
  name: string;
  avatar?: string;
  role: Role;
  graduationYear?: number;
  branch?: string;
  company?: string;
  designation?: string;
  bio?: string;
  linkedin?: string;
  github?: string;
  joinedSubForums?: string[];
  mutedSubForums?: string[];
  joinedForums?: string[];
};

export type Forum = {
  _id: string;
  name: string;
  description?: string;
  type: ForumType;
  isActive: boolean;
  isApproved: boolean;
  createdBy?: { _id: string; name: string };
  subForumCount?: number;
  createdAt: string;
  updatedAt: string;
};

export type SubForum = {
  _id: string;
  name: string;
  description?: string;
  tags: string[];
  forum: string | { _id: string; name: string; description?: string };
  createdBy?: { _id: string; name: string };
  isActive: boolean;
  threadCount?: number;
};

export type Thread = {
  _id: string;
  title: string;
  content: string;
  author: { _id: string; name: string; avatar?: string; role?: Role };
  subForum: string;
  forum: string;
  tags: string[];
  attachments: string[];
  commentCount: number;
  isPinned: boolean;
  notifyAlumni: boolean;
  warnings?: string[];
  createdAt: string;
  updatedAt: string;
};

export type Comment = {
  _id: string;
  content: string;
  author: { _id: string; name: string; email?: string; role?: Role; avatar?: string };
  thread: string;
  parentComment: string | null;
  isDeleted: boolean;
  attachments?: string;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
};

export type NotificationType =
  | "COMMENT_ON_THREAD"
  | "REPLY_TO_COMMENT"
  | "MENTION"
  | "NEW_COLLAB_THREAD"
  | "WORK_OPPORTUNITY"
  | "THRESHOLD_EMAIL"
  | "WEEKLY_DIGEST"
  | "FORTNIGHTLY_DIGEST";

export type Notification = {
  _id: string;
  recipient: string;
  sender?: { _id: string; name: string; avatar?: string } | null;
  type: NotificationType;
  entityId: string;
  entityType: "Thread" | "Comment" | "Message" | "WorkRequest";
  message: string;
  isRead: boolean;
  isEmailed: boolean;
  createdAt: string;
};

export type WorkRequest = {
  _id: string;
  raisedBy: { _id: string; name: string; email?: string; avatar?: string };
  sourceSubForum: { _id: string; name: string };
  targetSubForums: { _id: string; name: string }[];
  title: string;
  description?: string;
  requiredSkills: string[];
  status: "open" | "closed";
  createdAt: string;
};

export type ForumRequest = {
  _id: string;
  name: string;
  description?: string;
  type: ForumType;
  status: RequestStatus;
  reviewedBy?: { _id: string; name: string } | null;
  reviewNote?: string | null;
  forumCreated?: string | null;
  requestedBy: string | { _id: string; name: string };
  createdAt: string;
};

export type SubForumRequest = {
  _id: string;
  forum: string | { _id: string; name: string };
  name: string;
  description?: string;
  tags: string[];
  status: RequestStatus;
  reviewedBy?: { _id: string; name: string } | null;
  reviewNote?: string | null;
  subForumCreated?: string | null;
  requestedBy: string | { _id: string; name: string };
  createdAt: string;
};

export type Paginated<T> = {
  pagination: {
    threads?: T[];
    totalCount: number;
    hasMore: boolean;
  };
};
