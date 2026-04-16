# Notification System — Deferred Changes for Thread & Comment Teams

> **Author:** Notification System Implementation  
> **Date:** April 2026  
> **Status:** Pending teammate implementation

This document lists all changes required in the **Thread** and **Comment** schemas/controllers to fully integrate with the notification system. The notification infrastructure (models, services, controllers, routes) is already implemented and ready.

---

## Table of Contents
1. [Thread Model Changes](#1-thread-model-changes)
2. [Thread Controller Changes](#2-thread-controller-changes)
3. [Comment Controller Changes](#3-comment-controller-changes)
4. [What's Already Done](#4-whats-already-done)
5. [Testing Checklist](#5-testing-checklist)

---

## 1. Thread Model Changes

**File:** `models/threadModel.js`

Add this field to the thread schema:

```diff
  const threadSchema = new mongoose.Schema({
      title: { type: String, required: true },
      content: { type: String, required: true },
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      subForum: { type: mongoose.Schema.Types.ObjectId, ref: 'SubForum', required: true },
      forum: { type: mongoose.Schema.Types.ObjectId, ref: 'Forum', required: true },
      tags: [{ type: String }],
      attachments: [{ type: String }],
      commentCount: { type: Number, default: 0 },
-     isPinned: { type: Boolean, default: false }
+     isPinned: { type: Boolean, default: false },
+
+     // Only threads flagged with this will notify alumni (only meaningful in normal forums)
+     notifyAlumni: { type: Boolean, default: false },
  }, { timestamps: true });
```

### What the field does:
| Field | Type | Purpose |
|:--|:--|:--|
| `notifyAlumni` | Boolean | When `true`, this thread's info will be included in alumni fortnightly digests. Only meaningful for threads in `normal`-type forums. |


---

## 2. Thread Controller Changes

**File:** `controllers/threadController.js`

### 2a. Accept `notifyAlumni` on thread creation

When creating a thread, accept `notifyAlumni` from the request body. Only allow it for **normal** forums:

```javascript
// Import at the top of the file
import * as notificationService from '../services/notificationService.js';

// Inside your createThread handler, when building the thread data:
const forum = await Forum.findById(subForum.forum); // You likely already have this

const newThread = await threadService.createThread({
    title,
    content,
    author: req.user._id,
    subForum: subForum._id,
    forum: subForum.forum,
    tags: finalTags,
    attachments: processedAttachments,
    // notifyAlumni only valid for normal forums
    notifyAlumni: forum.type === 'normal' ? (req.body.notifyAlumni || false) : false,
});
```

### 2b. Notify sub-forum members for collab threads

After creating a thread in a **collab** forum, call the notification service:

```javascript
// After thread creation, check forum type
if (forum.type === 'collab') {
    await notificationService.notifySubForumMembers(newThread);
}
```

### Full diff for createThread:

```diff
+ import * as notificationService from '../services/notificationService.js';

  // In createThread handler:
  const newThread = await threadService.createThread({
      title,
      content,
      author: req.user._id,
      subForum: subForum._id,
      forum: subForum.forum,
      tags: finalTags,
-     attachments: processedAttachments
+     attachments: processedAttachments,
+     notifyAlumni: forum.type === 'normal' ? (req.body.notifyAlumni || false) : false,
  });

+ // NOTIFICATION: If forum is collab → instant notify all sub-forum members (students only)
+ if (forum.type === 'collab') {
+     await notificationService.notifySubForumMembers(newThread);
+ }
```

---

## 3. Comment Controller Changes

**File:** `controllers/commentController.js`

### Notify thread owner on new comment

After creating a comment, notify the thread owner (if commenter ≠ owner):

```javascript
// Import at the top of the file
import * as notificationService from '../services/notificationService.js';

// After creating the comment and incrementing commentCount:

// NOTIFICATION: Notify thread owner instantly
if (thread.author.toString() !== req.user._id.toString()) {
    await notificationService.notifyThreadOwner({
        threadId: thread._id,
        threadOwnerId: thread.author,
        commenterId: req.user._id,
        commentId: comment._id,
        subForumId: thread.subForum,
        isReply: !!parentCommentId,
    });
}
```


### Full diff for createComment:

```diff
+ import * as notificationService from '../services/notificationService.js';

  // After: await Thread.findByIdAndUpdate(threadId, { $inc: { commentCount: 1 } });

+ // NOTIFICATION: Notify thread owner instantly
+ if (thread.author.toString() !== req.user._id.toString()) {
+     await notificationService.notifyThreadOwner({
+         threadId: thread._id,
+         threadOwnerId: thread.author,
+         commenterId: req.user._id,
+         commentId: comment._id,
+         subForumId: thread.subForum,
+         isReply: !!parentCommentId,
+     });
+ }
```

---

## 4. What's Already Done

These are already implemented and working — **do NOT modify these files**:

| File | What it does |
|:--|:--|
| `models/notificationModel.js` | Notification schema with 8 types |
| `models/workRequestModel.js` | Work request schema |
| `services/notificationService.js` | Core notification logic (with auto 50+ unread email alert) |
| `services/emailService.js` | Email sending (placeholder) |
| `controllers/notificationController.js` | Notification CRUD endpoints |
| `controllers/workRequestController.js` | Work request endpoints |
| `routes/notificationRoutes.js` | `/api/notifications/*` routes |
| `routes/workRequestRoutes.js` | `/api/work-requests/*` routes |
| `config/scheduler.js` | Cron jobs for digests |
| `models/userModel.js` | `joinedSubForums`, `mutedSubForums` |

### Available notification service functions you'll use:

```javascript
import * as notificationService from '../services/notificationService.js';

// 1. Notify thread owner when someone comments
await notificationService.notifyThreadOwner({ threadId, threadOwnerId, commenterId, commentId, subForumId, isReply });

// 2. Notify sub-forum members when a collab thread is created (students only)
await notificationService.notifySubForumMembers(thread);
```

### 50+ Unread Threshold (automatic)
The notification service **automatically** checks if a user has crossed 50+ unread notifications after every notification is created. If they have, a `THRESHOLD_EMAIL` is sent. **You don't need to do anything** — it's handled internally.

---

## 5. Testing Checklist

After making the changes above, verify:

- [ ] Creating a thread in a **collab** forum → all joined student members of that sub-forum receive a `NEW_COLLAB_THREAD` notification
- [ ] Creating a thread in a **normal** forum with `notifyAlumni: true` → no instant notification (alumni get it in digest)
- [ ] Commenting on someone else's thread → thread owner receives `COMMENT_ON_THREAD` notification
- [ ] Replying to a comment → thread owner receives `REPLY_TO_COMMENT` notification
- [ ] Commenting on your own thread → NO notification
- [ ] Thread owner who has **muted** the sub-forum → does NOT receive comment notifications
- [ ] When a user accumulates 50+ unread notifications → they receive a `THRESHOLD_EMAIL` alert (check console in dev mode)
