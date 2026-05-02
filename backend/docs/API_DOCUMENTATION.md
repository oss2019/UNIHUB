# 📘 UNIHUB Backend — Frontend Integration Documentation

> **Version:** 1.0 &nbsp;|&nbsp; **Last Updated:** April 17, 2026 &nbsp;|&nbsp; **Branch:** `discussion`

---

## Table of Contents

1. [Overview & Architecture](#1-overview--architecture)
2. [Getting Started](#2-getting-started)
3. [Authentication Flow](#3-authentication-flow)
4. [Standardized Response Format](#4-standardized-response-format)
5. [Error Handling](#5-error-handling)
6. [API Endpoints](#6-api-endpoints)
   - [6.1 Authentication](#61-authentication)
   - [6.2 Users](#62-users)
   - [6.3 Forums](#63-forums)
   - [6.4 Forum Requests](#64-forum-requests)
   - [6.5 SubForums](#65-subforums)
   - [6.6 SubForum Requests](#66-subforum-requests)
   - [6.7 SubForum Membership](#67-subforum-membership)
   - [6.8 Threads](#68-threads)
   - [6.9 Comments](#69-comments)
   - [6.10 Notifications](#610-notifications)
   - [6.11 Work Requests](#611-work-requests)
7. [Data Models (Schemas)](#7-data-models-schemas)
8. [File Upload Guidelines](#8-file-upload-guidelines)
9. [Notification System Overview](#9-notification-system-overview)
10. [Backend Code Review](#10-backend-code-review)

---

## 1. Overview & Architecture

UNIHUB is a university community platform built for **IIT Dharwad** students and alumni. The backend provides a hierarchical discussion system:

```mermaid
graph TD
    A["🏠 Homepage"] --> B["📂 Forums"]
    B --> C["📁 SubForums"]
    C --> D["📝 Threads"]
    D --> E["💬 Comments"]
    B -.->|"Forum Type: collab"| F["🔧 Work Requests"]
    D -.->|"Activity"| G["🔔 Notifications"]
    E -.->|"Activity"| G
    F -.->|"Broadcast"| G
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Runtime | Node.js (ES Modules) |
| Framework | Express.js v5 |
| Database | MongoDB + Mongoose v9 |
| Authentication | Google OAuth 2.0 + JWT (httpOnly cookies) |
| File Storage | Cloudinary |
| Email | Nodemailer (SMTP) |
| Scheduler | node-cron |

### Forum Types

| Type | Purpose | Work Requests? |
|------|---------|---------------|
| `normal` | Standard discussion (e.g., "Placements", "Internships") | ❌ No |
| `collab` | Project-based collaboration; sub-forums = projects | ✅ Yes |

---

## 2. Getting Started

### Base URL

```
http://localhost:5000
```

### Required Environment Variables

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/alumniconnect
JWT_SECRET=<your_jwt_secret>
JWT_REFRESH_SECRET=<your_refresh_secret>
GOOGLE_CLIENT_ID=<your_google_client_id>
GOOGLE_CLIENT_SECRET=<your_google_client_secret>
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback
COLLEGE_EMAIL_DOMAIN=iitdh.ac.in
CLIENT_URL=http://localhost:3000
NODE_ENV=development

# Cloudinary
CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME

# Email (for notification digests)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
DIGEST_FROM_EMAIL=noreply@unihub.iitdh.ac.in
```

### CORS Configuration

```
Origin: * (all origins allowed)
Credentials: true
```

> [!IMPORTANT]
> All authenticated requests require the `accessToken` cookie to be present. Make sure your frontend sends cookies with every request using `credentials: 'include'` in `fetch()` or `withCredentials: true` in Axios.

---

## 3. Authentication Flow

The backend uses **Google OAuth 2.0** with JWT tokens stored in **httpOnly cookies**.

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant BE as Backend
    participant G as Google OAuth

    FE->>BE: GET /auth/google
    BE->>G: Redirect to Google consent screen
    G->>BE: GET /auth/google/callback (with auth code)
    BE->>BE: Validate email domain (@iitdh.ac.in)
    BE->>BE: Upsert user in DB
    BE->>BE: Generate accessToken (15 min) + refreshToken (7 days)
    BE->>FE: Set httpOnly cookies + JSON response with user data

    Note over FE,BE: All subsequent requests include cookies automatically

    FE->>BE: POST /auth/refresh (when accessToken expires)
    BE->>FE: New accessToken cookie

    FE->>BE: POST /auth/logout
    BE->>FE: Clear all token cookies
```

### Token Details

| Token | Storage | Expiry | Purpose |
|-------|---------|--------|---------|
| `accessToken` | httpOnly cookie | 15 minutes | API request authentication |
| `refreshToken` | httpOnly cookie | 7 days | Obtain new access tokens |

### User Roles

| Role | Description | Auto-assigned? |
|------|-------------|----------------|
| `student` | Current students | ✅ Default on signup |
| `alumni` | Alumni | ❌ Manual change |
| `admin` | Full platform control | ❌ Manual change |

---

## 4. Standardized Response Format

All responses follow this structure:

### ✅ Success Response

```json
{
  "status": "success" | "ok",
  "message": "Optional message string",
  "results": 5,
  "data": {
    "<dataName>": <dataValue>
  }
}
```

### ✅ Success (no data)

```json
{
  "status": "ok",
  "message": "Forum \"Placements\" has been deactivated."
}
```

### ✅ Paginated Response

```json
{
  "status": "success",
  "results": 20,
  "data": {
    "pagination": {
      "threads": [...],
      "totalCount": 150,
      "hasMore": true
    }
  }
}
```

> [!NOTE]
> Some older controller endpoints (comments) still use a slightly different format: `{ success: true, data: ... }`. This inconsistency is noted in the [code review](#10-backend-code-review).

---

## 5. Error Handling

### Error Response (Development)

```json
{
  "status": "fail",
  "error": { ... },
  "message": "Forum not found.",
  "stack": "Error: Forum not found.\n    at ..."
}
```

### Error Response (Production)

```json
{
  "status": "fail",
  "message": "Forum not found."
}
```

### Common Error Codes

| Status Code | Meaning | Example |
|------------|---------|---------|
| `400` | Bad Request | Missing required fields |
| `401` | Unauthorized | No token / invalid token |
| `403` | Forbidden | Not admin / not the author |
| `404` | Not Found | Resource doesn't exist |
| `409` | Conflict | Duplicate name / already processed |
| `500` | Server Error | Unexpected failure |
| `502` | Bad Gateway | OAuth provider failure |

---

## 6. API Endpoints

### Legend

| Symbol | Meaning |
|--------|---------|
| 🔓 | Public (no auth needed) |
| 🔐 | Requires `accessToken` cookie |
| 👑 | Requires admin role |

---

### 6.1 Authentication

#### `GET /auth/google` 🔓
Initiates Google OAuth login. **Redirect the browser here directly** (not an AJAX call).

- Restricts to `@iitdh.ac.in` emails
- Shows account selection prompt

---

#### `GET /auth/google/callback` 🔓
Google redirects here after consent. **Do not call directly.**

**Response (on success):**
```json
{
  "status": "success",
  "message": "Login successful",
  "data": {
    "user": {
      "id": "663a1b...",
      "name": "Rushil",
      "email": "rushil@iitdh.ac.in",
      "role": "student"
    },
    "accessToken": "eyJhbG..."
  }
}
```

> [!NOTE]
> On failure, the backend redirects to `CLIENT_URL/login?error=<reason>`.

**Cookies Set:**
- `accessToken` (15 min TTL)
- `refreshToken` (7 day TTL)

---

#### `POST /auth/refresh` 🔓
Refreshes the access token using the refresh token cookie.

**Response:**
```json
{
  "status": "success",
  "message": "Token refreshed successfully"
}
```

---

#### `POST /auth/logout` 🔓
Clears both token cookies.

**Response:**
```json
{
  "status": "success",
  "message": "Logged out successfully"
}
```

---

#### `GET /auth/me` 🔐
Returns the currently authenticated user.

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "663a1b...",
      "email": "rushil@iitdh.ac.in",
      "name": "Rushil",
      "avatar": "https://...",
      "role": "student",
      "graduationYear": 2026,
      "branch": "CSE",
      "bio": "...",
      "joinedSubForums": ["..."],
      "mutedSubForums": []
    }
  }
}
```

---

### 6.2 Users

#### `GET /api/users/:id` 🔓
Get a user's public profile.

| Param | Type | Description |
|-------|------|-------------|
| `id` | path | MongoDB ObjectId of the user |

**Response:**
```json
{
  "status": "success",
  "data": {
    "user": {
      "_id": "663a1b...",
      "email": "rushil@iitdh.ac.in",
      "name": "Rushil",
      "avatar": "https://...",
      "role": "student",
      "graduationYear": 2026,
      "branch": "CSE",
      "bio": "Hello!",
      "linkedin": "https://linkedin.com/in/...",
      "github": "https://github.com/..."
    }
  }
}
```

---

#### `PATCH /api/users/:id` 🔐
Update your own profile. You can only edit your own profile.

| Param | Type | Description |
|-------|------|-------------|
| `id` | path | Your own user ID |

**Allowed Fields:**

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | |
| `avatar` | String | URL |
| `graduationYear` | Number | |
| `branch` | String | |
| `company` | String | |
| `designation` | String | |
| `bio` | String | Max 500 chars |
| `linkedin` | String | URL |
| `github` | String | URL |

**Request Body Example:**
```json
{
  "bio": "Updated bio",
  "graduationYear": 2027,
  "linkedin": "https://linkedin.com/in/username"
}
```

---

#### `GET /api/dummy/users/:id/threads` 🔓
*(Temporary route — will be moved to `/api/users/:id/threads`)*

Get all threads authored by a specific user. Paginated.

| Param | Type | Description |
|-------|------|-------------|
| `id` | path | User ID |
| `page` | query | Page number (default: 1) |
| `limit` | query | Items per page (default: 20) |

**Response:**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "pagination": {
      "threads": [...],
      "totalCount": 15,
      "hasMore": true
    }
  }
}
```

---

### 6.3 Forums

#### `GET /api/forums` 🔓
Get all active forums with sub-forum count.

**Response:**
```json
{
  "status": "ok",
  "results": 3,
  "data": {
    "forums": [
      {
        "_id": "664c...",
        "name": "Placements",
        "description": "Placement discussions",
        "type": "normal",
        "isActive": true,
        "isApproved": false,
        "createdBy": { "_id": "...", "name": "Admin" },
        "subForumCount": 5,
        "createdAt": "2026-04-10T...",
        "updatedAt": "2026-04-10T..."
      }
    ]
  }
}
```

---

#### `GET /api/forums/:id` 🔓
Get a single forum with all its active sub-forums.

**Response:**
```json
{
  "status": "ok",
  "data": {
    "forumDetails": {
      "forum": {
        "_id": "664c...",
        "name": "Placements",
        "description": "...",
        "type": "normal",
        "createdBy": { "_id": "...", "name": "Admin" }
      },
      "subForums": [
        {
          "_id": "665a...",
          "name": "Amazon",
          "description": "...",
          "tags": ["amazon", "sde"],
          "createdBy": { "_id": "...", "name": "User" }
        }
      ]
    }
  }
}
```

---

#### `PATCH /api/forums/:id` 🔐👑
Update a forum. Forum `type` cannot be changed after creation.

**Request Body:**
```json
{
  "name": "Updated Forum Name",
  "description": "Updated description",
  "isActive": true
}
```

---

#### `DELETE /api/forums/:id` 🔐👑
Soft-delete a forum (sets `isActive: false`). Sub-forums and threads are preserved.

**Response:**
```json
{
  "status": "ok",
  "message": "Forum \"Placements\" has been deactivated."
}
```

---

### 6.4 Forum Requests

> [!IMPORTANT]
> Forums are NOT created directly. Users submit a **Forum Request** → Admin approves → Forum is auto-created.

#### `POST /api/forum-requests` 🔐
Submit a request to create a new forum.

**Request Body:**
```json
{
  "name": "Hackathons",
  "description": "All hackathon-related discussions",
  "type": "normal"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `name` | String | ✅ | Must be unique |
| `description` | String | ❌ | |
| `type` | String | ❌ | `"normal"` (default) or `"collab"` |

---

#### `GET /api/forum-requests/my` 🔐
Get your own forum requests.

**Response:**
```json
{
  "status": "ok",
  "results": 2,
  "data": {
    "requests": [
      {
        "_id": "...",
        "name": "Hackathons",
        "description": "...",
        "type": "normal",
        "status": "pending",
        "reviewedBy": null,
        "reviewNote": null,
        "forumCreated": null,
        "requestedBy": "663a1b...",
        "createdAt": "..."
      }
    ]
  }
}
```

---

#### `GET /api/forum-requests` 🔐👑
Admin: Get all forum requests. Supports filtering.

| Query Param | Values |
|------------|--------|
| `status` | `pending`, `approved`, `rejected` |

---

#### `PATCH /api/forum-requests/:id/review` 🔐👑
Admin: Approve or reject a forum request.

**Request Body:**
```json
{
  "status": "approved",
  "reviewNote": "Looks good, approved!"
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `status` | String | ✅ | `"approved"` or `"rejected"` |
| `reviewNote` | String | ❌ | Optional note |

**On approval:** The Forum document is auto-created and returned.

---

### 6.5 SubForums

#### `GET /api/forums/:forumId/subforums` 🔓
Get all active sub-forums under a forum. Supports search.

| Query Param | Type | Description |
|------------|------|-------------|
| `search` | String | Filter sub-forum names (case-insensitive regex) |

**Response:**
```json
{
  "status": "ok",
  "results": 3,
  "data": {
    "subForums": [
      {
        "_id": "665a...",
        "name": "Amazon",
        "description": "Amazon placement discussions",
        "tags": ["amazon", "sde", "referral"],
        "forum": "664c...",
        "createdBy": { "_id": "...", "name": "User" },
        "isActive": true
      }
    ]
  }
}
```

---

#### `GET /api/subforums/:id` 🔓
Get a single sub-forum with thread count.

**Response:**
```json
{
  "status": "ok",
  "data": {
    "subForum": {
      "_id": "665a...",
      "name": "Amazon",
      "description": "...",
      "tags": ["amazon", "sde"],
      "forum": { "_id": "664c...", "name": "Placements", "description": "..." },
      "createdBy": { "_id": "...", "name": "User" },
      "threadCount": 12
    }
  }
}
```

---

#### `PATCH /api/subforums/:id` 🔐👑
Update a sub-forum.

**Request Body:**
```json
{
  "name": "Updated Name",
  "description": "Updated description",
  "tags": ["new-tag", "another-tag"],
  "isActive": true
}
```

---

#### `DELETE /api/subforums/:id` 🔐👑
Soft-delete a sub-forum.

---

### 6.6 SubForum Requests

#### `POST /api/forums/:forumId/subforum-requests` 🔐
Request creation of a sub-forum inside an existing forum.

**Request Body:**
```json
{
  "name": "Google SDE",
  "description": "Google SDE prep and referrals",
  "tags": ["google", "sde", "referral"]
}
```

---

#### `GET /api/subforum-requests/my` 🔐
Get your own sub-forum requests.

---

#### `GET /api/subforum-requests` 🔐👑
Admin: Get all sub-forum requests. Supports `?status=` filter.

---

#### `PATCH /api/subforum-requests/:id/review` 🔐👑
Admin: Approve or reject a sub-forum request.

**Request Body:**
```json
{
  "status": "approved",
  "reviewNote": "Approved for the Placements forum."
}
```

**On approval:**
- SubForum document is auto-created
- The requester is auto-enrolled as a member of the new sub-forum

---

### 6.7 SubForum Membership

#### `POST /api/subforums/:id/join` 🔐
Join a sub-forum to receive notifications about its activity.

**Response:**
```json
{
  "status": "ok",
  "message": "Joined successfully."
}
```

---

#### `POST /api/subforums/:id/leave` 🔐
Leave a sub-forum.

---

#### `POST /api/subforums/:id/mute` 🔐
Mute a sub-forum — you will NOT receive any notifications from it.

---

#### `POST /api/subforums/:id/unmute` 🔐
Unmute a previously muted sub-forum.

---

### 6.8 Threads

#### `POST /api/threads` 🔐
Create a new thread in a sub-forum.

**Request Body:**
```json
{
  "title": "Amazon SDE Referral Available",
  "content": "I'm offering referrals for Amazon SDE roles...",
  "subForumId": "665a...",
  "tags": ["amazon", "sde", "referral"],
  "attachments": [
    "data:image/png;base64,iVBOR..."
  ],
  "notifyAlumni": false
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | String | ✅ | |
| `content` | String | ✅ | |
| `subForumId` | ObjectId | ✅ | Must exist & be active |
| `tags` | String[] | ✅ | At least 1 tag required |
| `attachments` | String[] | ❌ | Base64-encoded images/files |
| `notifyAlumni` | Boolean | ❌ | Only effective in `normal` forums |

> [!NOTE]
> The `forum` field is auto-set from the sub-forum's parent. The thread is linked to **both** the sub-forum and its parent forum.

**In collab forums:** Creating a thread automatically notifies all student members of that sub-forum.

---

#### `GET /api/threads/search` 🔓
Search threads by title.

| Query Param | Type | Description |
|------------|------|-------------|
| `q` | String | Search query (required) |
| `page` | Number | Page number (default: 1) |
| `limit` | Number | Items per page (default: 20) |

**Response:**
```json
{
  "status": "success",
  "results": 5,
  "data": {
    "pagination": {
      "threads": [...],
      "totalCount": 42,
      "hasMore": true
    }
  }
}
```

---

#### `GET /api/threads/subforums/:id` 🔓
Get all threads in a sub-forum (matched by tags). Paginated.

| Query Param | Type | Description |
|------------|------|-------------|
| `page` | Number | Default: 1 |
| `limit` | Number | Default: 20 |

---

#### `GET /api/threads/forums/:id` 🔓
Get all threads in a forum. Paginated.

---

#### `GET /api/threads/:id` 🔓
Get a single thread. Performs **dynamic ghost link validation** — removes broken Cloudinary attachment URLs automatically.

**Response:**
```json
{
  "status": "success",
  "data": {
    "thread": {
      "_id": "666b...",
      "title": "Amazon SDE Referral",
      "content": "...",
      "author": { "_id": "...", "name": "User" },
      "subForum": "665a...",
      "forum": "664c...",
      "tags": ["amazon", "sde"],
      "attachments": ["https://res.cloudinary.com/..."],
      "commentCount": 3,
      "isPinned": false,
      "notifyAlumni": false,
      "createdAt": "...",
      "updatedAt": "...",
      "warnings": ["Warning: Resource ... no longer exists."]
    }
  }
}
```

> [!NOTE]
> The `warnings` array is only present if broken attachment URLs were detected and removed.

---

#### `PATCH /api/threads/:id` 🔐
Update a thread. Only the original author can edit content. Only admins can pin/unpin.

**Request Body (author):**
```json
{
  "title": "Updated Title",
  "content": "Updated content",
  "tags": ["updated-tag"],
  "attachments": ["data:image/png;base64,..."]
}
```

**Request Body (admin pin action):**
```json
{
  "isPinned": true
}
```

> [!WARNING]
> You **cannot** change the `subForumId` / `subForum` of an existing thread.

---

#### `DELETE /api/threads/:id` 🔐
Delete a thread. Author or admin only.

---

### 6.9 Comments

#### `POST /api/comments/threads/:threadId/comments` 🔐
Create a comment or reply on a thread.

**Content-Type:** `multipart/form-data` (if attaching a file) or `application/json`

**Body Fields:**

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `content` | String | ✅ | Max 2000 chars |
| `parentCommentId` | ObjectId | ❌ | If replying to another comment |
| `attachment` | File | ❌ | Single file upload (field name: `attachment`) |

**Allowed file types:** JPEG, PNG, GIF, WEBP, PDF  
**Max file size:** 5 MB

**Response:**
```json
{
  "success": true,
  "message": "Comment created successfully",
  "data": {
    "_id": "667c...",
    "content": "Great thread!",
    "author": { "_id": "...", "name": "User", "email": "...", "role": "student", "avatar": "..." },
    "thread": "666b...",
    "parentComment": null,
    "attachments": "https://res.cloudinary.com/...",
    "isDeleted": false,
    "reportCount": 0,
    "createdAt": "..."
  }
}
```

> [!NOTE]
> Creating a comment notifies the thread owner (unless the commenter IS the thread owner, or the owner has muted the sub-forum).

---

#### `GET /api/comments/threads/:threadId/comments` 🔐
Get all comments for a thread as a **nested tree** (top-level comments with `replies` arrays).

**Response:**
```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "_id": "667c...",
      "content": "Top-level comment",
      "author": { ... },
      "parentComment": null,
      "replies": [
        {
          "_id": "667d...",
          "content": "Reply to top-level",
          "author": { ... },
          "parentComment": "667c...",
          "replies": []
        }
      ]
    }
  ]
}
```

---

#### `GET /api/comments/:commentId` 🔐
Get a single comment by ID.

---

#### `PUT /api/comments/:commentId` 🔐
Edit a comment (author only). Supports replacing the attachment.

**Content-Type:** `multipart/form-data`

| Field | Type | Required |
|-------|------|----------|
| `content` | String | ✅ |
| `attachment` | File | ❌ |

---

#### `DELETE /api/comments/:commentId` 🔐
Soft-delete a comment (author or admin). Content is replaced with `"[This comment has been deleted]"`.

---

#### `DELETE /api/comments/:commentId/attachment` 🔐
Remove only the attachment from a comment (author only).

---

#### `POST /api/comments/:commentId/report` 🔐
Report a comment. Increments the `reportCount`. You cannot report your own comments.

---

### 6.10 Notifications

> [!IMPORTANT]
> **All notification routes require authentication.**

#### `GET /api/notifications` 🔐
Get paginated notifications for the logged-in user.

| Query Param | Type | Default | Description |
|------------|------|---------|-------------|
| `page` | Number | 1 | Page number |
| `limit` | Number | 20 | Items per page (max 50) |
| `unreadOnly` | String | `"false"` | Set to `"true"` to filter only unread |

**Response:**
```json
{
  "status": "success",
  "results": 45,
  "data": {
    "notifications": [
      {
        "_id": "668a...",
        "recipient": "663a...",
        "sender": { "_id": "...", "name": "User", "avatar": "..." },
        "type": "COMMENT_ON_THREAD",
        "entityId": "666b...",
        "entityType": "Comment",
        "message": "Someone commented on your thread.",
        "isRead": false,
        "isEmailed": false,
        "createdAt": "..."
      }
    ]
  }
}
```

---

#### `GET /api/notifications/unread-count` 🔐
Get count of unread notifications.

**Response:**
```json
{
  "status": "success",
  "data": {
    "unreadCount": 12
  }
}
```

---

#### `PATCH /api/notifications/read-all` 🔐
Mark all notifications as read.

**Response:**
```json
{
  "status": "success",
  "message": "5 notification(s) marked as read."
}
```

---

#### `PATCH /api/notifications/:id/read` 🔐
Mark a single notification as read.

---

#### `DELETE /api/notifications/:id` 🔐
Delete a notification (only your own).

---

### 6.11 Work Requests

> [!IMPORTANT]
> Work requests are **only available in `collab` forums**. They allow a project sub-forum owner to broadcast work opportunities to members of other sub-forums.

#### `POST /api/subforums/:id/work-requests` 🔐
Raise a work request. Only the sub-forum owner in a collab forum can do this.

**Request Body:**
```json
{
  "title": "Need React Developer for Frontend",
  "description": "Looking for a React developer to help build the dashboard UI",
  "targetSubForumIds": ["665b...", "665c..."],
  "requiredSkills": ["react", "css", "javascript"]
}
```

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| `title` | String | ✅ | Max 200 chars |
| `description` | String | ❌ | Max 2000 chars |
| `targetSubForumIds` | ObjectId[] | ✅ | Sub-forums whose members should be notified |
| `requiredSkills` | String[] | ❌ | Auto-lowercased |

**Side effect:** All student members of the target sub-forums (who haven't muted them) receive a `WORK_OPPORTUNITY` notification.

---

#### `GET /api/subforums/:id/work-requests` 🔐
Get all work requests for a project sub-forum.

| Query Param | Values |
|------------|--------|
| `status` | `open`, `closed` |

**Response:**
```json
{
  "status": "success",
  "results": 2,
  "data": {
    "workRequests": [
      {
        "_id": "669a...",
        "title": "Need React Developer",
        "description": "...",
        "raisedBy": { "_id": "...", "name": "Owner", "email": "...", "avatar": "..." },
        "sourceSubForum": { "_id": "...", "name": "My Project" },
        "targetSubForums": [{ "_id": "...", "name": "Web Dev" }],
        "requiredSkills": ["react", "css"],
        "status": "open",
        "createdAt": "..."
      }
    ]
  }
}
```

---

#### `PATCH /api/work-requests/:id` 🔐
Update or close a work request. Only the owner can do this.

**Request Body:**
```json
{
  "status": "closed",
  "title": "Updated title",
  "description": "Updated description"
}
```

---

#### `GET /api/work-requests/mine` 🔐
Get all work requests raised by the logged-in user.

---

## 7. Data Models (Schemas)

### User

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | Auto-generated |
| `googleId` | String | From Google OAuth |
| `email` | String | Must be `@iitdh.ac.in` |
| `name` | String | |
| `avatar` | String | Google profile photo URL |
| `role` | String | `student` \| `alumni` \| `admin` |
| `graduationYear` | Number | |
| `branch` | String | |
| `company` | String | (alumni) |
| `designation` | String | (alumni) |
| `bio` | String | Max 500 chars |
| `linkedin` | String | |
| `github` | String | |
| `isVerified` | Boolean | Set to `true` on OAuth login |
| `lastActive` | Date | Updated on login |
| `joinedForums` | ObjectId[] | Ref: Forum |
| `joinedSubForums` | ObjectId[] | Ref: SubForum |
| `mutedSubForums` | ObjectId[] | Ref: SubForum |
| `createdAt` | Date | Auto |
| `updatedAt` | Date | Auto |

---

### Forum

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `name` | String | Unique |
| `description` | String | |
| `createdBy` | ObjectId → User | |
| `isActive` | Boolean | Default: `true` |
| `isApproved` | Boolean | Default: `false` |
| `type` | String | `"normal"` \| `"collab"` (immutable after creation) |
| `createdAt` | Date | |

---

### ForumRequest

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `requestedBy` | ObjectId → User | |
| `name` | String | |
| `description` | String | |
| `type` | String | `"normal"` \| `"collab"` |
| `status` | String | `"pending"` \| `"approved"` \| `"rejected"` |
| `reviewedBy` | ObjectId → User | |
| `reviewNote` | String | |
| `forumCreated` | ObjectId → Forum | Set on approval |

---

### SubForum

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `name` | String | Unique within parent forum |
| `description` | String | |
| `forum` | ObjectId → Forum | Parent forum |
| `tags` | String[] | Used for thread matching |
| `createdBy` | ObjectId → User | |
| `isActive` | Boolean | |

---

### SubForumRequest

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `requestedBy` | ObjectId → User | |
| `forum` | ObjectId → Forum | Target parent forum |
| `name` | String | |
| `description` | String | |
| `tags` | String[] | |
| `status` | String | `"pending"` \| `"approved"` \| `"rejected"` |
| `reviewedBy` | ObjectId → User | |
| `reviewNote` | String | |
| `subForumCreated` | ObjectId → SubForum | Set on approval |

---

### Thread

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `title` | String | |
| `content` | String | |
| `author` | ObjectId → User | |
| `subForum` | ObjectId → SubForum | |
| `forum` | ObjectId → Forum | Auto-set from sub-forum |
| `tags` | String[] | At least 1 required |
| `attachments` | String[] | Cloudinary URLs |
| `commentCount` | Number | Auto-incremented |
| `isPinned` | Boolean | Admin only |
| `notifyAlumni` | Boolean | Only for `normal` forums |
| `createdAt` | Date | |
| `updatedAt` | Date | |

---

### Comment

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `content` | String | Max 2000 chars |
| `author` | ObjectId → User | |
| `thread` | ObjectId → Thread | |
| `parentComment` | ObjectId → Comment | `null` = top-level |
| `isDeleted` | Boolean | Soft delete flag |
| `attachments` | String | Single Cloudinary URL |
| `attachmentPublicId` | String | For Cloudinary deletion |
| `reportCount` | Number | |
| `createdAt` | Date | |
| `updatedAt` | Date | |

---

### Notification

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `recipient` | ObjectId → User | Who receives this |
| `sender` | ObjectId → User | Who triggered it (`null` for system) |
| `type` | String | See types below |
| `entityId` | ObjectId | The entity this is about |
| `entityType` | String | `"Thread"` \| `"Comment"` \| `"Message"` \| `"WorkRequest"` |
| `message` | String | Human-readable preview |
| `digestData` | Object | Only for digest types |
| `isRead` | Boolean | |
| `isEmailed` | Boolean | |

**Notification Types:**

| Type | Trigger | Audience |
|------|---------|----------|
| `COMMENT_ON_THREAD` | Someone comments on your thread | Thread author |
| `REPLY_TO_COMMENT` | Someone replies to a comment on your thread | Thread author |
| `MENTION` | @mentioned in content | Mentioned user *(not yet implemented)* |
| `NEW_COLLAB_THREAD` | New thread in a collab sub-forum | Sub-forum members |
| `WORK_OPPORTUNITY` | Work request targeting your sub-forum | Target sub-forum members (students only) |
| `THRESHOLD_EMAIL` | You have 50+ unread notifications | The user (+ email sent) |
| `WEEKLY_DIGEST` | Saturday 9 AM IST cron | Students |
| `FORTNIGHTLY_DIGEST` | Bi-weekly cron | Alumni |

---

### WorkRequest

| Field | Type | Notes |
|-------|------|-------|
| `_id` | ObjectId | |
| `raisedBy` | ObjectId → User | Project owner |
| `sourceSubForum` | ObjectId → SubForum | The project needing help |
| `targetSubForums` | ObjectId[] → SubForum | Sub-forums to broadcast to |
| `title` | String | Max 200 chars |
| `description` | String | Max 2000 chars |
| `requiredSkills` | String[] | Auto-lowercased |
| `status` | String | `"open"` \| `"closed"` |

---

## 8. File Upload Guidelines

### Thread Attachments
- Sent as **base64-encoded strings** in the JSON body under `attachments` array
- Uploaded to Cloudinary server-side
- Returns Cloudinary URLs in the response

### Comment Attachments
- Sent as **multipart/form-data** with field name `attachment`
- Single file per comment
- **Allowed types:** JPEG, PNG, GIF, WEBP, PDF
- **Max size:** 5 MB
- Upload middleware: `multer` (memory storage → Cloudinary)

> [!WARNING]
> Thread attachments and comment attachments use **different upload methods**. Threads use base64 in JSON; comments use `multipart/form-data`.

---

## 9. Notification System Overview

```mermaid
graph LR
    A["Comment Created"] -->|"Instant"| B["COMMENT_ON_THREAD / REPLY_TO_COMMENT"]
    C["Thread in Collab SubForum"] -->|"Instant"| D["NEW_COLLAB_THREAD"]
    E["Work Request Raised"] -->|"Instant"| F["WORK_OPPORTUNITY"]
    G["50+ Unread"] -->|"Auto"| H["THRESHOLD_EMAIL + Email Alert"]
    I["Cron: Saturday 9 AM"] -->|"Batch"| J["WEEKLY_DIGEST (Students)"]
    K["Cron: Bi-weekly"] -->|"Batch"| L["FORTNIGHTLY_DIGEST (Alumni)"]
```

### Muting Behavior
- Users can **mute** sub-forums via `POST /api/subforums/:id/mute`
- Muted sub-forums produce **zero notifications** for the user
- Both instant and digest notifications respect muting

### Threshold Email
- When a user accumulates **50+ unread** notifications, an email is sent automatically
- Only sends **once** per threshold crossing (resets when notifications are read)

---

## 10. Backend Code Review

### ✅ Strengths

| Area | Assessment |
|------|-----------|
| **Architecture** | Clean MVC-like pattern — routes → controllers → services/models |
| **Error Handling** | Centralized global error handler with dev/prod modes, custom `AppError` class |
| **Response Consistency** | Standardized `sendResponse` utility used across most controllers |
| **Authorization** | Layered middleware: `protect` → `requireAdmin`, per-action ownership checks |
| **Soft Deletes** | Forums, sub-forums, and comments use soft delete (preserving data integrity) |
| **Duplicate Prevention** | Race condition guards on forum/subforum creation during approval |
| **Tag System** | Centralized `cleanTags` utility for normalization and deduplication |
| **Notification Architecture** | Well-designed service layer with muting support, threshold alerts, and scheduled digests |
| **Database Indexing** | Proper compound indexes on high-query fields |
| **Input Validation** | `express-validator` for threads, manual validation in controllers |

### ⚠️ Issues Found

| # | Severity | Issue | Location |
|---|----------|-------|----------|
| 1 | 🔴 **High** | **`.env.save` committed to git** — contains real secrets/credentials. Must be added to `.gitignore` and removed from history. | `.env.save` |
| 2 | 🔴 **High** | **Debug `console.log` statements in production code** — the passport config logs `User.email` (which is the Model constructor, not a user instance). This will log `undefined` and is a bug. | `config/passport.js:20-22` |
| 3 | 🟡 **Medium** | **Inconsistent response format** — Comment controller uses `{ success: true, data: ... }` instead of the standardized `sendResponse()`. Frontend must handle both formats. | `commentController.js` |
| 4 | 🟡 **Medium** | **Admin role check inconsistency** — Comment delete uses `role === "ADMIN"` (uppercase) but user roles are stored as `"admin"` (lowercase). This means **admins cannot delete comments**. | `commentController.js:224` |
| 5 | 🟡 **Medium** | **CORS `origin: "*"` with `credentials: true`** — Browsers will reject this combination. Should be set to the specific `CLIENT_URL` for cookie-based auth to work. | `app.js:31` |
| 6 | 🟡 **Medium** | **Forum `isApproved` always defaults to `false`** — but the approval flow via `ForumRequest` doesn't set it to `true` after creation. Thread visibility checks rely on `isApproved`, so threads in approved forums may be incorrectly hidden. | `forumModel.js:84`, `forumRequestController.js:118-123` |
| 7 | 🟡 **Medium** | **`SESSION_SECRET` not in `.env.example`** — express-session is configured but the secret isn't documented for frontend/devops setup. | `app.js:42` |
| 8 | 🟢 **Low** | **`getSubForumThreads` visibility check** — references `req.user.role` but the route doesn't use `protect` middleware, so `req.user` may be `undefined` for unauthenticated requests. | `threadController.js:92` |
| 9 | 🟢 **Low** | **Dead code** — `createForum` export in `forumController.js:115-123` is not used in any route. | `forumController.js` |
| 10 | 🟢 **Low** | **`console.log("HIT getAllForums")`** at module top level — runs on every server start, not on each request. Should be removed or moved inside the function. | `forumController.js:12` |

### 📋 Recommendations for Frontend Team

1. **Always send cookies** — Use `credentials: 'include'` in fetch or `withCredentials: true` in Axios
2. **Handle two response formats** — Check for both `status === "success"` and `success === true` until the comment controller is standardized
3. **Token refresh** — Implement automatic token refresh when receiving `401` errors. Call `POST /auth/refresh` and retry the original request
4. **File uploads** — Note the different upload strategies for threads (base64 in JSON) vs comments (multipart/form-data)
5. **Pagination** — Always use `page` and `limit` query params for list endpoints. Check `hasMore` to know if more pages exist
6. **Notification polling** — Poll `GET /api/notifications/unread-count` periodically for the notification badge count, or implement WebSocket in the future

---

> **Questions?** Raise issues in the GitHub repo or contact the backend team on the discussion thread.
