import mongoose from 'mongoose';

const subForumSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    forum: { type: mongoose.Schema.Types.ObjectId, ref: 'Forum', required: true },
    tags: [String],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });

export default mongoose.model('SubForum', subForumSchema);
