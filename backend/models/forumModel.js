import mongoose from "mongoose";
// ─────────────────────────────────────────────────────────────────────────────
// FORUM REQUEST
// Users submit a request → admin approves or rejects.
// Only on approval is the actual Forum document created.
// ─────────────────────────────────────────────────────────────────────────────
const forumRequestSchema = new mongoose.Schema(
  {
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
    // Populated once admin approves — points to the created Forum
    forumCreated: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Forum",
      default: null,
    },
  },
  { timestamps: true },
);

// ─────────────────────────────────────────────────────────────────────────────
// FORUM
// Top-level container (e.g. "Placements", "Internships").
// Created by admin on approving a ForumRequest.
// ─────────────────────────────────────────────────────────────────────────────
const forumSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      default: null,
      trim: true,
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
    // For Threads module — Required for thread visibility checks
    isApproved: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

export const Forum = mongoose.model("Forum", forumSchema);
export const ForumRequest = mongoose.model("ForumRequest", forumRequestSchema);
