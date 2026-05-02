import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import * as emailService from './emailService.js';

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION SERVICE
// Central service for creating and managing notifications.
// All functions filter out muted sub-forums automatically.
//
// NOTE: No try-catch here — errors propagate to the calling controller's
// catchAsync wrapper, which forwards them to the global error handler.
// ─────────────────────────────────────────────────────────────────────────────

// ──────────────────────────── THRESHOLD CONSTANT ─────────────────────────────
const UNREAD_THRESHOLD = 50;

/**
 * checkThresholdEmail — After creating notification(s), checks if the
 * recipient has 50+ unread notifications. If so, sends an email alert
 * (once — a THRESHOLD_EMAIL notification is created to prevent duplicates).
 *
 * When the user reads their notifications (marking them read), the
 * THRESHOLD_EMAIL record is also marked read, allowing a future alert
 * if unread count crosses 50 again.
 *
 * @param {ObjectId} userId - The user to check
 */
const checkThresholdEmail = async (userId) => {
  const unreadCount = await Notification.countDocuments({
    recipient: userId,
    isRead: false,
  });

  if (unreadCount < UNREAD_THRESHOLD) return;

  // Check if we already have an unread THRESHOLD_EMAIL for this user
  // (the partial unique index also enforces this, but checking avoids the error)
  const existing = await Notification.findOne({
    recipient: userId,
    type: 'THRESHOLD_EMAIL',
    isRead: false,
  }).lean();

  if (existing) return; // Already sent, hasn't been read yet

  // Create the threshold notification marker
  await Notification.create({
    recipient: userId,
    sender: null,
    type: 'THRESHOLD_EMAIL',
    entityId: userId, // Self-referencing — no specific entity
    entityType: 'Message',
    message: `You have ${unreadCount}+ unread notifications. Check them out!`,
  });

  // Send the actual email
  const user = await User.findById(userId).select('name email').lean();
  if (user?.email) {
    await emailService.sendInstantNotificationEmail(user, {
      message: `You have ${unreadCount}+ unread notifications on UNIHUB. Log in to check them out!`,
    });
  }
};

/**
 * notifyThreadOwner — Instant notification when someone comments on a thread.
 *
 * @param {Object} opts
 * @param {ObjectId} opts.threadId       - The thread that was commented on
 * @param {ObjectId} opts.threadOwnerId  - The thread author
 * @param {ObjectId} opts.commenterId    - Who posted the comment
 * @param {ObjectId} opts.commentId      - The new comment
 * @param {ObjectId} opts.subForumId     - The sub-forum the thread belongs to
 * @param {Boolean}  opts.isReply        - Whether this is a reply to another comment
 */
export const notifyThreadOwner = async ({
  threadId,
  threadOwnerId,
  commenterId,
  commentId,
  subForumId,
  isReply = false,
}) => {
  // Don't notify yourself
  if (threadOwnerId.toString() === commenterId.toString()) return;

  // Check if the thread owner has muted this sub-forum
  const owner = await User.findById(threadOwnerId).select('mutedSubForums').lean();
  if (!owner) return;

  const isMuted = owner.mutedSubForums?.some(
    (id) => id.toString() === subForumId.toString()
  );
  if (isMuted) return;

  await Notification.create({
    recipient: threadOwnerId,
    sender: commenterId,
    type: isReply ? 'REPLY_TO_COMMENT' : 'COMMENT_ON_THREAD',
    entityId: isReply ? commentId : threadId,
    entityType: 'Comment',
    message: isReply
      ? 'Someone replied to a comment on your thread.'
      : 'Someone commented on your thread.',
  });

  // Check if thread owner has crossed the 50+ unread threshold
  await checkThresholdEmail(threadOwnerId);
};

/**
 * notifySubForumMembers — Instant notification when a new thread is created
 * in a collab sub-forum. Notifies all student members of that sub-forum
 * (who haven't muted it), excluding the thread author.
 *
 * @param {Object} thread - The newly created thread document
 * @param {ObjectId} thread._id
 * @param {ObjectId} thread.author
 * @param {ObjectId} thread.subForum
 * @param {String}   thread.title
 */
export const notifySubForumMembers = async (thread) => {
  const subForumId = thread.subForum;

  // Find student members who joined this sub-forum and haven't muted it
  // Collab notifications are for current students only, not alumni
  const members = await User.find({
    role: 'student',
    joinedSubForums: subForumId,
    mutedSubForums: { $ne: subForumId },
    _id: { $ne: thread.author }, // Exclude the thread author
  })
    .select('_id')
    .lean();

  if (!members.length) return;

  const notifications = members.map((member) => ({
    recipient: member._id,
    sender: thread.author,
    type: 'NEW_COLLAB_THREAD',
    entityId: thread._id,
    entityType: 'Thread',
    message: `New thread in your project: "${thread.title}"`,
  }));

  await Notification.insertMany(notifications, { ordered: false });

  // Check threshold for each notified member
  for (const member of members) {
    await checkThresholdEmail(member._id);
  }
};

/**
 * notifyWorkOpportunity — Creates WORK_OPPORTUNITY notifications for all
 * members of the target sub-forums. Deduplicates automatically (a user who
 * is a member of multiple targeted sub-forums gets only 1 notification).
 *
 * @param {Object} workRequest - The WorkRequest document
 * @param {Array}  members     - Pre-queried array of User documents (already deduplicated & mute-filtered)
 */
export const notifyWorkOpportunity = async (workRequest, members) => {
  if (!members.length) return;

  const notifications = members.map((member) => ({
    recipient: member._id,
    sender: workRequest.raisedBy,
    type: 'WORK_OPPORTUNITY',
    entityId: workRequest._id,
    entityType: 'WorkRequest',
    message: `New work opportunity: "${workRequest.title}"${workRequest.requiredSkills?.length
      ? ` — Skills: ${workRequest.requiredSkills.join(', ')}`
      : ''
      }`,
  }));

  await Notification.insertMany(notifications, { ordered: false });

  // Send instant work-opportunity emails to each targeted member
  // The controller passes only { _id }, so fetch name + email for the email
  const memberIds = members.map((m) => m._id);
  const fullMembers = await User.find({ _id: { $in: memberIds } })
    .select('name email')
    .lean();

  for (const member of fullMembers) {
    if (member.email) {
      await emailService.sendWorkOpportunityEmail(member, workRequest);
    }
  }

  // Check threshold for each notified member
  for (const member of members) {
    await checkThresholdEmail(member._id);
  }
};

/**
 * generateWeeklyDigest — Cron job handler (Saturday 9 AM IST).
 * Aggregates threads from the past 7 days for students.
 *
 * NOTE: Called from cron (no req/res/next), so minimal error logging is kept.
 */
export const generateWeeklyDigest = async () => {
  const mongoose = (await import('mongoose')).default;
  let Thread;

  try {
    Thread = mongoose.model('Thread');
  } catch {
    console.warn('[Scheduler] Thread model not registered — skipping weekly digest.');
    return;
  }

  const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const students = await User.find({ role: 'student' })
    .select('_id joinedSubForums mutedSubForums')
    .lean();

  for (const student of students) {
    const mutedSet = new Set(
      (student.mutedSubForums || []).map((id) => id.toString())
    );
    const activeSubForums = (student.joinedSubForums || []).filter(
      (id) => !mutedSet.has(id.toString())
    );

    if (!activeSubForums.length) continue;

    const threads = await Thread.find({
      subForum: { $in: activeSubForums },
      createdAt: { $gte: oneWeekAgo },
    })
      .select('_id title commentCount')
      .sort({ commentCount: -1 })
      .limit(20)
      .lean();

    if (!threads.length) continue;

    await Notification.create({
      recipient: student._id,
      sender: null,
      type: 'WEEKLY_DIGEST',
      entityId: threads[0]._id,
      entityType: 'Thread',
      message: `Your weekly digest: ${threads.length} active threads this week.`,
      digestData: {
        threads: threads.map((t) => ({
          threadId: t._id,
          title: t.title,
          primaryCommentCount: t.commentCount || 0,
        })),
        periodStart: oneWeekAgo,
        periodEnd: now,
      },
    });
  }

  console.log('[Scheduler] Weekly digest generated successfully.');
};

/**
 * generateFortnightlyDigest — Cron job handler (every 2 weeks).
 * Aggregates threads with notifyAlumni=true from the past 14 days for alumni.
 *
 * NOTE: Called from cron (no req/res/next), so minimal error logging is kept.
 */
export const generateFortnightlyDigest = async () => {
  const mongoose = (await import('mongoose')).default;
  let Thread;

  try {
    Thread = mongoose.model('Thread');
  } catch {
    console.warn('[Scheduler] Thread model not registered — skipping fortnightly digest.');
    return;
  }

  const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
  const now = new Date();

  const threads = await Thread.find({
    notifyAlumni: true,
    createdAt: { $gte: twoWeeksAgo },
  })
    .select('_id title commentCount subForum')
    .sort({ commentCount: -1 })
    .limit(30)
    .lean();

  if (!threads.length) {
    console.log('[Scheduler] No alumni threads for fortnightly digest.');
    return;
  }

  const threadSubForumIds = [...new Set(threads.map((t) => t.subForum.toString()))];

  const alumni = await User.find({
    role: 'alumni',
    mutedSubForums: { $nin: threadSubForumIds },
  })
    .select('_id')
    .lean();

  for (const alum of alumni) {
    await Notification.create({
      recipient: alum._id,
      sender: null,
      type: 'FORTNIGHTLY_DIGEST',
      entityId: threads[0]._id,
      entityType: 'Thread',
      message: `Your fortnightly digest: ${threads.length} threads flagged for alumni.`,
      digestData: {
        threads: threads.map((t) => ({
          threadId: t._id,
          title: t.title,
          primaryCommentCount: t.commentCount || 0,
        })),
        periodStart: twoWeeksAgo,
        periodEnd: now,
      },
    });
  }

  console.log('[Scheduler] Fortnightly digest generated successfully.');
};

/**
 * getUserNotifications — Fetch paginated notifications for a user.
 *
 * @param {ObjectId} userId
 * @param {Object}   opts
 * @param {Number}   opts.page
 * @param {Number}   opts.limit
 * @param {Boolean}  opts.unreadOnly
 * @returns {{ notifications, total, page, totalPages }}
 */
export const getUserNotifications = async (userId, { page = 1, limit = 20, unreadOnly = false } = {}) => {
  const filter = { recipient: userId };
  if (unreadOnly) filter.isRead = false;

  const total = await Notification.countDocuments(filter);
  const notifications = await Notification.find(filter)
    .populate('sender', 'name avatar')
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return {
    notifications,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
};

/**
 * getUnreadCount — Count of unread notifications for a user.
 *
 * @param {ObjectId} userId
 * @returns {Number}
 */
export const getUnreadCount = async (userId) => {
  return Notification.countDocuments({ recipient: userId, isRead: false });
};
