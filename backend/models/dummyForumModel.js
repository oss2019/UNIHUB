import mongoose from 'mongoose';

const forumSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    isActive: { type: Boolean, default: true },
    isApproved: { type: Boolean, default: true }
}, { timestamps: true });

export default mongoose.model('Forum', forumSchema);
