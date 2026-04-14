import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

console.log('--- ENV CHECK ---');
console.log('CLOUDINARY_URL present:', !!process.env.CLOUDINARY_URL);
if (process.env.CLOUDINARY_URL) {
    console.log('CLOUDINARY_URL cloudsuffix:', process.env.CLOUDINARY_URL.split('@')[1]);
}
console.log('--- END ENV CHECK ---');
