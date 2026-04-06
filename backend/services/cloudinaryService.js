import cloudinary from '../utils/cloudinary.js';

export const uploadBase64Attachments = async (attachments) => {
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) return [];
    
    const secureUrls = [];
    for (const attachment of attachments) {
        try {
            if (attachment.startsWith('http') && attachment.includes('res.cloudinary.com')) {
                // Already hosted on our Cloudinary. Passthrough.
                secureUrls.push(attachment);
            } else if (attachment.startsWith('http') || attachment.startsWith('data:image')) {
                // External URL OR Base64 data. "Capture" it to our Cloudinary.
                const result = await cloudinary.uploader.upload(attachment, {
                    folder: 'alumni_connect_threads'
                });
                secureUrls.push(result.secure_url);
            }
        } catch (error) {
            console.error("Cloudinary Upload Error for attachment:", attachment.slice(0, 50), error);
            // In a production environment, we could choose to skip it or throw.
            // For now, we skip to prevent breaking the entire thread creation.
        }
    }
    return secureUrls;
};

export const deleteAttachedAssets = async (attachments) => {
    if (!attachments || !Array.isArray(attachments) || attachments.length === 0) return;

    for (const url of attachments) {
        try {
            // Extract full public ID including folders (everything after /upload/v.../ and without extension)
            const uploadSplit = url.split('/upload/');
            if (uploadSplit.length < 2) continue;
            
            let pathPart = uploadSplit[1];
            if (pathPart.match(/^v\d+\//)) {
                pathPart = pathPart.replace(/^v\d+\//, '');
            }
            
            const publicId = pathPart.substring(0, pathPart.lastIndexOf('.'));
            
            await cloudinary.uploader.destroy(publicId);
        } catch (error) {
            console.error("Cloudinary Deletion Error for URL:", url, error);
            // Non-blocking error. Avoid throwing to not break local flow if Cloudinary is misconfigured dynamically.
        }
    }
};
