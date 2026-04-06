import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import Thread from '../../../models/threadModel.js';
import { SubForum } from '../../../models/subforumModel.js';
import User from '../../../models/userModel.js';
import { Forum } from '../../../models/forumModel.js';
import { createThread } from '../../../controllers/threadController.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; return res; };
    return res;
};

let reportLog = [];
let passedCount = 0;
let failedCount = 0;

const logResult = (name, inputStr, desc, expected, got, condition) => {
    const formatGot = typeof got === 'object' ? JSON.stringify(got) : String(got);
    if (condition) {
        passedCount++;
        console.log(`âœ… ${name}: ${desc}`);
        reportLog.push(`| âœ… ${name} | \`${inputStr}\` | ${desc} | ${expected} | ${formatGot} |`);
    } else {
        failedCount++;
        console.error(`âŒ ${name}: ${desc}\n   Expected: ${expected}\n   Got: ${formatGot}`);
        reportLog.push(`| âŒ **FAILED: ${name}** | \`${inputStr}\` | ${desc} | ${expected} | ${formatGot} |`);
    }
};

async function testTagsSanitization() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Test.");

        await Thread.deleteMany({});
        await SubForum.deleteMany({});
        await Forum.deleteMany({});
        await User.deleteMany({});

        const dummyForum = await Forum.create({ name: 'Tech', description: 'Tech discussions', isApproved: true });
        const dummySubForum = await SubForum.create({ name: 'Web Dev', tags: ['webdev'], forum: dummyForum._id });
        const dummyUser = await User.create({ googleId: '12345', email: 'test_s@iitdh.ac.in', name: 'Tester', role: 'student' });

        let reportText = `# Tag Validation: Deduplication & Sanitization
This suite verifies that the API safely intercepts raw string arrays and strictly formats them.

## 1. Environment State
### Data Loaded
- Forum: \`Tech\` (Approved/Active)
- SubForum: \`Web Dev\`
- User: \`${dummyUser.name}\` (Role: student)

---

## 2. Test Execution Log

| Target | Input Data | Description | Expected Behavior | Actual Outcome |
| :--- | :--- | :--- | :--- | :--- |
`;

        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // COMPLEMENTARY PAIR: TAG SANITIZATION
        // â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
        // EXPECTED SUCCESS: Basic well-formatted tags
        const reqValid = {
            user: { _id: dummyUser._id, role: 'student' },
            body: { title: "Title", content: "c", subForumId: dummySubForum._id, tags: ["clean", "sharp"] }
        };
        const resValid = mockRes();
        await new Promise((resolve) => {
            resValid.json = (data) => {
                const created = data.data.thread;
                const match = ["clean", "sharp"].every(t => created.tags.includes(t));
                logResult(
                    "Standard Clean Array (Success)", 
                    '["clean", "sharp"]',
                    "A well-structured array is saved correctly untouched.", 
                    '["clean","sharp"]', 
                    created.tags, 
                    match
                );
                resolve();
            };
            createThread(reqValid, resValid, (err) => { if(err) resolve(); });
        });

        // EXPECTED SUCCESS & RESOLUTION: Very messy arrays auto-fix
        const reqMessy = {
            user: { _id: dummyUser._id, role: 'student' },
            body: { title: "Title", content: "c", subForumId: dummySubForum._id, tags: ["Job ", "  job   ", "JOB", "Internship", " INTERNSHIP  ", "", " "] }
        };
        const resMessy = mockRes();
        await new Promise((resolve) => {
            resMessy.json = (data) => {
                const created = data.data.thread;
                const expectedTags = ["job", "internship"];
                const areTagsSame = expectedTags.length === created.tags.length && expectedTags.every(t => created.tags.includes(t));

                logResult(
                    "Messy Duplicate Merging (Success fix)", 
                    '["Job ", "  job   ", "JOB", "Internship", " INTERNSHIP  ", "", " "]',
                    "Verifies messy duplicates are aggressively merged and whitespaces eliminated.", 
                    '["job","internship"]', 
                    created.tags, 
                    areTagsSame
                );
                resolve();
            };
            createThread(reqMessy, resMessy, (err) => { if(err) resolve(); });
        });

        reportText += reportLog.join('\n');
        reportText += `\n\n### Summary\n- **Passed:** ${passedCount}\n- **Failed:** ${failedCount}`;

        fs.writeFileSync(path.join(__dirname, 'test_tags_sanitization.md'), reportText);
        console.log(`\nðŸŽ‰ Report generated successfully at tests/unit/Tags/test_tags_sanitization.md`);
        process.exit(0);

    } catch (error) {
        console.error("Test failed with error:", error);
        process.exit(1);
    }
}

testTagsSanitization();
