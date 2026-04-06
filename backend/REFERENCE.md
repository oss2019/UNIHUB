# REFERENCE — Threads Module (Person C)

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

👉 **See the exhaustive [PERMISSIONS.md](./PERMISSIONS.md) matrix for the complete operational breakdown.**

### 5. Input Validation & Ghost Attack Prevention
All incoming requests pass through `express-validator` middleware before reaching any controller logic:

- **Schema Bounds:** `title` (5–100 chars), `content` (10–5000 chars). Requests outside these limits are rejected with `400`.
- **Ghost ID Attacks:** Malformed, empty, or structurally invalid MongoDB ObjectIDs injected into URL params (`:id`) or request body (`subForumId`) are intercepted and rejected before they hit the database. This includes literal strings like `"undefined"`, short strings like `"123"`, and properly formatted but non-existent IDs.

### 6. Service Layer Architecture
Database operations are fully decoupled from controllers via a `services/` layer:
- `threadService.js` — All Mongoose queries for threads
- `cloudinaryService.js` — Upload and delete operations against Cloudinary SDK

---

## Important Notes

- **Forum & SubForum models are dummies.** The `dummyForumModel.js` and `dummySubForumModel.js` were created to unblock Thread development without waiting for the Forums module. They are fully functional Mongoose models but may need to be replaced or merged with the final Forum implementation.
- **`CLOUDINARY_URL`** must be added to your `.env` file. See `.env.example` for the format.

---

## Testing

All features above are covered by automated test suites under `backend/tests/`:

- **Unit Tests** (`tests/unit/`):
  - `Security/` — Role-based access (Creation, Modification, Deletion, Administration, Visibility), Ghost Attack prevention, Schema validation
  - `Tags/` — Tag sanitization and deduplication
  - `Cloudinary/` — Upload lifecycle (Base64 + external URL capture), batch operations, error handling
- **Integration Tests** (`tests/integration/`):
  - `test_bulk_threads.js` — 64-case comprehensive environment test across all forum states, roles, and edge cases
  - `cloudinary_integration_test.js` — End-to-end DB + Cloudinary cascade deletion and ghost URL verification

---

## ⚠️ Running Tests Locally (Cloudinary Dependencies)

The Cloudinary test suites (`tests/unit/Cloudinary/test_cloudinary_crud.js` and `tests/integration/cloudinary_integration_test.js`) physically convert images to Base64 to test the API endpoints.

Because image binaries and Data-URI texts bloat the repository, the testing directories (`backend/Photos/` and `backend/Photos_links/`) **are not pushed to GitHub.**

If you want to run these testing suites on your local machine, you must manually populate them:
1. Create a `backend/Photos/` directory and place at least 20 dummy `.jpg`/`.png` files inside.
2. Create a `backend/Photos_links/` directory and place at least 5 `.txt` files containing random external HTTPS image URLs and Data-URI strings inside (including a file explicitly named `tiger.txt` and `boy.txt`). 
If these files do not exist, the physical `fs` operations in the tests will instantly fail.
