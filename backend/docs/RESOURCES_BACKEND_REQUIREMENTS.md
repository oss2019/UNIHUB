# Backend Requirements: Dynamic Resources Panel (Simplified)

This document outlines the database schemas, API endpoints, authentication requirements, and state synchronization details needed in the backend to transition the PeerHive **Resources** page from local storage mock data to a dynamic, persistent implementation.

This plan has been simplified based on the commented-out features in the frontend codebase:
*   **Upvoting is omitted** (the thumbs-up button on resource cards is disabled/commented out).
*   **Bookmarking is omitted** (the bookmark icon on resource cards is disabled/commented out).
*   **Sorting UI is omitted** (the sort select dropdown is disabled/commented out; resources will default to sorted by `createdAt` descending).

---

## 1. Mongoose Database Schema Design

A new Mongoose model `Resource` is required in the backend.

### Proposed `Resource` Model (`backend/models/resourceModel.js`)

```javascript
import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
      default: 'No description provided.'
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['course-material', 'lab-manual', 'project', 'placement', 'other']
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
      trim: true,
      match: [/^https?:\/\/.+/, 'Please provide a valid URL']
    },
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true
    },
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true
    },
    semester: {
      type: Number,
      required: [true, 'Target semester is required'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8']
    },
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      enum: ['PDF', 'ZIP', 'Link', 'GitHub', 'Drive']
    },
    fileSize: {
      type: String,
      trim: true,
      default: 'Web Link'
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    downloadsCount: {
      type: Number,
      default: 0
    }
  },
  { 
    timestamps: true
  }
);

// Indexes for fast searching and filtering
resourceSchema.index({ courseCode: 1 });
resourceSchema.index({ category: 1 });
resourceSchema.index({ semester: 1 });
// Text search index for searching across multiple fields
resourceSchema.index({ 
  title: 'text', 
  description: 'text', 
  courseCode: 'text', 
  courseName: 'text', 
  tags: 'text' 
});

const Resource = mongoose.model('Resource', resourceSchema);
export default Resource;
```

---

## 2. API Endpoints Required

All endpoints should be prefixed with `/api/resources` and integrated into [app.js](file:///f:/Projects/PeerHive.NEW%20frontend/backend/app.js).

### `GET /api/resources`
Retrieve resources matching filter criteria.

*   **Authentication**: None (Public)
*   **Query Parameters**:
    *   `category` (Optional): Filter by category enum.
    *   `semester` (Optional): Filter by target semester.
    *   `search` (Optional): Search term for text index matching.
*   **Response Structure (`200 OK`)**:
    ```json
    {
      "status": "success",
      "results": 2,
      "data": {
        "resources": [
          {
            "_id": "647fb3b2f5d21a001a1d1e4c",
            "title": "Calculus Complete Lecture Notes",
            "description": "Handwritten notes covering limits and derivatives.",
            "category": "course-material",
            "tags": ["calculus", "notes", "math"],
            "url": "https://drive.google.com/...",
            "courseCode": "MA-101",
            "courseName": "Calculus",
            "semester": 1,
            "fileType": "Drive",
            "fileSize": "Folder (45 MB)",
            "uploadedBy": {
              "_id": "647a23c3f5d21a001a1d1d8a",
              "name": "Prof. R. Sharma",
              "avatar": "https://example.com/avatar.jpg",
              "role": "admin"
            },
            "downloadsCount": 142,
            "createdAt": "2026-01-15T09:30:00.000Z"
          }
        ]
      }
    }
    ```

---

### `POST /api/resources`
Upload a new resource.

*   **Authentication**: Protected (`protect` middleware) + Authorization Check (Admin role only)
*   **Request Body**:
    ```json
    {
      "title": "Data Structures & Algorithms - Lab Manual",
      "description": "Problem statements and optimized solutions in C++",
      "category": "lab-manual",
      "tags": ["dsa", "cpp", "lab-manual"],
      "url": "https://github.com/...",
      "courseCode": "CS-201",
      "courseName": "Data Structures and Algorithms",
      "semester": 3,
      "fileType": "GitHub",
      "fileSize": "Repo (2.4 MB)"
    }
    ```
*   **Response Structure (`201 Created`)**:
    ```json
    {
      "status": "success",
      "data": {
        "resource": { ...createdResourceObject }
      }
    }
    ```

---

### `DELETE /api/resources/:id`
Remove an academic resource.

*   **Authentication**: Protected (`protect` middleware) + Admin Check
*   **Response Structure (`204 No Content`)**

---

### `POST /api/resources/:id/download`
Increment the download count.

*   **Authentication**: None / Public
*   **Behavior**: Uses MongoDB `$inc` to atomically increment `downloadsCount` by `1`.
*   **Response Structure (`200 OK`)**:
    ```json
    {
      "status": "success",
      "downloadsCount": 143
    }
    ```

---

## 3. Recommended Code Updates

### Route Registration (`backend/app.js`)
We need to import and register the resource routing:

```diff
 import commentRoutes from "./routes/commentRoutes.js"; // 🔥 IMPORTANT
 import notificationRoutes from "./routes/notificationRoutes.js";
 import workRequestRoutes from "./routes/workRequestRoutes.js";
+import resourceRoutes from "./routes/resourceRoutes.js";
 import './config/scheduler.js'; // Start cron jobs on app boot
```
```diff
 app.use("/api/comments", commentRoutes);
 app.use("/api/notifications", notificationRoutes);
 app.use("/api", workRequestRoutes);
+app.use("/api/resources", resourceRoutes);
```

---

## 4. Frontend React Query Transitions

In the frontend [ResourcesPage.tsx](file:///f:/Projects/PeerHive.NEW%20frontend/frontend/src/pages/ResourcesPage.tsx), the state management is currently split between `useState` and local storage initialization:

```typescript
// Current State
const [resources, setResources] = useState<Resource[]>(() => {
  const saved = localStorage.getItem("ph_mock_resources");
  return saved ? JSON.parse(saved) : initialResources;
});
```

### Recommended Transition to React Query

1.  **Define API Queries**:
    ```typescript
    // Fetch all resources with filters
    export const resourcesQuery = (filters: { category?: string; search?: string }) => ({
      queryKey: ["resources", filters],
      queryFn: async () => {
        const params = new URLSearchParams(filters as any).toString();
        const res = await api.get(`/resources?${params}`);
        return res.data.data.resources;
      }
    });
    ```

2.  **Define Mutations**:
    *   `useMutation` for `createResource` (triggers `queryClient.invalidateQueries(["resources"])`).
    *   `useMutation` for `triggerDownload` (calls the `/download` API endpoint before redirecting/opening the external link).

---

## 5. Security & Authorization

1.  **Creation/Deletion (Write Access)**: Only users with the `admin` role (`user.role === 'admin'`) must be permitted to call `POST` or `DELETE` endpoints.
2.  **Input Sanitation**: Use validators to sanitize resource titles, validate formatting of URLs, and enforce required fields.
