/**
 * @file facultyReviewModel.js
 * @module models/facultyReviewModel
 * @description Mongoose schema and model definition for the Faculty Review entity.
 *              Each document is a review of a faculty member published by an admin.
 *              Reviews are publicly readable; only admins may create, edit or remove them.
 *
 * @requires mongoose
 */

import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Schema Definition
// ─────────────────────────────────────────────────────────────────────────────

const facultyReviewSchema = new mongoose.Schema(
  {
    /** Name of the faculty member this review is about */
    facultyName: {
      type: String,
      required: [true, 'Faculty name is required'],
      trim: true,
      maxlength: [120, 'Faculty name cannot exceed 120 characters']
    },

    /**
     * Cloudinary secure_url of the faculty photograph.
     * Populated by the service layer after piping the incoming base64 /
     * external URL through Cloudinary. Empty string when no photo was supplied.
     */
    photo: {
      type: String,
      trim: true,
      default: ''
    },

    /** Body of the review itself */
    review: {
      type: String,
      required: [true, 'Review text is required'],
      trim: true,
      maxlength: [5000, 'Review cannot exceed 5000 characters']
    },

    /** Reference to the admin User who published this review */
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    }
  },
  {
    timestamps: true // Adds createdAt & updatedAt automatically
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// Indexes — optimise the most common query patterns
// ─────────────────────────────────────────────────────────────────────────────

facultyReviewSchema.index({ facultyName: 1 });
facultyReviewSchema.index({ createdAt: -1 });

// Full-text search across the faculty name and the review body
facultyReviewSchema.index({
  facultyName: 'text',
  review: 'text'
});

// ─────────────────────────────────────────────────────────────────────────────
// Model Export
// ─────────────────────────────────────────────────────────────────────────────

export const FacultyReview =
  mongoose.models.FacultyReview ||
  mongoose.model('FacultyReview', facultyReviewSchema);
