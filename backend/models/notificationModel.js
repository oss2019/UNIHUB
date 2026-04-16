import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// NOTIFICATION
// Stores in-app notifications for the bell UI.
// Each record = one notification for one user.
// ─────────────────────────────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema(
  {
    // Who receives this notification
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },

    // Who triggered it (null for system-generated digests & threshold alerts)
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    type: {
      type: String,
      enum: [
        // Instant notifications
        'COMMENT_ON_THREAD', // Someone commented on your thread
        'REPLY_TO_COMMENT', // Someone replied to your comment
        'MENTION', // @mentioned in content
        'NEW_COLLAB_THREAD', // New thread in a collab sub-forum you joined
        'THRESHOLD_EMAIL', // User has 50+ unread notifications — email alert sent
        'WORK_OPPORTUNITY', // Project owner raised a work request targeting your sub-forum

        // Digest notifications (one record per digest sent)
        'WEEKLY_DIGEST', // Student weekend digest
        'FORTNIGHTLY_DIGEST', // Alumni fortnightly digest
      ],
      required: true,
    },

    // The primary entity this notification is about
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
    },
    entityType: {
      type: String,
      enum: ['Thread', 'Comment', 'Message', 'WorkRequest'],
      required: true,
    },

    // Human-readable preview text (shown in notification bell UI)
    message: { type: String, default: '' },

    // Digest-specific payload (only for WEEKLY_DIGEST / FORTNIGHTLY_DIGEST)
    digestData: {
      threads: [
        {
          threadId: { type: mongoose.Schema.Types.ObjectId, ref: 'Thread' },
          title: String,
          primaryCommentCount: Number,
        },
      ],
      periodStart: Date,
      periodEnd: Date,
    },

    // Status flags
    isRead: { type: Boolean, default: false },
    isEmailed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fast lookup: unread notifications for a user, newest first
notificationSchema.index({ recipient: 1, isRead: 1, createdAt: -1 });

// Prevent duplicate threshold email alerts (one unread THRESHOLD_EMAIL per user at a time)
notificationSchema.index(
  { recipient: 1, type: 1 },
  { unique: true, partialFilterExpression: { type: 'THRESHOLD_EMAIL' } }
);

const Notification =
  mongoose.models.Notification ||
  mongoose.model('Notification', notificationSchema);

export default Notification;
