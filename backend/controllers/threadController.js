import * as threadService from '../services/threadService.js';
import * as cloudinaryService from '../services/cloudinaryService.js';
import { AppError } from '../utils/appError.js';
import { catchAsync } from '../utils/catchAsync.js';
import { sendResponse } from '../utils/appResponse.js';
import { cleanTags } from '../utils/tagUtils.js';
import * as notificationService from '../services/notificationService.js';



export const createThread = catchAsync(async (req, res, next) => {
    const { title, content, subForumId, tags, attachments } = req.body;

    if (!title || !content || !subForumId) {
        return next(new AppError(400, "Please provide title, content, and subForumId"));
    }

    // Task from Sprint Plan: Validate tags are present so thread isn't "lost"
    const finalTags = cleanTags(tags);
    if (finalTags.length === 0) {
        return next(new AppError(400, "At least one valid tag is required for discoverability"));
    }

    const subForum = await threadService.findSubForumById(subForumId);
    if (!subForum) {
        return next(new AppError(404, "SubForum not found"));
    }

    // Requirement Page 9: Validate subForum belongs to an approved Forum
    // Note: We fetch the forum to check its approval status
    const forum = await threadService.getForumById(subForum.forum);
    if (!forum || !forum.isActive || (!forum.isApproved && req.user.role !== 'admin')) {
        return next(new AppError(403, "Cannot post to an inactive or unapproved Forum"));
    }

    const rawAttachments = Array.isArray(attachments) ? attachments : [];
    const processedAttachments = await cloudinaryService.uploadBase64Attachments(rawAttachments);

    const newThread = await threadService.createThread({
        title,
        content,
        author: req.user._id,
        subForum: subForum._id,
        forum: subForum.forum, // AUTO-SETS FORUM from subForum.forum field
        tags: finalTags, // validates tags
        attachments: processedAttachments,
        notifyAlumni: forum.type === 'normal' ? (req.body.notifyAlumni || false) : false,
    });

    if (forum.type === 'collab') {
     await notificationService.notifySubForumMembers(newThread);
    }

    // Requirement Page 9: Prepare hook point for @mention detection (Week 3)
    // TODO: const mentions = scanForMentions(content);
    // TODO: if(mentions.length > 0) createNotification(...)

    return sendResponse(res, 201, "success", "thread", newThread);
});

// Requirement Page 9: Global Search Route
export const searchThreads = catchAsync(async (req, res, next) => {
    const query = req.query.q;
    if (!query) {
        return next(new AppError(400, "Please provide a search query"));
    }

    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const { threads, totalCount } = await threadService.searchThreadsByTitle(query, skip, limit);

    const payload = {
        threads,
        totalCount,
        hasMore: skip + threads.length < totalCount
    };

    return sendResponse(res, 200, "success", "pagination", payload, threads.length);
});

export const getSubForumThreads = catchAsync(async (req, res, next) => {
    const subForum = await threadService.findSubForumById(req.params.id);
    if (!subForum) {
        return next(new AppError(404, "SubForum not found"));
    }

    // Visibility Rules: Archived=all see, Dead=admin only, Pending=admin only at list level
    const forum = await threadService.getForumById(subForum.forum);
    if (!forum || !forum.isApproved) {
        if (req.user?.role !== 'admin') {
            return sendResponse(res, 200, "success", "pagination", { threads: [], totalCount: 0, hasMore: false }, 0);
        }
    }

    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const { threads, totalCount } = await threadService.getThreadsBySubForumTags(subForum.tags, skip, limit);

    const payload = {
        threads,
        totalCount,
        hasMore: skip + threads.length < totalCount
    };

    return sendResponse(res, 200, "success", "pagination", payload, threads.length);
});

export const getForumThreads = catchAsync(async (req, res, next) => {
    // Visibility Rules: Archived=all see, Dead=admin only, Pending=admin only at list level
    const forum = await threadService.getForumById(req.params.id);
    if (!forum || !forum.isApproved) {
        if (req.user?.role !== 'admin') {
            return sendResponse(res, 200, "success", "pagination", { threads: [], totalCount: 0, hasMore: false }, 0);
        }
    }

    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const { threads, totalCount } = await threadService.getThreadsByForumId(req.params.id, skip, limit);

    const payload = {
        threads,
        totalCount,
        hasMore: skip + threads.length < totalCount
    };

    return sendResponse(res, 200, "success", "pagination", payload, threads.length);
});

export const getThread = catchAsync(async (req, res, next) => {
    const thread = await threadService.findThreadById(req.params.id);
    if (!thread) {
        return next(new AppError(404, "Thread not found"));
    }

    // Dead forums: only admin can view even individual threads
    const forum = await threadService.getForumById(thread.forum);
    if (forum && !forum.isActive && !forum.isApproved && req.user?.role !== 'admin') {
        return next(new AppError(403, "This thread belongs to a deactivated forum"));
    }

    // ─────────────────────────────────────────────────────────
    // DYNAMIC GHOST LINK VALIDATION
    // ─────────────────────────────────────────────────────────
    const missingLog = [];
    if (thread.attachments && thread.attachments.length > 0) {
        let isModified = false;
        const activeAttachments = [];

        // Run non-blocking HEAD checks sequentially
        for (const url of thread.attachments) {
            try {
                if (url.startsWith('https://res.cloudinary.com')) {
                    const response = await fetch(url, { method: 'HEAD' });
                    if (response.status === 404) {
                        isModified = true;
                        missingLog.push(`Warning: Resource ${url} failed to load or no longer exists. It has been swept from the repository.`);
                        continue; // Drop the URL
                    }
                }
                activeAttachments.push(url);
            } catch (err) {
                // If fetch fails locally due to network, do not blindly delete the image
                activeAttachments.push(url);
            }
        }

        if (isModified) {
            thread.attachments = activeAttachments;
            await thread.save();
        }
    }

    const payload = {
        ...thread.toObject()
    };
    if (missingLog.length > 0) {
        payload.warnings = missingLog;
    }

    return sendResponse(res, 200, "success", "thread", payload);
});

export const updateThread = catchAsync(async (req, res, next) => {
    const thread = await threadService.findThreadById(req.params.id);
    if (!thread) {
        return next(new AppError(404, "Thread not found"));
    }

    // Determine if the request is strictly an Admin pinning action
    const isAdminPinAction = req.user.role === 'admin' && req.body.isPinned !== undefined;

    if (thread.author._id.toString() !== req.user._id.toString() && !isAdminPinAction) {
        return next(new AppError(403, "Only the original author can edit the contents of this thread"));
    }

    if (req.body.isPinned !== undefined && req.user.role !== 'admin') {
        return next(new AppError(403, "Only Admins can Pin/Unpin Threads"));
    }

    if (req.body.subForumId || req.body.subForum) {
        return next(new AppError(400, "Cannot change the subForum of an existing thread"));
    }

    if (req.body.isPinned !== undefined && req.user.role === 'admin') {
        thread.isPinned = req.body.isPinned;
    }
    if (req.body.title) thread.title = req.body.title;
    if (req.body.content) thread.content = req.body.content;
    if (req.body.tags) {
        const updatedTags = cleanTags(req.body.tags);
        if (updatedTags.length === 0) {
            return next(new AppError(400, "At least one valid tag is required for discoverability"));
        }
        thread.tags = updatedTags;
    }

    if (req.body.attachments) {
        const oldAttachments = thread.attachments || [];
        const rawAttachments = Array.isArray(req.body.attachments) ? req.body.attachments : [];
        thread.attachments = await cloudinaryService.uploadBase64Attachments(rawAttachments);

        // Delete removed assets from Cloudinary storage
        const removed = oldAttachments.filter(url => !thread.attachments.includes(url));
        if (removed.length > 0) {
            await cloudinaryService.deleteAttachedAssets(removed);
        }
    }

    await thread.save();

    return sendResponse(res, 200, "success", "thread", thread);
});

export const deleteThread = catchAsync(async (req, res, next) => {
    const thread = await threadService.findThreadById(req.params.id);
    if (!thread) {
        return next(new AppError(404, "Thread not found"));
    }

    if (thread.author._id.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
        return next(new AppError(403, "Not authorized to delete this thread"));
    }

    await threadService.deleteThread(thread);

    return sendResponse(res, 200, "success", "thread", null, undefined, "Thread deleted successfully");
});

// ─────────────────────────────────────────────────────────
// Person A Integration: GET /api/users/:id/threads
// Returns all threads authored by a specific user.
// Person A should import this into userRoutes.js
// ─────────────────────────────────────────────────────────
export const getUserThreads = catchAsync(async (req, res, next) => {
    const limit = parseInt(req.query.limit) || 20;
    const page = parseInt(req.query.page) || 1;
    const skip = (page - 1) * limit;

    const { threads, totalCount } = await threadService.getThreadsByAuthor(req.params.id, skip, limit);

    const payload = {
        threads,
        totalCount,
        hasMore: skip + threads.length < totalCount
    };

    return sendResponse(res, 200, "success", "pagination", payload, threads.length);
});
