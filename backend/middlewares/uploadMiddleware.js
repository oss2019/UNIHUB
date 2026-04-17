import multer from "multer";
import { AppError } from "../utils/appError.js";

// Store file in memory (as Buffer) — we'll stream it to Cloudinary
const storage = multer.memoryStorage();

// Allowed MIME types for comment attachments
const allowedMimeTypes = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "image/webp",
    "application/pdf",
];

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new AppError(
                400,
                "Invalid file type. Only JPEG, PNG, GIF, WEBP images and PDF files are allowed."
            ),
            false
        );
    }
};

// Max file size: 5MB
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 },
});

// Single file upload under field name "attachment"
export const uploadCommentAttachment = upload.single("attachment");