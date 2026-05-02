import mongoose from "mongoose";

const commentSchema = new mongoose.Schema(
    {
        content: {
            type: String,
            required: [true, "Comment content is required"],
            trim: true,
            maxlength: [2000, "Comment cannot exceed 2000 characters"],
        },
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Author is required"],
        },
        thread: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Thread",
            required: [true, "Thread is required"],
        },
        parentComment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Comment",
            default: null, // null means top-level comment
        },
        isDeleted: {
            type: Boolean,
            default: false,
        },
        attachments: {
            type: String, // Cloudinary URL
            default: null,
        },
        attachmentPublicId: {
            type: String, // Cloudinary public_id — needed for deletion
            default: null,
        },
        reportCount: {
            type: Number,
            default: 0,
        },
    },
    {
        timestamps: true, // createdAt and updatedAt
        toJSON: { virtuals: true },
        toObject: { virtuals: true },
    }
);

// Virtual: get replies for this comment
commentSchema.virtual("replies", {
    ref: "Comment",
    localField: "_id",
    foreignField: "parentComment",
});

// Index for fast lookup by thread
commentSchema.index({ thread: 1, createdAt: -1 });

// Index for fast lookup of replies
commentSchema.index({ parentComment: 1 });

const Comment = mongoose.model("Comment", commentSchema);

export default Comment;