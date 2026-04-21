// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// UNIHUB â€” INTEGRATION TEST SUITE V3 (test_bulk_threads.js)
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../.env') });

import Thread from '../../../models/threadModel.js';
import SubForum from '../../../models/subforumModel.js';
import User from '../../../models/userModel.js';
import Forum from '../../../models/forumModel.js';
import {
    createThread, updateThread, deleteThread,
    getSubForumThreads, getForumThreads, getThread, searchThreads
} from '../../../controllers/threadController.js';
import { validateThreadParamId, validateThreadCreation } from '../../../validators/threadValidator.js';

// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
//  MOCK UTILITIES
// â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
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

const runParamValidation = async (req) => {
    let errCaught = null;
    const res = {};
    for (let mw of validateThreadParamId) {
        await new Promise((resolve) => {
            const next = (err) => { if (err) errCaught = err; resolve(); };
            mw(req, res, next);
        });
        if (errCaught) return errCaught;
    }
    return null;
};

const runCreationValidation = async (req) => {
    let errCaught = null;
    const res = {};
    for (let mw of validateThreadCreation) {
        await new Promise((resolve) => {
            const next = (err) => { if (err) errCaught = err; resolve(); };
            mw(req, res, next);
        });
        if (errCaught) return errCaught;
    }
    return null;
};

// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
//  TEST REPORT ENGINE
// ────────────────────────────────────────────────────────────────────────────────────────────────────────────────────────
let reportLog = [];
let passedCount = 0;
let failedCount = 0;

const logResult = (name, desc, expected, got, condition) => {
    if (condition) {
        passedCount++;
        console.log(`✅ ${name}: ${desc}`);
        reportLog.push(`| ✅ ${name} | ${desc} | ${expected} | ${got} |`);
    } else {
        failedCount++;
        console.error(`❌ ${name}: ${desc}\n   Expected: ${expected}\n   Got: ${got}`);
        reportLog.push(`| ❌ **FAILED: ${name}** | ${desc} | ${expected} | ${got} |`);
    }
};

// =====================================================================
//  MAIN
// =====================================================================
async function runBulkTests() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🚀 Wiping Database & Seeding Complex Env...");

        await Thread.deleteMany({});
        await SubForum.deleteMany({});
        await Forum.deleteMany({});
        await User.deleteMany({});

        // ── 1. USERS (1 Admin, 4 Alumni, 5 Students = 10 total) ──
        const admin = await User.create({ googleId: 'a1', email: 'admin@iitdh.ac.in', name: 'Admin One', role: 'admin' });

        const alumniList = [];
        for (let i = 1; i <= 4; i++) {
            alumniList.push(await User.create({ googleId: `al${i}`, email: `alumni${i}@iitdh.ac.in`, name: `Alum ${i}`, role: 'alumni' }));
        }

        const studentList = [];
        for (let i = 1; i <= 5; i++) {
            studentList.push(await User.create({ googleId: `st${i}`, email: `student${i}@iitdh.ac.in`, name: `Student ${i}`, role: 'student' }));
        }

        const alum1 = alumniList[0];
        const alum2 = alumniList[1];
        const alum3 = alumniList[2];
        const alum4 = alumniList[3];
        const stud1 = studentList[0];
        const stud2 = studentList[1];
        const stud3 = studentList[2];
        const stud4 = studentList[3];
        const stud5 = studentList[4];

        // ── 2. FORUMS (5 Total — covering all 4 modes + a second Live) ──
        const csForum = await Forum.create({ name: 'Computer Science', isApproved: true, isActive: true, type: 'collab' });
        const generalForum = await Forum.create({ name: 'General', isApproved: true, isActive: true, type: 'normal' });
        const eeForum = await Forum.create({ name: 'Electrical', isApproved: false, isActive: true, type: 'normal' });
        const meForum = await Forum.create({ name: 'Mechanical', isApproved: true, isActive: false, type: 'normal' });
        const mathForum = await Forum.create({ name: 'Mathematics', isApproved: false, isActive: false, type: 'normal' });

        // ── 3. SUBFORUMS (Tags designed with INTRA + INTER overlap) ──
        // CS Forum
        const webDevSF = await SubForum.create({ name: 'Web Dev', tags: ['react', 'node', 'python', 'nextjs'], forum: csForum._id });
        const aiSF = await SubForum.create({ name: 'AI & ML', tags: ['python', 'pytorch', 'data'], forum: csForum._id });
        const cyberSF = await SubForum.create({ name: 'Cyber Sec', tags: ['security', 'networking', 'linux'], forum: csForum._id });
        // ↑ 'python' overlaps INTRA (Web Dev ↔ AI)

        // General Forum
        const eventSF = await SubForum.create({ name: 'Events', tags: ['fest', 'hackathon', 'networking'], forum: generalForum._id });
        const careerSF = await SubForum.create({ name: 'Careers', tags: ['placement', 'resume', 'python'], forum: generalForum._id });
        const hobSF = await SubForum.create({ name: 'Hobbies', tags: ['gaming', 'music', 'photography'], forum: generalForum._id });
        // ↑ 'networking' overlaps INTER (CyberSec ↔ Events), 'python' overlaps INTER (CS ↔ Careers)

        // EE Forum (Pending)
        const vlsiSF = await SubForum.create({ name: 'VLSI', tags: ['vlsi', 'verilog', 'fpga'], forum: eeForum._id });
        const powerSF = await SubForum.create({ name: 'Power Sys', tags: ['power', 'grid', 'renewable'], forum: eeForum._id });

        // ME Forum (Archived)
        const autoSF = await SubForum.create({ name: 'Automobile', tags: ['ev', 'engines', 'design'], forum: meForum._id });
        const thermoSF = await SubForum.create({ name: 'Thermo', tags: ['heat', 'fluid', 'design'], forum: meForum._id });
        // â†‘ 'design' overlaps INTRA (Automobile â†” Thermo)

        // Math Forum (Dead)
        const calcSF = await SubForum.create({ name: 'Calculus', tags: ['calc', 'integration', 'data'], forum: mathForum._id });
        const algSF = await SubForum.create({ name: 'Algebra', tags: ['linear', 'matrices', 'data'], forum: mathForum._id });
        // â†‘ 'data' overlaps INTRA (Calc â†” Algebra) AND INTER (AI & ML)

        // Build Report Header
        let reportText = `# UNIHUB Integration Test Results (V3)

## 1. Environment State
### Users Inserted (10 Total)
- Admins: 1 (admin@iitdh.ac.in)
- Alumni: 4 (alumni1â€“4@iitdh.ac.in)
- Students: 5 (student1â€“5@iitdh.ac.in)

### Forums & Permissions Map
| Forum | isApproved | isActive | Mode | SubForums | Visibility (Non-Admin) | Post Access |
| :--- | :---: | :---: | :--- | :--- | :--- | :--- |
| **Computer Science** | ✅ | ✅ | Live | Web Dev, AI & ML, Cyber Sec | Visible (All Levels) | All Users |
| **General** | ✅ | ✅ | Live | Events, Careers, Hobbies | Visible (All Levels) | All Users |
| **Electrical** | ❌ | ✅ | Pending | VLSI, Power Sys | Hidden at List, Visible Individual | Admins Only |
| **Mechanical** | �        const resA1 = mockRes();
        await run(createThread, { user: stud1, body: { title: "Tag Check", content: "Body Content - Long Enough", subForumId: webDevSF._id, tags: [" React ", "react", "Node", ""] } }, resA1);
        const savedTags = resA1.data?.data?.thread?.tags || [];
        logResult("A1 Tag Normalize", "Validates lowercase, trim, dedup.", "['react', 'node']", `[${savedTags}]`, savedTags.length === 2 && savedTags.includes('react'));

        const resA2 = mockRes();
        await run(createThread, { user: stud1, body: { title: "Ghost", content: "Body Content - Long Enough", subForumId: webDevSF._id, tags: ["   ", ""] } }, resA2);
        logResult("A2 Ghost Block", "Blocks threads with only whitespace tags.", "400", resA2.error?.statusCode, resA2.error?.statusCode === 400);

        const resA3 = mockRes();
        await run(createThread, { user: stud2, body: { title: "Overlap", content: "Body Content - Long Enough", subForumId: aiSF._id, tags: ["Python", "PYTHON", "python"] } }, resA3);
        const a3Tags = resA3.data?.data?.thread?.tags || [];
        logResult("A3 Dedup Case", "Triples of same tag collapse to one.", "['python']", `[${a3Tags}]`, a3Tags.length === 1);

        const resA4 = mockRes();
        await run(createThread, { user: alum1, body: { title: "Mixed", content: "Body Content - Long Enough", subForumId: eventSF._id, tags: [" Fest", "hackathon ", " NETWORKING "] } }, resA4);
        const a4Tags = resA4.data?.data?.thread?.tags || [];
        logResult("A4 Trim+Lower", "Mixed spacing and casing normalized.", "['fest','hackathon','networking']", `[${a4Tags}]`, a4Tags.length === 3 && a4Tags.includes('networking'));

        const resA5 = mockRes();
        await run(createThread, { user: stud3, body: { title: "No Tags", content: "Body Content - Long Enough", subForumId: webDevSF._id } }, resA5);
        logResult("A5 Undefined Tags", "Undefined tags array rejected.", "400", resA5.error?.statusCode, resA5.error?.statusCode === 400);

        const resA6 = mockRes();
        await run(createThread, { user: stud4, body: { title: "Empty Arr", content: "Body Content - Long Enough", subForumId: webDevSF._id, tags: [] } }, resA6);
        logResult("A6 Empty Array", "Empty tags array rejected.", "400", resA6.error?.statusCode, resA6.error?.statusCode === 400);

        const resA7 = mockRes();
        await run(createThread, { user: stud1, body: { title: "Hyphen Check", content: "Body Content - Long Enough", subForumId: webDevSF._id, tags: ["Web Dev", "Artificial Intelligence"] } }, resA7);
        const a7Tags = resA7.data?.data?.thread?.tags || [];
        logResult("A7 Hyphenation (Pass)", "Spaces are safely converted to hyphens.", "['web-dev', 'artificial-intelligence']", `[${a7Tags}]`, a7Tags.includes('web-dev') && a7Tags.includes('artificial-intelligence'));

        const resA10 = mockRes();
        await run(createThread, { user: stud1, body: { title: "Hyphen Multiple Spaces", content: "Body Content - Long Enough", subForumId: webDevSF._id, tags: ["Machine     Learning", " deep  learning "] } }, resA10);
        const a10Tags = resA10.data?.data?.thread?.tags || [];
        logResult("A10 Hyphen Collapse (Edge)", "Multiple consecutive spaces collapse into a single hyphen without duplication.", "['machine-learning', 'deep-learning']", `[${a10Tags}]`, a10Tags.includes('machine-learning') && a10Tags.length === 2);

        const resA11 = mockRes();
        await run(createThread, { user: stud1, body: { title: "Already Hyphenated", content: "Body Content - Long Enough", subForumId: webDevSF._id, tags: ["react-native", "  vue-js  "] } }, resA11);
        const a11Tags = resA11.data?.data?.thread?.tags || [];
        logResult("A11 Pre-Hyphenated (Pass)", "Tags that already contain hyphens are kept intact without adding extra formatting.", "['react-native', 'vue-js']", `[${a11Tags}]`, a11Tags.includes('react-native'));

        const resA8 = mockRes();
        await run(createThread, { user: stud1, body: { title: "Type Coercion", content: "Body Content - Long Enough", subForumId: webDevSF._id, tags: [2024, true] } }, resA8);
        const a8Tags = resA8.data?.data?.thread?.tags || [];
        logResult("A8 Type Safety (Pass)", "Non-string primitive tags are safely converted to strings.", "['2024', 'true']", `[${a8Tags}]`, a8Tags.includes('2024') && a8Tags.includes('true'));

        const resA9 = mockRes();
        await run(createThread, { user: stud4, body: { title: "Null Filtering", content: "Body Content - Long Enough", subForumId: webDevSF._id, tags: [null, undefined] } }, resA9);
        logResult("A9 Null Safety (Fail)", "Threads with only null/undefined tags are filtered out and rejected.", "400", resA9.error?.statusCode, resA9.error?.statusCode === 400);

        // =====================================================================
        // SECTION B: Forum Gates — Creation (10 tests)
        // =====================================================================
        console.log("\n--- SECTION B: Forum Gates ---");

        // Live: CS
        const resB1 = mockRes();
        await run(createThread, { user: stud1, body: { title: "CS Post", content: "Valid Content Over 10 Chars", subForumId: webDevSF._id, tags: ['react'] } }, resB1);
        logResult("B1 Live Student", "Student posts in Live CS forum.", "201", resB1.data?.statusCode || "201", !resB1.error);

        const resB2 = mockRes();
        await run(createThread, { user: alum1, body: { title: "CS Alum", content: "Valid Content Over 10 Chars", subForumId: aiSF._id, tags: ['pytorch'] } }, resB2);
        logResult("B2 Live Alumni", "Alumni posts in Live CS forum.", "201", resB2.data?.statusCode || "201", !resB2.error);

        // Live: General
        const resB3 = mockRes();
        await run(createThread, { user: stud5, body: { title: "Gen Post", content: "Valid Content Over 10 Chars", subForumId: hobSF._id, tags: ['gaming'] } }, resB3);
        logResult("B3 General Student", "Student posts in Live General forum.", "201", resB3.data?.statusCode || "201", !resB3.error);

        const resB4 = mockRes();
        await run(createThread, { user: alum3, body: { title: "Career Post", content: "Valid Content Over 10 Chars", subForumId: careerSF._id, tags: ['placement'] } }, resB4);
        logResult("B4 General Alumni", "Alumni posts in Live General forum.", "201", resB4.data?.statusCode || "201", !resB4.error);

        // Pending: EE
        const resB5 = mockRes();
        await run(createThread, { user: stud1, body: { title: "EE Post", content: "Valid Content Over 10 Chars", subForumId: vlsiSF._id, tags: ['vlsi'] } }, resB5);
        logResult("B5 Pending Student", "Student blocked from Pending EE forum.", "403", resB5.error?.statusCode, resB5.error?.statusCode === 403);

        const resB6 = mockRes();
        await run(createThread, { user: alum2, body: { title: "EE Alum", content: "Valid Content Over 10 Chars", subForumId: powerSF._id, tags: ['power'] } }, resB6);
        logResult("B6 Pending Alumni", "Alumni blocked from Pending EE forum.", "403", resB6.error?.statusCode, resB6.error?.statusCode === 403);

        const resB7 = mockRes();
        await run(createThread, { user: admin, body: { title: "Admin EE", content: "Valid Content Over 10 Chars", subForumId: vlsiSF._id, tags: ['fpga'] } }, resB7);
        logResult("B7 Pending Admin", "Admin overrides Pending gate.", "201", resB7.data?.statusCode || "201", !resB7.error);

        // Archived: ME
        const resB8 = mockRes();
        await run(createThread, { user: admin, body: { title: "ME Post", content: "Valid Content Over 10 Chars", subForumId: autoSF._id, tags: ['ev'] } }, resB8);
        logResult("B8 Archived Admin", "Admin blocked from posting in Archived ME forum.", "403", resB8.error?.statusCode, resB8.error?.statusCode === 403);

        const resB9 = mockRes();
        await run(createThread, { user: stud3, body: { title: "ME Stud", content: "Valid Content Over 10 Chars", subForumId: thermoSF._id, tags: ['heat'] } }, resB9);
        logResult("B9 Archived Student", "Student blocked from posting in Archived ME forum.", "403", resB9.error?.statusCode, resB9.error?.statusCode === 403);

        // Dead: Math
        const resB10 = mockRes();
        await run(createThread, { user: admin, body: { title: "Math Post", content: "Valid Content Over 10 Chars", subForumId: calcSF._id, tags: ['calc'] } }, resB10);
        logResult("B10 Dead Admin", "Admin blocked from posting in Dead Math forum.", "403", resB10.error?.statusCode, resB10.error?.statusCode === 403);usCode === 403);

        const resB6 = mockRes();
        await run(createThread, { user: alum2, body: { title: "EE Alum", content: "Body", subForumId: powerSF._id, tags: ['power'] } }, resB6);
        logResult("B6 Pending Alumni", "Alumni blocked from Pending EE forum.", "403", resB6.error?.statusCode, resB6.error?.statusCode === 403);

        const resB7 = mockRes();
        await run(createThread, { user: admin, body: { title: "Admin EE", content: "Body", subForumId: vlsiSF._id, tags: ['fpga'] } }, resB7);
        logResult("B7 Pending Admin", "Admin overrides Pending gate.", "201", resB7.data?.statusCode || "201", !resB7.error);

        // Archived: ME
        const resB8 = mockRes();
        await run(createThread, { user: admin, body: { title: "ME Post", content: "Body", subForumId: autoSF._id, tags: ['ev'] } }, resB8);
        logResult("B8 Archived Admin", "Admin blocked from posting in Archived ME forum.", "403", resB8.error?.statusCode, resB8.error?.statusCode === 403);

        const resB9 = mockRes();
        await run(createThread, { user: stud3, body: { title: "ME Stud", content: "Body", subForumId: thermoSF._id, tags: ['heat'] } }, resB9);
        logResult("B9 Archived Student", "Student blocked from posting in Archived ME forum.", "403", resB9.error?.statusCode, resB9.error?.statusCode === 403);

        // Dead: Math
        const resB10 = mockRes();
        await run(createThread, { user: admin, body: { title: "Math Post", content: "Body", subForumId: calcSF._id, tags: ['calc'] } }, resB10);
        logResult("B10 Dead Admin", "Admin blocked from posting in Dead Math forum.", "403", resB10.error?.statusCode, resB10.error?.statusCode === 403);


        // =====================================================================
        // SECTION C: Visibility & Audit Mode â€” 3-Level GET (14 tests)
        // =====================================================================
        console.log("\n--- SECTION C: Visibility Gates (3-Level) ---");

        // â”€â”€ C: PENDING (Electrical) â”€â”€
        const auditThread = await Thread.create({ title: "Audit Target", content: "Hidden", author: admin._id, subForum: vlsiSF._id, forum: eeForum._id, tags: ['vlsi'] });

        const resC1 = mockRes();
        await run(getForumThreads, { user: admin, params: { id: eeForum._id }, query: {} }, resC1);
        logResult("C1 Pending Forum Admin", "Admin sees pending forum feed.", "> 0", resC1.data?.results, resC1.data?.results > 0);

        const resC2 = mockRes();
        await run(getForumThreads, { user: stud1, params: { id: eeForum._id }, query: {} }, resC2);
        logResult("C2 Pending Forum Student", "Student gets 0 in pending forum feed.", "0", resC2.data?.results, resC2.data?.results === 0);

        const resC3 = mockRes();
        await run(getForumThreads, { user: alum1, params: { id: eeForum._id }, query: {} }, resC3);
        logResult("C3 Pending Forum Alumni", "Alumni gets 0 in pending forum feed.", "0", resC3.data?.results, resC3.data?.results === 0);

        const resC4 = mockRes();
        await run(getThread, { user: stud2, params: { id: auditThread._id } }, resC4);
        logResult("C4 Pending Individual Student", "Student views pending thread via direct ID.", "success", resC4.data?.status, resC4.data?.status === 'success');

        const resC5 = mockRes();
        await run(getThread, { user: alum4, params: { id: auditThread._id } }, resC5);
        logResult("C5 Pending Individual Alumni", "Alumni views pending thread via direct ID.", "success", resC5.data?.status, resC5.data?.status === 'success');

        // â”€â”€ C: ARCHIVED (Mechanical) â”€â”€
        const archThread = await Thread.create({ title: "Archived Content", content: "Old", author: alum1._id, subForum: autoSF._id, forum: meForum._id, tags: ['ev'] });

        const resC6 = mockRes();
        await run(getForumThreads, { user: stud1, params: { id: meForum._id }, query: {} }, resC6);
        logResult("C6 Archived Forum Student", "Student browses archived forum list.", "> 0", resC6.data?.results, resC6.data?.results > 0);

        const resC7 = mockRes();
        await run(getForumThreads, { user: alum2, params: { id: meForum._id }, query: {} }, resC7);
        logResult("C7 Archived Forum Alumni", "Alumni browses archived forum list.", "> 0", resC7.data?.results, resC7.data?.results > 0);

        const resC8 = mockRes();
        await run(getThread, { user: stud3, params: { id: archThread._id } }, resC8);
        logResult("C8 Archived Individual Student", "Student views archived thread.", "success", resC8.data?.status, resC8.data?.status === 'success');

        // â”€â”€ C: DEAD (Mathematics) â”€â”€
        const deadThread = await Thread.create({ title: "Dead Content", content: "Gone", author: admin._id, subForum: calcSF._id, forum: mathForum._id, tags: ['calc'] });

        const resC9 = mockRes();
        await run(getForumThreads, { user: admin, params: { id: mathForum._id }, query: {} }, resC9);
        logResult("C9 Dead Forum Admin", "Admin audit-views dead forum.", "> 0", resC9.data?.results, resC9.data?.results > 0);

        const resC10 = mockRes();
        await run(getForumThreads, { user: stud1, params: { id: mathForum._id }, query: {} }, resC10);
        logResult("C10 Dead Forum Student", "Student gets 0 in dead forum.", "0", resC10.data?.results, resC10.data?.results === 0);

        const resC11 = mockRes();
        await run(getThread, { user: admin, params: { id: deadThread._id } }, resC11);
        logResult("C11 Dead Individual Admin", "Admin views dead thread.", "success", resC11.data?.status, resC11.data?.status === 'success');

        const resC12 = mockRes();
        await run(getThread, { user: stud1, params: { id: deadThread._id } }, resC12);
        logResult("C12 Dead Individual Student", "Student blocked from dead thread.", "403", resC12.error?.statusCode, resC12.error?.statusCode === 403);

        const resC13 = mockRes();
        await run(getThread, { user: alum3, params: { id: deadThread._id } }, resC13);
        logResult("C13 Dead Individual Alumni", "Alumni blocked from dead thread.", "403", resC13.error?.statusCode, resC13.error?.statusCode === 403);

        // â”€â”€ C: LIVE cross-check (General) â”€â”€
        const resC14 = mockRes();
        await run(getForumThreads, { user: stud5, params: { id: generalForum._id }, query: {} }, resC14);
        logResult("C14 Live General Student", "Student sees General forum feed.", "> 0", resC14.data?.results, resC14.data?.results > 0);


        // =====================================================================
        // SECTION D: Permission Edit/Delete/Pin (12 tests)
        // =====================================================================
        console.log("\n--- SECTION D: Edit/Delete/Pin ---");

        const studThread = await Thread.create({ title: "Stud T", content: "Msg", author: stud1._id, subForum: webDevSF._id, forum: csForum._id, tags: ['react'] });
        const alumThread = await Thread.create({ title: "Alum T", content: "Msg", author: alum1._id, subForum: aiSF._id, forum: csForum._id, tags: ['python'] });
        const stud3Thread = await Thread.create({ title: "Stud3 T", content: "Msg", author: stud3._id, subForum: eventSF._id, forum: generalForum._id, tags: ['fest'] });
        const alum4Thread = await Thread.create({ title: "Alum4 T", content: "Msg", author: alum4._id, subForum: careerSF._id, forum: generalForum._id, tags: ['resume'] });

        // Edit
        const resD1 = mockRes();
        await run(updateThread, { user: stud1, params: { id: studThread._id }, body: { title: "Edit" } }, resD1);
        logResult("D1 Edit Author", "Student edits own thread.", "success", resD1.data?.status || "err", !resD1.error);

        const resD2 = mockRes();
        await run(updateThread, { user: alum2, params: { id: studThread._id }, body: { title: "Hack" } }, resD2);
        logResult("D2 Edit Foreign Alumni", "Alumni blocked from editing student's thread.", "403", resD2.error?.statusCode, resD2.error?.statusCode === 403);

        const resD3 = mockRes();
        await run(updateThread, { user: admin, params: { id: studThread._id }, body: { content: "Admin Edit" } }, resD3);
        logResult("D3 Edit Admin Foreign", "Admin blocked from editing student's text.", "403", resD3.error?.statusCode, resD3.error?.statusCode === 403);

        const resD4 = mockRes();
        await run(updateThread, { user: stud4, params: { id: stud3Thread._id }, body: { title: "Peer Hack" } }, resD4);
        logResult("D4 Edit Foreign Student", "Student blocked from editing peer's thread.", "403", resD4.error?.statusCode, resD4.error?.statusCode === 403);

        // Pin
        const resD5 = mockRes();
        await run(updateThread, { user: admin, params: { id: alumThread._id }, body: { isPinned: true } }, resD5);
        const alumCheck1 = await Thread.findById(alumThread._id);
        logResult("D5 Pin Admin", "Admin pins alumni's thread.", "true", alumCheck1.isPinned, alumCheck1.isPinned === true);

        const resD6 = mockRes();
        await run(updateThread, { user: stud1, params: { id: studThread._id }, body: { isPinned: true } }, resD6);
        logResult("D6 Pin Author Student", "Student pin on own thread rejected.", "403", resD6.error?.statusCode, resD6.error?.statusCode === 403);

        const resD7 = mockRes();
        await run(updateThread, { user: alum1, params: { id: alumThread._id }, body: { isPinned: false } }, resD7);
        logResult("D7 Pin Author Alumni", "Alumni unpin on own thread rejected.", "403", resD7.error?.statusCode, resD7.error?.statusCode === 403);

        const resD8 = mockRes();
        await run(updateThread, { user: stud2, params: { id: alum4Thread._id }, body: { isPinned: true } }, resD8);
        logResult("D8 Pin Foreign Student", "Foreign student pin attempt rejected.", "403", resD8.error?.statusCode, resD8.error?.statusCode === 403);

        // Delete
        const delThread1 = await Thread.create({ title: "Del1", content: "M", author: stud2._id, subForum: cyberSF._id, forum: csForum._id, tags: ['security'] });
        const delThread2 = await Thread.create({ title: "Del2", content: "M", author: alum3._id, subForum: hobSF._id, forum: generalForum._id, tags: ['music'] });

        const resD9 = mockRes();
        await run(deleteThread, { user: admin, params: { id: delThread1._id } }, resD9);
        logResult("D9 Delete Admin Override", "Admin deletes student's thread.", "success", resD9.data?.status || "Err", !resD9.error);

        const resD10 = mockRes();
        await run(deleteThread, { user: alum2, params: { id: delThread2._id } }, resD10);
        logResult("D10 Delete Foreign Alumni", "Alumni blocked from deleting peer's thread.", "403", resD10.error?.statusCode, resD10.error?.statusCode === 403);

        const resD11 = mockRes();
        await run(deleteThread, { user: alum3, params: { id: delThread2._id } }, resD11);
        logResult("D11 Delete Author Alumni", "Alumni deletes own thread.", "success", resD11.data?.status || "Err", !resD11.error);

        const delThread3 = await Thread.create({ title: "Del3", content: "M", author: stud5._id, subForum: eventSF._id, forum: generalForum._id, tags: ['hackathon'] });
        const resD12 = mockRes();
        await run(deleteThread, { user: stud4, params: { id: delThread3._id } }, resD12);
        logResult("D12 Delete Foreign Student", "Student blocked from deleting peer's thread.", "403", resD12.error?.statusCode, resD12.error?.statusCode === 403);


        // =====================================================================
        // SECTION E: Pagination (4 tests)
        // =====================================================================
        console.log("\n--- SECTION E: Pagination ---");

        for (let i = 0; i < 22; i++) {
            await Thread.create({ title: `P${i}`, content: "Valid Pagination Content Over 10 Chars", author: stud1._id, subForum: cyberSF._id, forum: csForum._id, tags: ['security'] });
        }

        const resE1 = mockRes();
        await run(getForumThreads, { user: stud1, params: { id: csForum._id }, query: {} }, resE1);
        const ctE1 = resE1.data?.data?.pagination?.threads?.length;
        logResult("E1 Page 1 Default", "Default fetch limits to max 20 threads.", "20", ctE1, ctE1 === 20);

        const resE2 = mockRes();
        await run(getForumThreads, { user: stud1, params: { id: csForum._id }, query: { page: '2' } }, resE2);
        const ctE2 = resE2.data?.data?.pagination?.threads?.length;
        logResult("E2 Page 2", "Second page returns remaining items.", "> 0", ctE2, ctE2 > 0);

        const resE3 = mockRes();
        await run(getForumThreads, { user: stud1, params: { id: csForum._id }, query: { page: '999' } }, resE3);
        const ctE3 = resE3.data?.data?.pagination?.threads?.length;
        logResult("E3 Page OOB", "Out of bounds page returns empty list.", "0", ctE3, ctE3 === 0);

        const resE4 = mockRes();
        await run(getForumThreads, { user: stud1, params: { id: csForum._id }, query: { limit: '5' } }, resE4);
        const ctE4 = resE4.data?.data?.pagination?.threads?.length;
        logResult("E4 Custom Limit", "Custom limit=5 returns exactly 5.", "5", ctE4, ctE4 === 5);


        // =====================================================================
        // SECTION F: Field Validations (4 tests)
        // =====================================================================
        console.log("\n--- SECTION F: Missing Fields ---");

        const resF1 = mockRes();
        await run(createThread, { user: stud1, body: { title: "Valid", subForumId: webDevSF._id, tags: ['react'] } }, resF1);
        logResult("F1 Missing Content", "Blocks thread creation without content.", "400", resF1.error?.statusCode, resF1.error?.statusCode === 400);

        const resF2 = mockRes();
        await run(createThread, { user: stud1, body: { content: "Valid", subForumId: webDevSF._id, tags: ['react'] } }, resF2);
        logResult("F2 Missing Title", "Blocks thread creation without title.", "400", resF2.error?.statusCode, resF2.error?.statusCode === 400);

        const resF3 = mockRes();
        await run(createThread, { user: stud1, body: { title: "T", content: "C", tags: ['react'] } }, resF3);
        logResult("F3 Missing SubForumId", "Blocks thread creation without subForumId.", "400", resF3.error?.statusCode, resF3.error?.statusCode === 400);

        const resF4 = mockRes();
        await run(getThread, { user: stud1, params: { id: new mongoose.Types.ObjectId() } }, resF4);
        logResult("F4 Fake Resource ID", "Returns 404 for valid but non-real DB ID.", "404", resF4.error?.statusCode, resF4.error?.statusCode === 404);


        // =====================================================================
        // SECTION G: Native Ghost ID Middlewares (6 tests mapped)
        // =====================================================================
        console.log("\n--- SECTION G: Native Ghost Identifiers ---");

        let errG1 = await runParamValidation({ params: { id: "123" } });
        logResult("G1 URL Short Form", "Blocks 3 char short malformed ObjectIDs.", "404", errG1?.statusCode, errG1?.statusCode === 404);

        let errG2 = await runParamValidation({ params: { id: "undefined" } });
        logResult("G2 URL Literal Undefined", "Blocks literal 'undefined' string injection.", "404", errG2?.statusCode, errG2?.statusCode === 404);

        let errG3 = await runCreationValidation({ body: { title: "Valid Title Here 123", content: "Valid Content Here 123", subForumId: "" } });
        logResult("G3 Body SubForum Empty", "Blocks completely empty formatted subForum target.", "400", errG3?.statusCode, errG3?.statusCode === 400);

        let errG4 = await runCreationValidation({ body: { title: "Valid Title Here 123", content: "Valid Content Here 123" } });
        logResult("G4 Body SubForum Missing", "Blocks natively omitted subForum parameter.", "400", errG4?.statusCode, errG4?.statusCode === 400);

        let errG5 = await runCreationValidation({ body: { title: "Valid Title Here 123", content: "Valid Content Here 123", subForumId: "bad_format" } });
        logResult("G5 Body SubForum Malformed", "Blocks structurally malformed subForum format string.", "400", errG5?.statusCode, errG5?.statusCode === 400);

        const gId = new mongoose.Types.ObjectId().toString();
        let errG6 = await runCreationValidation({ body: { title: "Valid Title Here 123", content: "Valid Content Here 123", subForumId: gId } });
        logResult("G6 Perfect Formation Base", "Approves perfect 24-hex formatted dummy.", "null", String(errG6), errG6 === null);

        let resG7 = mockRes();
        await run(createThread, { user: stud1, body: { title: "Valid Title", content: "Valid Content String", subForumId: gId, tags: ['test'] } }, resG7);
        logResult("G7 Live Ghost Create Sweep", "Controller correctly maps perfectly formatted ghost creation to 404.", "404", resG7.error?.statusCode, resG7.error?.statusCode === 404);


        // =====================================================================
        // SECTION H: Core Schema Enforcement (8 Tests)
        // =====================================================================
        console.log("\n--- SECTION H: Core Schema Enforcement Limit Bounds ---");

        // Title Checks
        let errH1 = await runCreationValidation({ body: { title: "Valid Title", content: "Valid Content String", subForumId: webDevSF._id } });
        logResult("H1 Title Pass Mid Size", "Valid mathematically perfectly bound title passes.", "null", String(errH1), errH1 === null);

        let errH2 = await runCreationValidation({ body: { title: "", content: "Valid Content String", subForumId: webDevSF._id } });
        logResult("H2 Title Fail Empty", "Perfectly empty string blocks correctly.", "400", errH2?.statusCode, errH2?.statusCode === 400);

        let errH3 = await runCreationValidation({ body: { title: "abcd", content: "Valid Content String", subForumId: webDevSF._id } });
        logResult("H3 Title Fail Under Limits", "Limits string natively bound tightly to less than 5 check.", "400", errH3?.statusCode, errH3?.statusCode === 400);

        const title101 = "A".repeat(101);
        let errH4 = await runCreationValidation({ body: { title: title101, content: "Valid Content String", subForumId: webDevSF._id } });
        logResult("H4 Title Fail Over Limits", "Blocks inherently completely blown 101 character sizes.", "400", errH4?.statusCode, errH4?.statusCode === 400);

        // Content Checks
        let errH5 = await runCreationValidation({ body: { title: "Valid Title", content: "Valid Content String", subForumId: webDevSF._id } });
        logResult("H5 Content Pass Mid Size", "Passes perfectly mathematically 20 sized string check natively.", "null", String(errH5), errH5 === null);

        let errH6 = await runCreationValidation({ body: { title: "Valid Title", content: "", subForumId: webDevSF._id } });
        logResult("H6 Content Fail Empty", "Perfectly empty generic block falls short intrinsically.", "400", errH6?.statusCode, errH6?.statusCode === 400);

        let errH7 = await runCreationValidation({ body: { title: "Valid Title", content: "short123", subForumId: webDevSF._id } });
        logResult("H7 Content Fail Under Limits", "Limits natively under 10 boundary.", "400", errH7?.statusCode, errH7?.statusCode === 400);

        const content5001 = "B".repeat(5001);
        let errH8 = await runCreationValidation({ body: { title: "Valid Title", content: content5001, subForumId: webDevSF._id } });
        logResult("H8 Content Fail Over Limits", "Blocks strictly exceeding limits natively.", "400", errH8?.statusCode, errH8?.statusCode === 400);


        // =====================================================================
        // SECTION I: Mute Logic (2 tests)
        // =====================================================================
        console.log("\n--- SECTION I: Mute Logic ---");

        // Manually trigger notification logic within integration suite context
        // S2 mutes WebDevSF
        await User.findByIdAndUpdate(stud2._id, { $addToSet: { mutedSubForums: webDevSF._id } });
        
        const muteCollabThread = await Thread.create({ 
            title: "Mute Logic Verification", 
            content: "Hidden from muted users", 
            author: stud1._id, 
            subForum: webDevSF._id, 
            forum: csForum._id, 
            tags: ['react'] 
        });

        const resI1 = mockRes();
        // Since we are running the controller, it will trigger notificationService internally
        await run(createThread, { 
            user: stud1, 
            body: { 
                title: "Live Mute Trigger", 
                content: "Is S2 shielded from this?", 
                subForumId: webDevSF._id, 
                tags: ['react'] 
            } 
        }, resI1);

        const Notification = mongoose.model('Notification');
        const s2Notify = await Notification.findOne({ recipient: stud2._id, entityId: resI1.data?.data?.thread?._id });
        logResult("I1 Mute Isolation", "Muted user correctly skipped during instant collab notification.", "null", s2Notify, s2Notify === null);

        // =====================================================================
        // SECTION J: User Threads API (2 tests)
        // =====================================================================
        console.log("\n--- SECTION J: User Threads API ---");
        const { getUserThreads } = await import('../../../controllers/threadController.js');

        const resJ1 = mockRes();
        await run(getUserThreads, { params: { id: stud1._id }, query: { limit: 5 } }, resJ1);
        const j1Count = resJ1.data?.data?.pagination?.threads?.length;
        logResult("J1 User Threads Feed", "Fetches threads authored by specific student.", "5", j1Count, j1Count === 5);

        const resJ2 = mockRes();
        await run(getUserThreads, { params: { id: stud1._id }, query: { limit: 2, page: 1 } }, resJ2);
        logResult("J2 User Threads Pagination", "Handles pagination params correctly.", "true", resJ2.data?.data?.pagination?.hasMore, resJ2.data?.data?.pagination?.hasMore === true);


        // Write Final Report
        reportText += reportLog.join('\n');
        reportText += `\n\n### Summary\n- **Total:** ${passedCount + failedCount}\n- **Passed:** ${passedCount}\n- **Failed:** ${failedCount}`;

        fs.writeFileSync(path.join(__dirname, 'result.md'), reportText);
        console.log(`\n🎉 Report generated successfully at thread_tests/integration/result.md`);
        console.log(`\n📊 FINAL TALLY:`);
        console.log(`   - Total:  ${passedCount + failedCount}`);
        console.log(`   - Passed: ${passedCount} ✅`);
        console.log(`   - Failed: ${failedCount} ❌`);
        process.exit(0);

    } catch (err) {
        console.error("💥 SYSTEM ERROR:", err);
        process.exit(1);
    }
}

runBulkTests();
