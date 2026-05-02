import mongoose from 'mongoose';

// ─────────────────────────────────────────────────────────────────────────────
// WORK REQUEST
// Project owner raises a work opportunity → selects target sub-forums →
// all members of those sub-forums receive a WORK_OPPORTUNITY notification.
// ─────────────────────────────────────────────────────────────────────────────
const workRequestSchema = new mongoose.Schema(
  {
    // The project owner who raised this request
    raisedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // The collab sub-forum (project) that needs contributors
    sourceSubForum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SubForum',
      required: true,
    },

    // Sub-forums whose members should be notified
    targetSubForums: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'SubForum',
      },
    ],

    // What the work opportunity is about
    title: {
      type: String,
      required: [true, 'Work request title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    description: {
      type: String,
      default: null,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },

    // Skills/tags relevant to this work request (for display purposes)
    requiredSkills: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    status: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
  },
  { timestamps: true }
);

// Fast lookups
workRequestSchema.index({ sourceSubForum: 1, createdAt: -1 });
workRequestSchema.index({ raisedBy: 1 });
workRequestSchema.index({ status: 1 });

const WorkRequest =
  mongoose.models.WorkRequest ||
  mongoose.model('WorkRequest', workRequestSchema);

export default WorkRequest;
