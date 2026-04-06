import 'dotenv/config';
import path from 'path';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { v2 as cloudinary } from 'cloudinary';

// 1. Get the current directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 2. Explicitly point to the .env file (one level up from this file)
dotenv.config({ path: path.join(__dirname, '..', '.env') });

// 3. Use native SDK detection - it's much more robust than a manual regex!
if (process.env.CLOUDINARY_URL) {
    cloudinary.config(true); // Automatically detects process.env.CLOUDINARY_URL
} else {
    // Fallback for separate keys
    cloudinary.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    });
}

export default cloudinary;
