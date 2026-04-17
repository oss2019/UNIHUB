import Thread from '../models/threadModel.js';
import SubForum from '../models/subforumModel.js';
import Forum from '../models/forumModel.js';
import { deleteAttachedAssets } from './cloudinaryService.js';

export const findSubForumById = async (id) => {
    return await SubForum.findById(id);
};

export const getForumById = async (id) => {
    return await Forum.findById(id);
};

export const searchThreadsByTitle = async (query, skip, limit) => {
    const filter = { title: { $regex: query, $options: 'i' } };
    const threads = await Thread.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar role');
    const totalCount = await Thread.countDocuments(filter);
    
    return { threads, totalCount };
};

export const createThread = async (threadData) => {
    return await Thread.create(threadData);
};

export const getThreadsBySubForumTags = async (tags, skip, limit) => {
    const filter = { tags: { $in: tags } };
    const threads = await Thread.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar role');
    const totalCount = await Thread.countDocuments(filter);
    
    return { threads, totalCount };
};

export const getThreadsByForumId = async (forumId, skip, limit) => {
    const filter = { forum: forumId };
    const threads = await Thread.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar role');
    const totalCount = await Thread.countDocuments(filter);

    return { threads, totalCount };
};

export const getThreadsByAuthor = async (authorId, skip, limit) => {
    const filter = { author: authorId };
    const threads = await Thread.find(filter)
        .sort({ isPinned: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('author', 'name avatar role');
    const totalCount = await Thread.countDocuments(filter);
    return { threads, totalCount };
};

export const findThreadById = async (id) => {
    return await Thread.findById(id).populate('author', 'name avatar role');
};

export const deleteThread = async (thread) => {
    // Clean up associated Cloudinary media before the thread record disappears
    if (thread.attachments && thread.attachments.length > 0) {
        await deleteAttachedAssets(thread.attachments);
    }
    await thread.deleteOne();
};