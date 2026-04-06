import mongoose from 'mongoose';

const threadSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    subForum: { type: mongoose.Schema.Types.ObjectId, ref: 'SubForum', required: true },
    forum: { type: mongoose.Schema.Types.ObjectId, ref: 'Forum', required: true },
    tags: [{ type: String }],
    attachments: [{ type: String }],
    commentCount: { type: Number, default: 0 },
    isPinned: { type: Boolean, default: false }
}, { timestamps: true });

threadSchema.index({ subForum: 1, createdAt: -1 });
threadSchema.index({ forum: 1, createdAt: -1 });
threadSchema.index({ tags: 1 });

export default mongoose.model('Thread', threadSchema);
