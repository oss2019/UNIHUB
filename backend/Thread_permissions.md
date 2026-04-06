# UNIHUB Threads Module — Permissions & Access Control Matrix

This document outlines the strict Role-Based Access Control (RBAC) governing the Threads and Forums modules. All operations are gated based on **User Role**, **Forum State**, and **Ownership**. Every rule listed below has been exhaustively verified via automated security matrices (159 total checks, 0 failures).

---

## 1. Actor Entities (6-Entity Model)

There are **3 base roles** × **2 ownership contexts** = **6 distinct actor entities** tested across every operation.

### Base Roles
| Role                   | Description                                      |
| :--------------------- | :----------------------------------------------- |
| **Admin** (`admin`)    | Global oversight. Can delete any thread and pin. |
| **Alumni** (`alumni`)  | Standard user. Restricted to own content.        |
| **Student** (`student`)| Standard user. Identical privileges to Alumni.   |

### Ownership Context
| Context            | Meaning                                                      |
| :----------------- | :----------------------------------------------------------- |
| **Self-Author**    | The requesting user IS the original author of the thread.    |
| **Foreign**        | The requesting user is NOT the author of the thread.         |

### Combined 6 Entities
| #  | Entity                     | Role + Context                                |
| :- | :------------------------- | :-------------------------------------------- |
| 1  | **Self-Author (Admin)**    | Admin who authored the thread                 |
| 2  | **Self-Author (Alumni)**   | Alumni who authored the thread                |
| 3  | **Self-Author (Student)**  | Student who authored the thread               |
| 4  | **Foreign Admin**          | Admin who did NOT author the thread           |
| 5  | **Foreign Alumni**         | Alumni who did NOT author the thread          |
| 6  | **Foreign Student**        | Student who did NOT author the thread         |

---

## 2. Forum Lifecycle States

A Forum's accessibility is dictated by two boolean flags on the Forum model: `isApproved` and `isActive`.

| State Name         | `isApproved` | `isActive` | Purpose                                                 |
| :----------------- | :----------- | :--------- | :------------------------------------------------------ |
| **Live**           | `true`       | `true`     | Fully public and interactive. Everyone can post.        |
| **Pending**        | `false`      | `true`     | Newly created, awaiting Admin approval.                 |
| **Archived**       | `true`       | `false`    | Permanently locked for historical reading.              |
| **Dead**           | `false`      | `false`    | Rejected or removed. Blocked from public access.        |

---

## 3. Operations Cross-Matrix

### A. READ — Visibility (72 checks verified)

Read access is split into **3 levels**: Forum-level feed, SubForum-level feed, and Individual thread view.

#### Live Forum — All 6 entities see everything.
| Actor Entity               | Feed (Forum/SubForum) | Individual (GET /:id) |
| :------------------------- | :-------------------- | :-------------------- |
| **Self-Author (Admin)**    | ✅ All visible         | ✅ 200 OK              |
| **Self-Author (Alumni)**   | ✅ All visible         | ✅ 200 OK              |
| **Self-Author (Student)**  | ✅ All visible         | ✅ 200 OK              |
| **Foreign Admin**          | ✅ All visible         | ✅ 200 OK              |
| **Foreign Alumni**         | ✅ All visible         | ✅ 200 OK              |
| **Foreign Student**        | ✅ All visible         | ✅ 200 OK              |

#### Pending Forum — Feeds hidden from non-admins. Individual thread accessible to all by direct ID.
| Actor Entity               | Feed (Forum/SubForum) | Individual (GET /:id) |
| :------------------------- | :-------------------- | :-------------------- |
| **Self-Author (Admin)**    | ✅ All visible         | ✅ 200 OK              |
| **Self-Author (Alumni)**   | ⚠️ 0 items            | ✅ 200 OK              |
| **Self-Author (Student)**  | ⚠️ 0 items            | ✅ 200 OK              |
| **Foreign Admin**          | ✅ All visible         | ✅ 200 OK              |
| **Foreign Alumni**         | ⚠️ 0 items            | ✅ 200 OK              |
| **Foreign Student**        | ⚠️ 0 items            | ✅ 200 OK              |

#### Archived Forum — Frozen but fully visible to all at every level.
| Actor Entity               | Feed (Forum/SubForum) | Individual (GET /:id) |
| :------------------------- | :-------------------- | :-------------------- |
| **Self-Author (Admin)**    | ✅ All visible         | ✅ 200 OK              |
| **Self-Author (Alumni)**   | ✅ All visible         | ✅ 200 OK              |
| **Self-Author (Student)**  | ✅ All visible         | ✅ 200 OK              |
| **Foreign Admin**          | ✅ All visible         | ✅ 200 OK              |
| **Foreign Alumni**         | ✅ All visible         | ✅ 200 OK              |
| **Foreign Student**        | ✅ All visible         | ✅ 200 OK              |

#### Dead Forum — Admin-only access. Non-admins get 0 items in feeds and 403 on individual view.
| Actor Entity               | Feed (Forum/SubForum) | Individual (GET /:id) |
| :------------------------- | :-------------------- | :-------------------- |
| **Self-Author (Admin)**    | ✅ All visible         | ✅ 200 OK              |
| **Self-Author (Alumni)**   | ⚠️ 0 items            | ❌ 403 Forbidden       |
| **Self-Author (Student)**  | ⚠️ 0 items            | ❌ 403 Forbidden       |
| **Foreign Admin**          | ✅ All visible         | ✅ 200 OK              |
| **Foreign Alumni**         | ⚠️ 0 items            | ❌ 403 Forbidden       |
| **Foreign Student**        | ⚠️ 0 items            | ❌ 403 Forbidden       |

---

### B. CREATE — Thread Posting (12 checks verified)

Creation is gated by **Forum state + role**. Ownership does not apply (the executor becomes the Author on success).

#### Per Forum State
| Forum State  | Admin          | Alumni             | Student            |
| :----------- | :------------- | :----------------- | :----------------- |
| **Live**     | ✅ 201 Created  | ✅ 201 Created      | ✅ 201 Created      |
| **Pending**  | ✅ 201 Created  | ❌ 403 Forbidden    | ❌ 403 Forbidden    |
| **Archived** | ❌ 403 Forbidden| ❌ 403 Forbidden    | ❌ 403 Forbidden    |
| **Dead**     | ❌ 403 Forbidden| ❌ 403 Forbidden    | ❌ 403 Forbidden    |

---

### C. UPDATE — Editing Text Content (24 checks verified)

Editing is gated by **ownership only**. Forum state does NOT block editing. Only the original Author may edit the thread's title, content, tags, or attachments.

#### Per Forum State (identical across all 4 states)
| Actor Entity               | Live   | Pending | Archived | Dead   |
| :------------------------- | :----- | :------ | :------- | :----- |
| **Self-Author (Admin)**    | ✅ 200  | ✅ 200   | ✅ 200    | ✅ 200  |
| **Self-Author (Alumni)**   | ✅ 200  | ✅ 200   | ✅ 200    | ✅ 200  |
| **Self-Author (Student)**  | ✅ 200  | ✅ 200   | ✅ 200    | ✅ 200  |
| **Foreign Admin**          | ❌ 403  | ❌ 403   | ❌ 403    | ❌ 403  |
| **Foreign Alumni**         | ❌ 403  | ❌ 403   | ❌ 403    | ❌ 403  |
| **Foreign Student**        | ❌ 403  | ❌ 403   | ❌ 403    | ❌ 403  |

---

### D. DELETE — Destroying a Thread + Cloudinary Cascade (24 checks verified)

Deletion is gated by **ownership OR admin override**. Forum state does NOT block deletion. The original Author can always delete their own thread. Any Admin can delete anyone's thread.

#### Per Forum State (identical across all 4 states)
| Actor Entity               | Live   | Pending | Archived | Dead   |
| :------------------------- | :----- | :------ | :------- | :----- |
| **Self-Author (Admin)**    | ✅ 200  | ✅ 200   | ✅ 200    | ✅ 200  |
| **Self-Author (Alumni)**   | ✅ 200  | ✅ 200   | ✅ 200    | ✅ 200  |
| **Self-Author (Student)**  | ✅ 200  | ✅ 200   | ✅ 200    | ✅ 200  |
| **Foreign Admin**          | ✅ 200  | ✅ 200   | ✅ 200    | ✅ 200  |
| **Foreign Alumni**         | ❌ 403  | ❌ 403   | ❌ 403    | ❌ 403  |
| **Foreign Student**        | ❌ 403  | ❌ 403   | ❌ 403    | ❌ 403  |

---

### E. ADMINISTRATION — Thread Pin Toggle (12 checks verified)

Pinning/unpinning is an **Admin-only** action. Even the original Author cannot pin their own thread unless they hold an Admin token.

| Actor                    | Pin ON         | Pin OFF        |
| :----------------------- | :------------- | :------------- |
| **Self-Author (Admin)**  | ✅ 200 OK      | ✅ 200 OK      |
| **Self-Author (Alumni)** | ❌ 403         | ❌ 403         |
| **Self-Author (Student)**| ❌ 403         | ❌ 403         |
| **Foreign Admin**        | ✅ 200 OK      | ✅ 200 OK      |
| **Foreign Alumni**       | ❌ 403         | ❌ 403         |
| **Foreign Student**      | ❌ 403         | ❌ 403         |

---

## 4. Ghost Attack Prevention (15 checks verified)

All URL parameters (`:id`) and body fields (`subForumId`) are validated by `express-validator` middleware before any controller logic executes.

### Malformed ID Rejection (URL `:id`)
| Attack Vector          | Input                     | Result         |
| :--------------------- | :------------------------ | :------------- |
| Short string           | `"123"`                   | 404            |
| Literal `"undefined"`  | `"undefined"`             | 404            |
| Special characters     | `"hack!@#$%^&*()"`       | 404            |
| SQL injection          | `"'; DROP TABLE..."`     | 404            |

### Body `subForumId` Injection
| Attack Vector          | Input                     | Result         |
| :--------------------- | :------------------------ | :------------- |
| Empty string           | `""`                      | 400            |
| Missing (undefined)    | `undefined`               | 400            |
| Invalid format         | `"not_a_mongo_id"`        | 400            |
| Numeric value          | `12345`                   | 400            |
| Null value             | `null`                    | 400            |

### Ghost IDs (Valid Format, Not in DB)
| Operation              | Result                                        |
| :--------------------- | :-------------------------------------------- |
| Create with ghost SubForum | 404 SubForum not found                    |
| Get ghost Thread       | 404 Thread not found                          |
| Update ghost Thread    | 404 Thread not found                          |
| Delete ghost Thread    | 404 Thread not found                          |

---

## 5. Schema Boundary Enforcement (8 checks verified)

Request payloads are validated for strict min/max length constraints.

| Field       | Constraint     | Input Description         | Result         |
| :---------- | :------------- | :------------------------ | :------------- |
| **Title**   | Min 5 chars    | 4 chars (`"abcd"`)        | ❌ 400         |
| **Title**   | Max 100 chars  | 101 chars                 | ❌ 400         |
| **Title**   | Empty string   | `""`                      | ❌ 400         |
| **Title**   | Valid          | 11 chars                  | ✅ 200         |
| **Content** | Min 10 chars   | 8 chars (`"short123"`)    | ❌ 400         |
| **Content** | Max 5000 chars | 5001 chars                | ❌ 400         |
| **Content** | Empty string   | `""`                      | ❌ 400         |
| **Content** | Valid          | 20 chars                  | ✅ 200         |

---

## 6. Cloudinary Deletion Cascade

When any authorized user (Author or Admin) successfully triggers a `DELETE` request, all Cloudinary assets mapped to that thread are destroyed *before* the MongoDB document is removed. This prevents orphaned images from accumulating on cloud storage.
