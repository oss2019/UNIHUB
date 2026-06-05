/**
 * @file resourceModel.js
 * @module models/resourceModel
 * @description Mongoose schema and model definition for the Academic Resource entity.
 *              Each document represents an uploadable academic artifact (PDF, Drive link,
 *              GitHub repo, etc.) tied to a specific course, semester, and uploader.
 *
 * @requires mongoose
 */

import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Schema Definition
// ─────────────────────────────────────────────────────────────────────────────

const resourceSchema = new mongoose.Schema(
  {
    /** Human-readable title shown on the resource card */
    title: {
      type: String,
      required: [true, 'Resource title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },

    /** Optional short summary displayed beneath the title */
    description: {
      type: String,
      trim: true,
      maxlength: [250, 'Description cannot exceed 250 characters'],
      default: 'No description provided.'
    },

    /** Broad classification bucket for filtering */
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: ['course-material', 'lab-manual', 'project', 'placement', 'other']
    },

    /** Searchable keyword tags — sanitised to lowercase on input */
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true
      }
    ],

    /** External link pointing to the hosted resource (Drive, GitHub, etc.) */
    url: {
      type: String,
      required: [true, 'Resource URL is required'],
      trim: true,
      match: [/^https?:\/\/.+/, 'Please provide a valid URL']
    },

    /** Official course code (auto-uppercased, e.g. "CS-201") */
    courseCode: {
      type: String,
      required: [true, 'Course code is required'],
      trim: true,
      uppercase: true
    },

    /** Full course name for display purposes */
    courseName: {
      type: String,
      required: [true, 'Course name is required'],
      trim: true
    },

    /** Target semester (1–8) for filtering by academic year */
    semester: {
      type: Number,
      required: [true, 'Target semester is required'],
      min: [1, 'Semester must be between 1 and 8'],
      max: [8, 'Semester must be between 1 and 8']
    },

    /** Describes the format of the linked resource */
    fileType: {
      type: String,
      required: [true, 'File type is required'],
      enum: ['PDF', 'ZIP', 'Link', 'GitHub', 'Drive']
    },

    /** Human-readable size hint (e.g. "Folder (45 MB)") */
    fileSize: {
      type: String,
      trim: true,
      default: 'Web Link'
    },

    /** Reference to the admin User who uploaded this resource */
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    /** Atomic counter incremented on each download/access event */
    downloadsCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true // Adds createdAt & updatedAt automatically
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Indexes — optimise the most common query patterns
// ─────────────────────────────────────────────────────────────────────────────

resourceSchema.index({ courseCode: 1 });
resourceSchema.index({ category: 1 });
resourceSchema.index({ semester: 1 });

// Compound text index for full-text search across multiple fields
resourceSchema.index({
  title: 'text',
  description: 'text',
  courseCode: 'text',
  courseName: 'text',
  tags: 'text'
});

// ─────────────────────────────────────────────────────────────────────────────
// Model Export
// ─────────────────────────────────────────────────────────────────────────────

export const Resource = mongoose.model('Resource', resourceSchema);
