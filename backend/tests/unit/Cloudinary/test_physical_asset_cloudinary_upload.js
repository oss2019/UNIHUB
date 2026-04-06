import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import app from '../app.js';
import connectDB from '../config/db.js';
import cloudinary from '../../../utils/cloudinary.js';

const PORT = 5002;
const API_URL = `http://localhost:${PORT}/api/threads`;

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Test Server running on port ${PORT}`);

    const token = process.env.TEST_JWT;
    const subForumId = process.env.TEST_SUBFORUM_ID;

    try {
        console.log("--- 1. Uploading Physical File to Cloudinary ---");
        const imagePath = path.join(__dirname, '../images/Comparc_note.png');
        
        const uploadResult = await cloudinary.uploader.upload(imagePath, {
            folder: 'alumni_connect_test'
        });
        
        console.log("✅ Uploaded! Secure URL:", uploadResult.secure_url);

        console.log("\n--- 2. Firing POST /api/threads with the URL ---");
        
        const postRes = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `accessToken=${token}`
            },
            body: JSON.stringify({
                title: "Check out my Computer Architecture Note!",
                content: "Here is the CompArc note diagram I promised.",
                subForumId: subForumId,
                tags: ["comparc", "notes", "cse"],
                attachments: [uploadResult.secure_url]
            })
        });
        
        const postData = await postRes.json();
        console.log("\n✅ Response from POST /threads ->");
        console.log(JSON.stringify(postData, null, 2));

        console.log("\n--- TEST COMPLETED ---");
        process.exit(0);
    } catch(err) {
        console.error("\n❌ Error Encountered:");
        console.error(err.message || err);
        process.exit(1);
    }
});
