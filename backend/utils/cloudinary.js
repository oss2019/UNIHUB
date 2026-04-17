import { v2 as cloudinary } from "cloudinary";
import { AppError } from "./appError.js";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "../.env") });

// Cloudinary auto-reads CLOUDINARY_URL from env if present.
// Fall back to explicit keys if they exist separately.
if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true);
} else if (process.env.CLOUDINARY_CLOUD_NAME) {
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });
}

export const uploadToCloudinary = (fileBuffer, folder = "comments", resourceType = "auto") => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder,
                resource_type: resourceType,
            },
            (error, result) => {
                if (error) {
                    return reject(new AppError(500, `Cloudinary upload failed: ${error.message}`));
                }
                resolve({
                    url: result.secure_url,
                    publicId: result.public_id,
                });
            }
        );
        uploadStream.end(fileBuffer);
    });
};

export const deleteFromCloudinary = async (publicId, resourceType = "auto") => {
    if (!publicId) return;

    try {
        await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType,
        });
    } catch (error) {
        console.error("Cloudinary delete failed:", error.message);
    }
};

// Export the configured singleton for direct usage in cloudinaryService.js
export { cloudinary };