import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../../../.env') });

const API_URL = 'http://localhost:5000/api/messages';

async function runTests() {
    const token = process.env.TEST_JWT;
    const receiverId = process.env.TEST_RECEIVER_ID;

    if (!receiverId) throw new Error("Please run seedDevelopment.js again to generate TEST_RECEIVER_ID inside .env");

    console.log("--- Starting Messages End-to-End Test ---");
    
    // Test 1: Send Message
    const postRes = await fetch(`${API_URL}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Cookie': `accessToken=${token}`
        },
        body: JSON.stringify({
            receiverId: receiverId,
            content: "Hey, do you have notes for algorithms?"
        })
    });
    const postData = await postRes.json();
    console.log("POST /messages ->", postData);
    
    const messageId = postData.data?.message?._id;

    if (messageId) {
        // Test 2: Get Active Conversations
        const getActiveRes = await fetch(`${API_URL}/conversations/active`, {
            headers: { 'Cookie': `accessToken=${token}` }
        });
        console.log("\nGET /messages/conversations/active ->", await getActiveRes.json());
        
        // Test 3: Get Complete Conversation
        const getConvoRes = await fetch(`${API_URL}/${receiverId}`, {
            headers: { 'Cookie': `accessToken=${token}` }
        });
        console.log("\nGET /messages/:userId ->", await getConvoRes.json());

        // Test 4: Mark Message Read (Fails with 403 intentionally since we are the sender trying to read)
        const readRes = await fetch(`${API_URL}/${messageId}/read`, {
            method: 'PATCH',
            headers: { 'Cookie': `accessToken=${token}` }
        });
        console.log("\nPATCH /messages/:messageId/read (As Sender - Should intentionally be 403) ->", await readRes.json());
        
    } else {
        console.error("No message created.", postData);
    }
}

runTests();
