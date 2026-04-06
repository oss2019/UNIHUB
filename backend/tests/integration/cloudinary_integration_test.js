// ═══════════════════════════════════════════════════════════════════
// UNIHUB — Cloudinary End-to-End Integration Test
// Verifies: Real DB + Real Cloudinary uploads, cascade deletions,
//           and ghost URL sweep verification.
//
// ⚠️ LOCAL TESTING DEPENDENCY WARNING:
// This suite requires the `backend/Photos/` and `backend/Photos_links/` tracking
// folders which are intentionally `.gitignore`'d. 
// You must have at least 3 local images in `Photos/` and two `.txt` files explicitly 
// named `tiger.txt` and `boy.txt` in `Photos_links/` to pass.
// ═══════════════════════════════════════════════════════════════════

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env') });

import Thread from '../../models/threadModel.js';
import SubForum from '../../models/dummySubForumModel.js';
import User from '../../models/userModel.js';
import Forum from '../../models/dummyForumModel.js';
import {
    createThread, deleteThread, getThread
} from '../../controllers/threadController.js';

// ─────────────────────────────────────────────
//  PATHS
// ─────────────────────────────────────────────
const PHOTOS_DIR = path.join(__dirname, '../../Photos');
const LINKS_DIR  = path.join(__dirname, '../../Photos_links');
const REPORT_PATH = path.join(__dirname, 'cloudinary_integration_result.md');

// ─────────────────────────────────────────────
//  MIME HELPER
// ─────────────────────────────────────────────
const getMime = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.png')  return 'image/png';
    if (ext === '.avif') return 'image/avif';
    if (ext === '.jpeg') return 'image/jpeg';
    return 'image/jpeg';
};

// ─────────────────────────────────────────────
//  MOCK UTILITIES (same pattern as test_bulk_threads.js)
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
//  REPORT ENGINE
// ─────────────────────────────────────────────
let P = 0, F = 0;
let rows = [];

const log = (id, description, expected, actual, pass) => {
    if (pass) { P++; console.log(`✅ ${id}: ${description}`); }
    else      { F++; console.error(`❌ ${id}: ${description} | Expected: ${expected} | Got: ${actual}`); }
    rows.push(`| ${pass ? '✅' : '❌'} **${id}** | ${description} | ${expected} | ${actual} |`);
};

// ─────────────────────────────────────────────
//  IMAGE LOADERS
// ─────────────────────────────────────────────
const loadLocalBase64 = (filename) => {
    const buf = fs.readFileSync(path.join(PHOTOS_DIR, filename));
    const mime = getMime(filename);
    return `data:${mime};base64,${buf.toString('base64')}`;
};

const loadLinkFile = (filename) => {
    return fs.readFileSync(path.join(LINKS_DIR, filename), 'utf-8').trim();
};

// ═══════════════════════════════════════════════════════════════════
//  MAIN
// ═══════════════════════════════════════════════════════════════════
async function runIntegrationTests() {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("🚀 Connected to MongoDB. Wiping & Seeding...\n");

        // ── SETUP: Wipe and Seed ──
        await Thread.deleteMany({});
        await SubForum.deleteMany({});
        await Forum.deleteMany({});
        await User.deleteMany({});

        const admin = await User.create({ googleId: 'cld_admin', email: 'cldadmin@iitdh.ac.in', name: 'CLD Admin', role: 'admin' });
        const student = await User.create({ googleId: 'cld_stud', email: 'cldstud@iitdh.ac.in', name: 'CLD Student', role: 'student' });
        const forum = await Forum.create({ name: 'Cloudinary Test Forum', isApproved: true, isActive: true });
        const subForum = await SubForum.create({ name: 'Image Tests', tags: ['cloudinary', 'images'], forum: forum._id });

        // Load local files list
        const localFiles = fs.readdirSync(PHOTOS_DIR).filter(f =>
            ['.jpg', '.jpeg', '.png', '.avif'].includes(path.extname(f).toLowerCase())
        );

        // ═══════════════════════════════════════════════════
        // SECTION A: Create Thread with 2 Local Base64 Images
        // ═══════════════════════════════════════════════════
        console.log("--- SECTION A: Create Thread with Local Base64 Images ---");

        const localImg1 = loadLocalBase64(localFiles[0]);
        const localImg2 = loadLocalBase64(localFiles[1]);

        const resA = mockRes();
        await run(createThread, {
            user: student,
            body: {
                title: "Local Image Thread",
                content: "Thread with 2 local base64 images uploaded to Cloudinary",
                subForumId: subForum._id,
                tags: ['cloudinary'],
                attachments: [localImg1, localImg2]
            }
        }, resA);

        const threadA = resA.data?.data?.thread;
        const aOk = threadA && threadA.attachments && threadA.attachments.length === 2 &&
            threadA.attachments.every(u => u.startsWith('https://res.cloudinary.com'));
        log('A1', `Create thread with 2 local images (${localFiles[0]}, ${localFiles[1]})`, '2 Cloudinary URLs in DB', aOk ? `${threadA.attachments.length} Cloudinary URLs` : 'FAILED', aOk);

        // Verify in DB directly
        const dbThreadA = await Thread.findById(threadA?._id);
        const aDbOk = dbThreadA && dbThreadA.attachments.length === 2 && dbThreadA.attachments.every(u => u.startsWith('https://res.cloudinary.com'));
        log('A2', 'Verify DB record stores Cloudinary URLs (not raw Base64)', 'URLs in DB', aDbOk ? 'Confirmed' : 'FAILED', aDbOk);


        // ═══════════════════════════════════════════════════
        // SECTION B: Create Thread with Online URL (tiger.txt)
        // ═══════════════════════════════════════════════════
        console.log("\n--- SECTION B: Create Thread with Online URL (tiger.txt) ---");

        const tigerContent = loadLinkFile('tiger.txt');

        const resB = mockRes();
        await run(createThread, {
            user: student,
            body: {
                title: "Tiger External Link Thread",
                content: "Thread with the tiger external HTTP link captured to Cloudinary",
                subForumId: subForum._id,
                tags: ['images'],
                attachments: [tigerContent]
            }
        }, resB);

        const threadB = resB.data?.data?.thread;
        const bOk = threadB && threadB.attachments && threadB.attachments.length === 1 &&
            threadB.attachments[0].startsWith('https://res.cloudinary.com');
        log('B1', 'Create thread with tiger.txt external URL', 'Captured as Cloudinary URL', bOk ? 'Captured OK' : 'FAILED', bOk);

        // Verify it's NOT the original tiger URL (must be captured)
        const bNotPassthrough = bOk && threadB.attachments[0] !== tigerContent;
        log('B2', 'Verify tiger was CAPTURED (not passthrough)', 'Different from original URL', bNotPassthrough ? 'Confirmed' : 'Still original URL', bNotPassthrough);


        // ═══════════════════════════════════════════════════
        // SECTION C: Create Thread with Mixed Payload
        // ═══════════════════════════════════════════════════
        console.log("\n--- SECTION C: Create Thread with Mixed Payload ---");

        const localImg3 = loadLocalBase64(localFiles[2]);
        const boyContent = loadLinkFile('boy.txt');

        const resC = mockRes();
        await run(createThread, {
            user: admin,
            body: {
                title: "Mixed Payload Thread",
                content: "Thread with 1 local base64 and 1 online link both captured",
                subForumId: subForum._id,
                tags: ['cloudinary', 'images'],
                attachments: [localImg3, boyContent]
            }
        }, resC);

        const threadC = resC.data?.data?.thread;
        const cOk = threadC && threadC.attachments && threadC.attachments.length === 2 &&
            threadC.attachments.every(u => u.startsWith('https://res.cloudinary.com'));
        log('C1', 'Create thread with mixed payload (1 local + 1 online)', '2 Cloudinary URLs', cOk ? `${threadC.attachments.length} URLs` : 'FAILED', cOk);


        // ═══════════════════════════════════════════════════
        // SECTION D: Delete Thread & Verify Cascade
        // ═══════════════════════════════════════════════════
        console.log("\n--- SECTION D: Delete Thread & Verify Cloudinary Cascade ---");

        // Record the URLs from thread A before deleting
        const deletedUrls = [...(dbThreadA?.attachments || [])];
        console.log(`    [D] Recording ${deletedUrls.length} Cloudinary URLs before deletion...`);
        deletedUrls.forEach((u, i) => console.log(`      ${i + 1}. ${u}`));

        const resD = mockRes();
        await run(deleteThread, {
            user: student,
            params: { id: threadA._id }
        }, resD);

        const dDeleteOk = !resD.error;
        log('D1', 'Delete thread (controller call)', 'success', dDeleteOk ? 'Deleted' : `Error: ${resD.error?.message}`, dDeleteOk);

        // Verify thread is gone from MongoDB
        const dbCheckD = await Thread.findById(threadA._id);
        const dDbGone = dbCheckD === null;
        log('D2', 'Verify thread removed from MongoDB', 'null', dDbGone ? 'null (Gone)' : 'Still exists!', dDbGone);

        // Verify Cloudinary images are physically destroyed (HEAD request returns 404)
        for (let i = 0; i < deletedUrls.length; i++) {
            const url = deletedUrls[i];
            try {
                const headRes = await fetch(url, { method: 'HEAD' });
                const isGone = headRes.status === 404;
                log(`D3.${i + 1}`, `HEAD check on deleted Cloudinary asset #${i + 1}`, '404', headRes.status, isGone);
            } catch (err) {
                log(`D3.${i + 1}`, `HEAD check on deleted Cloudinary asset #${i + 1}`, '404', `Network Error: ${err.message}`, false);
            }
        }


        // ═══════════════════════════════════════════════════
        // SECTION E: Ghost URL DB Sweep
        // ═══════════════════════════════════════════════════
        console.log("\n--- SECTION E: Ghost URL DB Sweep ---");

        // Scan entire Thread collection for any traces of the deleted URLs
        const allThreads = await Thread.find({});
        let ghostFound = false;
        for (const thread of allThreads) {
            for (const delUrl of deletedUrls) {
                if (thread.attachments && thread.attachments.includes(delUrl)) {
                    ghostFound = true;
                    console.error(`  ⚠️ Ghost found in thread ${thread._id}: ${delUrl}`);
                }
            }
        }
        log('E1', 'Scan entire Thread collection for ghost URLs', '0 ghosts', ghostFound ? 'GHOST FOUND!' : '0 ghosts', !ghostFound);

        // Also verify the remaining threads (B and C) still have their attachments intact
        const dbThreadB = await Thread.findById(threadB?._id);
        const dbThreadC = await Thread.findById(threadC?._id);
        const eIntactB = dbThreadB && dbThreadB.attachments.length === 1;
        const eIntactC = dbThreadC && dbThreadC.attachments.length === 2;
        log('E2', 'Verify tiger thread (B) attachments still intact', '1 attachment', dbThreadB?.attachments?.length, eIntactB);
        log('E3', 'Verify mixed thread (C) attachments still intact', '2 attachments', dbThreadC?.attachments?.length, eIntactC);


        // ─────────────────────────── CLEANUP ───────────────────────────
        // Delete remaining threads to clean up Cloudinary storage
        console.log("\n--- CLEANUP: Deleting remaining test threads ---");
        if (dbThreadB) {
            const resClnB = mockRes();
            await run(deleteThread, { user: student, params: { id: dbThreadB._id } }, resClnB);
            console.log(`    Cleaned thread B: ${!resClnB.error ? 'OK' : 'Error'}`);
        }
        if (dbThreadC) {
            const resClnC = mockRes();
            await run(deleteThread, { user: admin, params: { id: dbThreadC._id } }, resClnC);
            console.log(`    Cleaned thread C: ${!resClnC.error ? 'OK' : 'Error'}`);
        }


        // ─────────────────────────── REPORT ───────────────────────────
        const report = `# Cloudinary Integration Test Report

## Environment
- **Local Images Used:** ${localFiles[0]}, ${localFiles[1]}, ${localFiles[2]}
- **Online Links Used:** tiger.txt, boy.txt
- **Total Tests Run:** ${P + F}
- **Passed ✅:** ${P}
- **Failed ❌:** ${F}

---

## Test Log

| Status | Test ID | Description | Expected | Actual |
| :--- | :--- | :--- | :--- | :--- |
${rows.join('\n')}

---

### Summary
- **Total:** ${P + F}
- **Passed:** ${P}
- **Failed:** ${F}
`;

        fs.writeFileSync(REPORT_PATH, report);
        console.log(`\n🎉 Integration test complete! Report: tests/integration/cloudinary_integration_result.md`);
        console.log(`\n📊 Score: ${P}/${P + F} passed`);
        process.exit(0);

    } catch (err) {
        console.error("💥 FATAL:", err);
        process.exit(1);
    }
}

runIntegrationTests();
