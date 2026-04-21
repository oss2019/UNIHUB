// ═══════════════════════════════════════════════════════════════════════
// UNIHUB — UNIT TEST: Advanced Tag Logic (test_tags_advanced.js)
// Covers: Hyphenation, Type Coercion, Null/Undefined Safety
// These behaviors were introduced by merging Person B's cleanTags
// with the original sanitizeTags implementation.
// ═══════════════════════════════════════════════════════════════════════

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
    res.json = (data) => { res.data = data; if (res._resolve) res._resolve(); return res; };
    return res;
};

const run = (controllerFn, req, res) => {
    return new Promise((resolve) => {
        res._resolve = resolve;
        const next = (err) => { res.error = err; resolve(); };
        controllerFn(req, res, next);
    });
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

async function testTagsAdvanced() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("Connected to MongoDB for Advanced Tag Tests.\n");

        await Thread.deleteMany({});
        await SubForum.deleteMany({});
        await Forum.deleteMany({});
        await User.deleteMany({});

        const forum = await Forum.create({ name: 'AdvTagForum', description: 'Advanced tag tests', isApproved: true, isActive: true });
        const subForum = await SubForum.create({ name: 'AdvTagSub', tags: ['test'], forum: forum._id });
        const user = await User.create({ googleId: 'adv_tag_1', email: 'advtag@iitdh.ac.in', name: 'AdvTester', role: 'student' });

        let reportText = `# Tag Validation: Advanced Logic (Hyphenation, Type Coercion, Null Safety)
This suite tests behaviors introduced by merging Person B's \`cleanTags\` utility with the original \`sanitizeTags\`.

## 1. Environment State
### Data Loaded
- Forum: \`AdvTagForum\` (Approved/Active)
- SubForum: \`AdvTagSub\`
- User: \`${user.name}\` (Role: student)

---

## 2. Test Execution Log

| Target | Input Data | Description | Expected Behavior | Actual Outcome |
| :--- | :--- | :--- | :--- | :--- |
`;

        // ══════════════════════════════════════════════════════════════
        // SECTION 1: HYPHENATION (4 tests)
        // ══════════════════════════════════════════════════════════════
        console.log("--- SECTION 1: Hyphenation ---");

        // 1.1 Basic space → hyphen (Pass)
        const res1 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Hyphen Basic", content: "Body content here", subForumId: subForum._id, tags: ["Web Dev", "Data Science"] }
        }, res1);
        const tags1 = res1.data?.data?.thread?.tags || [];
        logResult("H1 Basic Hyphenation (Pass)", '["Web Dev", "Data Science"]',
            "Single spaces between words are converted to hyphens.", '["web-dev","data-science"]',
            tags1, tags1.includes('web-dev') && tags1.includes('data-science'));

        // 1.2 Multiple consecutive spaces collapse to single hyphen (Pass)
        const res2 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Hyphen Multi", content: "Body content here", subForumId: subForum._id, tags: ["Machine     Learning", " deep  learning "] }
        }, res2);
        const tags2 = res2.data?.data?.thread?.tags || [];
        logResult("H2 Multi-Space Collapse (Pass)", '["Machine     Learning", " deep  learning "]',
            "Multiple consecutive spaces collapse into a single hyphen.", '["machine-learning","deep-learning"]',
            tags2, tags2.includes('machine-learning') && tags2.includes('deep-learning'));

        // 1.3 Already hyphenated tags remain unchanged (Pass)
        const res3 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Hyphen Pre", content: "Body content here", subForumId: subForum._id, tags: ["react-native", "  vue-js  "] }
        }, res3);
        const tags3 = res3.data?.data?.thread?.tags || [];
        logResult("H3 Pre-Hyphenated (Pass)", '["react-native", "  vue-js  "]',
            "Tags already containing hyphens are preserved intact.", '["react-native","vue-js"]',
            tags3, tags3.includes('react-native') && tags3.includes('vue-js'));

        // 1.4 Tags that are ONLY spaces should be filtered → empty → rejected (Fail)
        const res4 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Hyphen Only Spaces", content: "Body content here", subForumId: subForum._id, tags: ["   ", "  "] }
        }, res4);
        logResult("H4 Only Spaces (Fail)", '["   ", "  "]',
            "Tags composed entirely of spaces are filtered out, resulting in rejection.", "400",
            res4.error?.statusCode, res4.error?.statusCode === 400);


        // ══════════════════════════════════════════════════════════════
        // SECTION 2: TYPE COERCION (4 tests)
        // ══════════════════════════════════════════════════════════════
        console.log("\n--- SECTION 2: Type Coercion ---");

        // 2.1 Numeric tags are coerced to strings (Pass)
        const res5 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Type Number", content: "Body content here", subForumId: subForum._id, tags: [2024, 42] }
        }, res5);
        const tags5 = res5.data?.data?.thread?.tags || [];
        logResult("T1 Number Coercion (Pass)", "[2024, 42]",
            "Numeric values are safely cast to string tags.", '["2024","42"]',
            tags5, tags5.includes('2024') && tags5.includes('42'));

        // 2.2 Boolean tags are coerced to strings (Pass)
        const res6 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Type Boolean", content: "Body content here", subForumId: subForum._id, tags: [true, false] }
        }, res6);
        const tags6 = res6.data?.data?.thread?.tags || [];
        logResult("T2 Boolean Coercion (Pass)", "[true, false]",
            "Boolean values are safely cast to string tags.", '["true","false"]',
            tags6, tags6.includes('true') && tags6.includes('false'));

        // 2.3 Mixed types in one array (Pass)
        const res7 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Type Mixed", content: "Body content here", subForumId: subForum._id, tags: ["react", 2024, true] }
        }, res7);
        const tags7 = res7.data?.data?.thread?.tags || [];
        logResult("T3 Mixed Types (Pass)", '["react", 2024, true]',
            "Mixed string/number/boolean array is safely normalized.", '["react","2024","true"]',
            tags7, tags7.length === 3 && tags7.includes('react') && tags7.includes('2024'));

        // 2.4 Non-array input returns empty (Fail — rejected by controller)
        const res8 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Type String", content: "Body content here", subForumId: subForum._id, tags: "not-an-array" }
        }, res8);
        logResult("T4 Non-Array Input (Fail)", "'not-an-array'",
            "A raw string instead of an array is treated as empty and rejected.", "400",
            res8.error?.statusCode, res8.error?.statusCode === 400);


        // ══════════════════════════════════════════════════════════════
        // SECTION 3: NULL / UNDEFINED SAFETY (4 tests)
        // ══════════════════════════════════════════════════════════════
        console.log("\n--- SECTION 3: Null / Undefined Safety ---");

        // 3.1 Array of only nulls (Fail)
        const res9 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Null Only", content: "Body content here", subForumId: subForum._id, tags: [null, null] }
        }, res9);
        logResult("N1 All Null (Fail)", "[null, null]",
            "Array of only null values is filtered to empty and rejected.", "400",
            res9.error?.statusCode, res9.error?.statusCode === 400);

        // 3.2 Array of only undefined (Fail)
        const res10 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Undef Only", content: "Body content here", subForumId: subForum._id, tags: [undefined, undefined] }
        }, res10);
        logResult("N2 All Undefined (Fail)", "[undefined, undefined]",
            "Array of only undefined values is filtered to empty and rejected.", "400",
            res10.error?.statusCode, res10.error?.statusCode === 400);

        // 3.3 Mixed valid + null (Pass — valid tags survive)
        const res11 = mockRes();
        await run(createThread, {
            user,
            body: { title: "Null Mixed", content: "Body content here", subForumId: subForum._id, tags: ["react", null, "node", undefined] }
        }, res11);
        const tags11 = res11.data?.data?.thread?.tags || [];
        logResult("N3 Mixed Valid+Null (Pass)", '["react", null, "node", undefined]',
            "Null/undefined entries are silently filtered; valid tags are preserved.", '["react","node"]',
            tags11, tags11.length === 2 && tags11.includes('react') && tags11.includes('node'));

        // 3.4 Update existing thread with null-only tags (Fail)
        const validThread = await Thread.create({
            title: "Update Null Target", content: "Body content", author: user._id,
            subForum: subForum._id, forum: forum._id, tags: ["initial"]
        });
        const res12 = mockRes();
        await run(updateThread, {
            user: { _id: user._id, role: 'student' },
            params: { id: validThread._id },
            body: { tags: [null, undefined, ""] }
        }, res12);
        logResult("N4 Update Null Tags (Fail)", "[null, undefined, '']",
            "Updating tags to only null/undefined/empty values is rejected.", "400",
            res12.error?.statusCode, res12.error?.statusCode === 400);


        // ─────────────────────── REPORT ───────────────────────
        reportText += reportLog.join('\n');
        reportText += `\n\n### Summary\n- **Total:** ${passedCount + failedCount}\n- **Passed:** ${passedCount}\n- **Failed:** ${failedCount}`;

        fs.writeFileSync(path.join(__dirname, 'test_tags_advanced.md'), reportText);
        console.log(`\n🎉 Report generated successfully at thread_tests/unit/Tags/test_tags_advanced.md`);
        process.exit(0);

    } catch (error) {
        console.error("Test execution failed with exception:", error);
        process.exit(1);
    }
}

testTagsAdvanced();
