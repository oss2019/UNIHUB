/**
 * @file teamMemberModel.js
 * @module models/teamMemberModel
 * @description Mongoose schema and model definition for the Team Member entity.
 *              Backs the "Team" page, which is split into three categories:
 *
 *                dev-team                   → the developers who built the portal
 *                academic-council           → the council that got it developed
 *                current-academic-council   → the council currently in office
 *
 *              Publicly readable; fully editable by admins only.
 *
 * @requires mongoose
 */

import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// Enumerations — exported so the validator never drifts from the schema
// ─────────────────────────────────────────────────────────────────────────────

/** The three buckets a team member can belong to */
export const TEAM_CATEGORIES = [
  'dev-team',
  'academic-council',
  'current-academic-council'
];

/** Earliest graduation year we accept */
export const MIN_GRADUATION_YEAR = 1960;

/** Allow a reasonable look-ahead for students yet to graduate */
export const maxGraduationYear = () => new Date().getFullYear() + 10;

// ─────────────────────────────────────────────────────────────────────────────
// Schema Definition
// ─────────────────────────────────────────────────────────────────────────────

const teamMemberSchema = new mongoose.Schema(
  {
    /** Full name of the team member */
    name: {
      type: String,
      required: [true, 'Team member name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters']
    },

    /**
     * Cloudinary secure_url of the member's photograph.
     * Populated by the service layer after piping the incoming base64 /
     * external URL through Cloudinary. Empty string when no photo was supplied.
     */
    photo: {
      type: String,
      trim: true,
      default: ''
    },

    /** Year the member graduated (or is expected to graduate) */
    graduationYear: {
      type: Number,
      required: [true, 'Graduation year is required'],
      min: [MIN_GRADUATION_YEAR, `Graduation year must be ${MIN_GRADUATION_YEAR} or later`],
      validate: {
        validator: function (year) {
          return Number.isInteger(year) && year <= maxGraduationYear();
        },
        message: () => `Graduation year cannot be later than ${maxGraduationYear()}`
      }
    },

    /** Which of the three team buckets this member belongs to */
    category: {
      type: String,
      required: [true, 'Team category is required'],
      enum: {
        values: TEAM_CATEGORIES,
        message: 'Invalid team category'
      }
    },

    /** Reference to the admin User who added this entry */
    addedBy: {
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

// Team page renders one category at a time, newest graduates first
teamMemberSchema.index({ category: 1, graduationYear: -1 });

// ─────────────────────────────────────────────────────────────────────────────
// Model Export
// ─────────────────────────────────────────────────────────────────────────────

export const TeamMember =
  mongoose.models.TeamMember ||
  mongoose.model('TeamMember', teamMemberSchema);
