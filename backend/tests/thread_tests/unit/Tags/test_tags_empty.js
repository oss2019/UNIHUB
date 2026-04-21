import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

import Thread from '../../../../models/threadModel.js';
import SubForum from '../../../../models/subforumModel.js';
import User from '../../../../models/userModel.js';
import Forum from '../../../../models/forumModel.js';
import { createThread, updateThread } from '../../../../controllers/threadController.js';

const mockRes = () => {
    const res = {};
    res.status = (code) => { res.statusCode = code; return res; };
    res.json = (data) => { res.data = data; res.data.statusCode = res.statusCode; return res; };
    return res;
};

let reportLog = [];
let passedCount = 0;
let failedCount = 0;

const logResult = (name, inputStr, desc, expected, got, condition) => {
    const formatGot = typeof got === 'object' ? JSON.stringify(got) : String(got);
    if (condition) {
        passedCount++;
        console.log(`✅ ${name}: ${desc}`);
        reportLog.push(`| ✅ ${name} | \`${inputStr}\` | ${desc} | ${expected} | ${formatGot} |`);
    } else {
        failedCount++;
        console.error(`❌ ${name}: ${desc}\n   Expected: ${expected}\n   Got: ${formatGot}`);
        reportLog.push(`| ❌ **FAILED: ${name}** | \`${inputStr}\` | ${desc} | ${expected} | ${formatGot} |`);
    }
};

async function testTagsEmpty() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Test.");

        await Thread.deleteMany({});
        await SubForum.deleteMany({});
        await Forum.deleteMany({});
        await User.deleteMany({});

        const dummyForum = await Forum.create({ name: 'Tech', description: 'Tech related discussions', isApproved: true });
        const dummySubForum = await SubForum.create({ name: 'Web Dev', tags: ['webdev'], forum: dummyForum._id });
        const dummyUser = await User.create({ googleId: '12345678', email: 'test_empty@iitdh.ac.in', name: 'Tester', role: 'student' });

        let reportText = `# Tag Validation: Empty Array & Whitespace
This suite explicitly pairs complementary scenarios (e.g., passing a valid array vs passing an empty array) to rigorously test boundary behaviors.

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

        // ──────────────────────────────────────────
        // COMPLEMENTARY PAIR 1: POST CREATE THREAD
        // ──────────────────────────────────────────
        // EXPECTED SUCCESS: Valid tags provided
        const reqCreateValid = {
            user: { _id: dummyUser._id, role: 'student' },
            body: { title: "Title", content: "Content", subForumId: dummySubForum._id, tags: ["valid"] }
        };
        const resCreateValid = mockRes();
        let errCreateValid = null;
        await new Promise((resolve) => {
            const next = (err) => { errCreateValid = err; resolve(); };
            resCreateValid.json = (data) => { resCreateValid.data = data; resolve(); };
            createThread(reqCreateValid, resCreateValid, next);
        });

        logResult(
            "Create Valid Tag (Success)", 
            "['valid']",
            "Allows thread creation when valid tags exist.", 
            "201 Created", 
            errCreateValid ? errCreateValid.statusCode : (resCreateValid.statusCode || '201 Created'), 
            !errCreateValid
        );

        // EXPECTED FAILURE: Empty tags provided
        const reqCreateInvalid = {
            user: { _id: dummyUser._id, role: 'student' },
            body: { title: "Title", content: "Content", subForumId: dummySubForum._id, tags: ["   ", ""] }
        };
        const resCreateInvalid = mockRes();
        let errCreateInvalid = null;
        await createThread(reqCreateInvalid, resCreateInvalid, (err) => { errCreateInvalid = err; });

        logResult(
            "Create Ghost Tag (Fail Blocked)", 
            "['   ', '']",
            "Blocks thread creation containing only whitespace tags.", 
            "400 Bad Request", 
            errCreateInvalid ? "400 Bad Request" : resCreateInvalid.data, 
            errCreateInvalid && errCreateInvalid.statusCode === 400
        );

        // ──────────────────────────────────────────
        // COMPLEMENTARY PAIR 2: PATCH UPDATE THREAD
        // ──────────────────────────────────────────
        const validThread = await Thread.create({
            title: "Valid Thread", content: "Content", author: dummyUser._id,
            subForum: dummySubForum._id, forum: dummyForum._id, tags: ["initial"]
        });

        // EXPECTED SUCCESS: Updating to valid tags
        const reqUpdateValid = {
            user: { _id: dummyUser._id, role: 'student' },
            params: { id: validThread._id },
            body: { tags: ["new_valid", "tag"] }
        };
        const resUpdateValid = mockRes();
        let errUpdateValid = null;
        await new Promise((resolve) => {
            const next = (err) => { errUpdateValid = err; resolve(); };
            resUpdateValid.json = (data) => { resUpdateValid.data = data; resolve(); };
            updateThread(reqUpdateValid, resUpdateValid, next);
        });

        logResult(
            "Update Valid Tag (Success)", 
            "['new_valid', 'tag']",
            "Allows editing of tags when valid new tags are mapped.", 
            "200 OK", 
            errUpdateValid ? errUpdateValid.statusCode : "200 OK", 
            !errUpdateValid
        );

        // EXPECTED FAILURE: Empty tags provided on update
        const reqUpdateInvalid = {
            user: { _id: dummyUser._id, role: 'student' },
            params: { id: validThread._id },
            body: { tags: [] }
        };
        const resUpdateInvalid = mockRes();
        let errUpdateInvalid = null;
        await new Promise((resolve) => {
            const next = (err) => { errUpdateInvalid = err; resolve(); };
            resUpdateInvalid.json = (data) => { resUpdateInvalid.data = data; resolve(); };
            updateThread(reqUpdateInvalid, resUpdateInvalid, next);
        });

        logResult(
            "Update Ghost Tag (Fail Blocked)", 
            "[]",
            "Blocks edit attempting to wipe all tags from an existing thread.", 
            "400 Bad Request", 
            errUpdateInvalid ? "400 Bad Request" : resUpdateInvalid.data, 
            errUpdateInvalid && errUpdateInvalid.statusCode === 400
        );

        reportText += reportLog.join('\n');
        reportText += `\n\n### Summary\n- **Passed:** ${passedCount}\n- **Failed:** ${failedCount}`;

        fs.writeFileSync(path.join(__dirname, 'test_tags_empty.md'), reportText);
        console.log(`\n🎉 Report generated successfully at thread_tests/unit/Tags/test_tags_empty.md`);
        process.exit(0);

    } catch (error) {
        console.error("Test execution failed with exception:", error);
        process.exit(1);
    }
}

testTagsEmpty();
