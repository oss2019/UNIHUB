function getUserDisplayName(user) {
  if (!user) return 'Unknown user';
  return user.name || user.email || 'Unknown user';
}

function formatRelativeDate(value) {
  if (!value) return 'just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);

  const now = Date.now();
  const diffMs = now - date.getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return 'just now';
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}m ago`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}h ago`;
  return `${Math.floor(diffMs / day)}d ago`;
}

export function mapUser(user) {
  if (!user) return null;

  return {
    id: user._id || user.id,
    name: user.name || user.email || 'User',
    email: user.email || '',
    role: user.role || 'student',
    avatar: user.avatar || '',
    graduationYear: user.graduationYear || null,
    branch: user.branch || '',
    bio: user.bio || '',
    joinedSubForums: user.joinedSubForums || [],
    mutedSubForums: user.mutedSubForums || [],
  };
}

export function mapForum(forum) {
  return {
    id: forum._id,
    name: forum.name,
    description: forum.description || '',
    icon: forum.type === 'collab' ? '🤝' : '💬',
    type: forum.type,
    members: 0,
    threadCount: 0,
    subforumCount: forum.subForumCount || 0,
    subforums: [],
    isActive: forum.isActive,
    isApproved: forum.isApproved,
  };
}

export function mapSubforum(subforum) {
  return {
    id: subforum._id,
    name: subforum.name,
    description: subforum.description || '',
    tags: subforum.tags || [],
    threadCount: subforum.threadCount || 0,
    activeNow: 0,
    createdBy: subforum.createdBy,
    isActive: subforum.isActive,
    threads: [],
  };
}

export function mapThread(thread) {
  const subForumId = thread.subForum?._id || thread.subForum || null;
  const forumId = thread.forum?._id || thread.forum || null;

  return {
    id: thread._id,
    title: thread.title,
    excerpt: (thread.content || '').slice(0, 140),
    content: thread.content || '',
    author: getUserDisplayName(thread.author),
    authorId: thread.author?._id || thread.author,
    authorRole: thread.author?.role || 'student',
    createdAt: formatRelativeDate(thread.createdAt),
    createdAtRaw: thread.createdAt,
    views: 0,
    replies: thread.commentCount || 0,
    likes: 0,
    tags: thread.tags || [],
    attachments: thread.attachments || [],
    isPinned: Boolean(thread.isPinned),
    isSolved: false,
    notifyAlumni: Boolean(thread.notifyAlumni),
    warnings: thread.warnings || [],
    forumId,
    subForumId,
    comments: [],
  };
}

export function mapComment(comment) {
  const threadId = comment.thread?._id || comment.thread || null;

  return {
    id: comment._id,
    author: getUserDisplayName(comment.author),
    authorId: comment.author?._id || comment.author,
    content: comment.content,
    timestamp: formatRelativeDate(comment.createdAt),
    createdAtRaw: comment.createdAt,
    votes: 0,
    attachments: comment.attachments ? [comment.attachments] : [],
    parentComment: comment.parentComment,
    threadId,
    replies: (comment.replies || []).map(mapComment),
    isDeleted: Boolean(comment.isDeleted),
    reportCount: comment.reportCount || 0,
  };
}

export function mapNotification(notification) {
  return {
    id: notification._id,
    sender: getUserDisplayName(notification.sender),
    senderRaw: notification.sender,
    type: notification.type,
    entityId: notification.entityId,
    entityType: notification.entityType,
    message: notification.message,
    isRead: Boolean(notification.isRead),
    isEmailed: Boolean(notification.isEmailed),
    createdAt: formatRelativeDate(notification.createdAt),
    createdAtRaw: notification.createdAt,
  };
}

export function mapWorkRequest(workRequest) {
  return {
    id: workRequest._id,
    title: workRequest.title,
    description: workRequest.description || '',
    raisedBy: getUserDisplayName(workRequest.raisedBy),
    raisedByRaw: workRequest.raisedBy,
    requiredSkills: workRequest.requiredSkills || [],
    status: workRequest.status,
    createdAt: formatRelativeDate(workRequest.createdAt),
    createdAtRaw: workRequest.createdAt,
    targetSubForums: workRequest.targetSubForums || [],
    sourceSubForum: workRequest.sourceSubForum || null,
  };
}
