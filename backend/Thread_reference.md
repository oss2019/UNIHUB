# REFERENCE — Threads Module

# 📖 **API Documentation:** See [`backend/docs/THREADS_API_GUIDE.md`](./docs/THREADS_API_GUIDE.md) for the complete route-level API reference (endpoints, request/response formats, query params).

## New Dependency

**`express-validator`** has been added to the project.
All request validation middleware lives inside `backend/validators/`. Currently contains `threadValidator.js`. Going forward, please add your validators for other modules in this same folder to keep controllers clean.

---

## What Has Been Implemented

### 1. Threads — Full CRUD

Complete Create, Read, Update, and Delete operations for Threads, connected to Forums and SubForums.

- **Create:** Accepts `title`, `content`, `subForumId`, `tags`, and optional `attachments` (images).
- **Read:** Supports fetching threads by SubForum tags, by Forum ID, by individual thread ID, and by search query. Pagination is built in with configurable `page` and `limit` query params.
- **Update:** Only the **original author** can edit their thread's title, content, tags, or attachments. Admins can only toggle `isPinned`.
- **Delete:** The **original author** or an **admin** can delete a thread.

### 2. Cloudinary Image Management

All image attachments are permanently stored on Cloudinary — whether the user uploads a raw Base64 image or pastes an external URL. External links are actively captured and re-hosted on our Cloudinary account to prevent broken images if the original source goes down.

- **Thread Deletion Cascade:** When a thread is deleted, all its Cloudinary images are destroyed first. No orphaned images remain on Cloudinary storage.
- **Ghost Link Sweep:** When a thread is fetched via `GET /threads/:id`, the backend runs a background check on each attachment URL. If Cloudinary returns `404` (image no longer exists), the dead link is automatically removed from the database before the response is sent to the client.

### 3. Tags System

Tags on threads are automatically sanitized on creation and update:

- **Trimmed** (leading/trailing spaces removed)
- **Lowercased** (case-insensitive matching)
- **Deduplicated** (`["React", "react", " REACT "]` → `["react"]`)
- **Empty/whitespace-only tags are rejected**

### 4. Role-Based Access Control

A strict permission matrix governs who can do what, based on Forum state and user role.

👉 **See the exhaustive [Thread_permissions.md](./Thread_permissions.md) matrix for the complete operational breakdown.**

### 5. Input Validation & Ghost Attack Prevention

All incoming requests pass through `express-validator` middleware before reaching any controller logic:

- **Schema Bounds:** `title` (5–100 chars), `content` (10–5000 chars). Requests outside these limits are rejected with `400`.
- **Ghost ID Attacks:** Malformed, empty, or structurally invalid MongoDB ObjectIDs injected into URL params (`:id`) or request body (`subForumId`) are intercepted and rejected before they hit the database. This includes literal strings like `"undefined"`, short strings like `"123"`, and properly formatted but non-existent IDs.

### 6. Service Layer Architecture

Database operations are fully decoupled from controllers via a `services/` layer:

- `threadService.js` — All Mongoose queries for threads
- `cloudinaryService.js` — Upload and delete operations against Cloudinary SDK

### 7. Notification System

When a thread is created, the system decides who to notify based on the forum type and user preferences. This operates at sub-forum level.

- **`notifyAlumni` Flag:** A boolean field on the Thread schema (`default: false`). Only threads in `normal` (General/Career) forums can set this to `true`. This notifies all the alumni except if they have set the sub-forum to mute. The controller **force-sets it to `false`** for `collab` forums to prevent spamming alumni with internal project discussions. Permissions: Only author of the thread can change this flag not even Admin
- **Mute Isolation:** Uses MongoDB's `$nin` (Not In) operator in `notificationService.js` to ensure users who have muted a sub-forum are strictly excluded from notifications and emails. This is a hard database-level filter, not an application-level check(even if it is a workRequest).
- **Instant Collab Alerts:** When a thread is posted in a `collab` forum, `notifySubForumMembers()` is called immediately to ping all joined students(i.eof sub-forum not forum and also receive weekly email) in real time (who have not mute belonging to that sub-forum )        (**NOTE:No email to alumni**).

### 8. User Threads API

A user's thread history can be fetched via a dedicated endpoint.

- **Endpoint:** `GET /api/users/:id/threads`
- **Route File:** `userRoutes.js`
- **Controller:** `getUserThreads` in `threadController.js`
- Supports pagination with `page` and `limit` query parameters.
- Returns threads authored by the specified user, sorted by newest first, with populated author details.

### 9. Email Service

All outgoing email communication is centralized in `emailService.js`. It handles 3 types of emails:

1. **Instant Notification** — Sent immediately when a thread/event triggers it. Subject: `[UNIHUB] <message>`.
2. **Digest (Weekly/Fortnightly)** — A summary email of top threads. Students get it weekly; Alumni get fortnightly.
3. **Work Opportunity** — Email sent when an alumni posts a job/work request. Includes title, description, and required skills. Students who belong to one of sub-forum of mentioned skill and the student has not muted the group he is sent instant notification and email. Not sent to email.

**Dev vs Prod Behavior:**

- **Without SMTP credentials in `.env`:** Emails are logged to the terminal console (safe dev mode). No real emails are sent.
- **With SMTP credentials in `.env`:** Emails are sent via the configured mail server ()i.e. via SMTP_USER env variable) to real inboxes.

**SENDER:** Display name varies by email type (`UNIHUB Notifications`, `UNIHUB Digest`, `UNIHUB Opportunities`). The actual sending account is `SMTP_USER` from `.env`. The display address is `DIGEST_FROM_EMAIL` from `.env` .

**NOTE:** However doesn't  allow display the DIGEST_FROM_EMAIL address set in .env unless this is verified by professional service like **Amazon SE5**.

**RECEIVER:** Dynamic — pulled from the user database based on notification logic.

---

## Important Notes

- **`CLOUDINARY_URL`** must be added to your `.env` file. See `.env.example` for the format.
- **Email Service (SMTP) `.env` variables:** To enable real email delivery, add `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `DIGEST_FROM_EMAIL` to your `.env`. Without these, the email service falls back to console logging. See `.env.example` for the format.

---

## Testing

All features above are covered by automated test suites under `backend/tests/`:

- **Unit Tests** (`tests/unit/`):
  - `Security/` — Role-based access (Creation, Modification, Deletion, Administration, Visibility), Ghost Attack prevention, Schema validation
  - `Tags/` — Tag sanitization and deduplication
  - `Cloudinary/` — Upload lifecycle (Base64 + external URL capture), batch operations, error handling
  - `Notifications/` — Validates real-time Collab alerts, `notifyAlumni` logic (forced `false` in collab), and strict Mute Isolation (zero-notifications for muted users).
  - `UserProfile/` — Validates the User Threads API, including author filtering, pagination (`page`, `limit`), and `hasMore` infinite-scroll flags and thread-matching as per the user.
- **Integration Tests** (`tests/integration/` and `tests/thread_tests/integration/`):
  - `test_bulk_threads.js` — 64-case comprehensive environment test across all forum states, roles, and edge cases
  - `cloudinary_integration_test.js` — End-to-end DB + Cloudinary cascade deletion and ghost URL verification
- **Email Service Tests** (`tests/emailService/`):
  - `test_email_logger.js` — Verifies all 4 email types (Instant Notification, Weekly Digest, Fortnightly Digest, Work Opportunity). Runs against the console logger in dev or real SMTP when credentials are configured.

---

## ⚠️ Running Tests Locally (Cloudinary Dependencies)

The Cloudinary test suites (`tests/unit/Cloudinary/test_cloudinary_crud.js` and `tests/integration/cloudinary_integration_test.js`) physically convert images to Base64 to test the API endpoints.

Because image binaries and Data-URI texts bloat the repository, the testing directories (`backend/Photos/` and `backend/Photos_links/`) **are not pushed to GitHub.**

If you want to run these testing suites on your local machine, you must manually populate them:

1. Create a `backend/Photos/` directory and place at least 20 dummy `.jpg`/`.png` files inside.
2. Create a `backend/Photos_links/` directory and place at least 5 `.txt` files containing random external HTTPS image URLs and Data-URI strings inside (including a file explicitly named `tiger.txt` and `boy.txt`).
   If these files do not exist, the physical `fs` operations in the tests will instantly fail.
