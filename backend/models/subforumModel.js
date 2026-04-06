import mongoose from "mongoose";

// ─────────────────────────────────────────────────────────────────────────────
// SUBFORUM REQUEST
// Same request/approve pattern as ForumRequest.
// ─────────────────────────────────────────────────────────────────────────────
const subForumRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    forum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    // Tags link threads to this sub-forum.
    // e.g. ['amazon', 'sde', 'referral']
    tags: {
      type: [String],
      default: [],
    },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    reviewNote: {
      type: String,
      default: null,
    },
    // Populated once admin approves
    subForumCreated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SubForum",
      default: null,
    },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────────────────────────────────────
// SUBFORUM
// Lives inside a Forum. Threads posted here (or whose tags match) surface here.
// ─────────────────────────────────────────────────────────────────────────────
const subForumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
    },
    forum: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      required: true,
    },
    tags: {
      type: [String],
      default: [],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

// Fast lookups
subForumSchema.index({ forum: 1 });
subForumSchema.index({ tags: 1 });

const SubForum =
  mongoose.models.SubForum || mongoose.model("SubForum", subForumSchema);

const SubForumRequest =
  mongoose.models.SubForumRequest ||
  mongoose.model("SubForumRequest", subForumRequestSchema);

export { SubForumRequest };
export default SubForum;
