import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

const { default: app } = await import('../../../../app.js');
const { default: connectDB } = await import('../../../../config/db.js');

const PORT = 5001;
const API_URL = `http://localhost:${PORT}/api/threads`;

app.listen(PORT, async () => {
    await connectDB();
    console.log(`Isolated Test Server running on port ${PORT}`);

    const token = process.env.TEST_JWT;
    const subForumId = process.env.TEST_SUBFORUM_ID;

    try {
        console.log("--- Starting Threads Controller + Cloudinary Attachments Test ---");
        
        // Test 1: Create a Thread with array of attachments
        const postRes = await fetch(`${API_URL}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Cookie': `accessToken=${token}`
            },
            body: JSON.stringify({
                title: "Sharing my Amazon resume!",
                content: "Here is the resume that got me shortlisted.",
                subForumId: subForumId,
                tags: ["amazon", "resume"],
                attachments: [
                    "https://res.cloudinary.com/demo/image/upload/amazon_resume.pdf",
                    "https://res.cloudinary.com/demo/image/upload/amazon_cover_letter.pdf"
                ]
            })
        });
        const postData = await postRes.json();
        console.log("POST /threads ->", JSON.stringify(postData, null, 2));
        
        const threadId = postData.data?.thread?._id;

        if (threadId) {
            // Test 2: Get single Thread to verify attachments saved correctly
            const getSingleRes = await fetch(`${API_URL}/${threadId}`);
            const getSingleData = await getSingleRes.json();
            console.log("\nGET /threads/:id ->", JSON.stringify(getSingleData, null, 2));

            // Test 3: Delete Thread to clean up test DB
            await fetch(`${API_URL}/${threadId}`, {
                method: 'DELETE',
                headers: { 'Cookie': `accessToken=${token}` }
            });
            console.log("\nCleanup: Thread deleted successfully");
        }
        
        console.log("\n--- TEST COMPLETED ---");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
});
