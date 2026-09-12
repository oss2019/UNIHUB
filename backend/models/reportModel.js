/**
 * @file reportModel.js
 * @module models/reportModel
 * @description Mongoose schema and model definition for the Report entity.
 *              A Report is a problem a user is facing inside the application,
 *              submitted by that user so admins can triage it and pass it on
 *              to the dev team. Users may only see their own reports; admins
 *              see every report and drive the status workflow.
 *
 * @requires mongoose
 */

import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Enumerations — kept as exported constants so validators stay in lock-step
// ─────────────────────────────────────────────────────────────────────────────

/** Broad classification of the problem being reported */
export const REPORT_CATEGORIES = [
  'bug',
  'ui',
  'performance',
  'content',
  'account',
  'other'
];

/** Triage lifecycle: open → in-progress → resolved (or dismissed) */
export const REPORT_STATUSES = [
  'open',
  'in-progress',
  'resolved',
  'dismissed'
];

// ─────────────────────────────────────────────────────────────────────────────
// Schema Definition
// ─────────────────────────────────────────────────────────────────────────────

const reportSchema = new mongoose.Schema(
  {
    /** Reference to the User who filed this report */
    reportedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },

    /** Short headline shown in the admin triage list */
    title: {
      type: String,
      required: [true, 'Report title is required'],
      trim: true,
      maxlength: [150, 'Title cannot exceed 150 characters']
    },

    /** Full description of the problem the user ran into */
    description: {
      type: String,
      required: [true, 'Report description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },

    /** Which part of the app the problem belongs to */
    category: {
      type: String,
      enum: {
        values: REPORT_CATEGORIES,
        message: 'Invalid report category'
      },
      default: 'other'
    },

    /** Current triage state — only admins may move this forward */
    status: {
      type: String,
      enum: {
        values: REPORT_STATUSES,
        message: 'Invalid report status'
      },
      default: 'open'
    },

    /**
     * Optional Cloudinary secure_url of a screenshot the reporter attached.
     * Uploaded through the same base64 → Cloudinary path as every other image
     * in the codebase. Empty string when no screenshot was supplied.
     */
    screenshot: {
      type: String,
      trim: true,
      default: ''
    },

    /**
     * Admin's working note — e.g. "forwarded to dev team, tracked in issue #42".
     * Never written by the reporter.
     */
    adminNote: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin note cannot exceed 1000 characters'],
      default: ''
    },

    /** Admin who last moved this report out of the 'open' state */
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    }
  },
  {
    timestamps: true // Adds createdAt & updatedAt automatically
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Indexes — optimise the most common query patterns
// ─────────────────────────────────────────────────────────────────────────────

// Admin triage board: "show me every open report, newest first"
reportSchema.index({ status: 1, createdAt: -1 });
reportSchema.index({ category: 1 });

// "My reports" view for the submitting user
reportSchema.index({ reportedBy: 1, createdAt: -1 });

// Full-text search across the headline and body
reportSchema.index({
  title: 'text',
  description: 'text'
});

// ─────────────────────────────────────────────────────────────────────────────
// Model Export
// ─────────────────────────────────────────────────────────────────────────────

export const Report =
  mongoose.models.Report || mongoose.model('Report', reportSchema);
