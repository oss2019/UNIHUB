import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const { default: app } = await import('../../../../app.js');
const { default: connectDB } = await import('../../../../config/db.js');
const { cloudinary } = await import('../../../../utils/cloudinary.js');

const PORT = 5002;
const API_URL = `http://localhost:${PORT}/api/threads`;

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Test Server running on port ${PORT}`);

    const token = process.env.TEST_JWT;
    const subForumId = process.env.TEST_SUBFORUM_ID;

    try {
        console.log("--- Firing POST /api/threads using form-data ---");

        // The absolute physical path to the file you want to upload
        const imagePath = path.join(__dirname, '../../../../Photos/Abraham-Lincoln.jpg');
        
        // Ensure the file exists before testing
        if (!fs.existsSync(imagePath)) {
            console.error(`❌ FATAL: The test asset does not exist at ${imagePath}`);
            process.exit(1);
        }
        
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
