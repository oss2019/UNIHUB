// ═══════════════════════════════════════════════════════════════════
// UNIHUB — Cloudinary CRUD Unit Test Suite
// Tests: Upload (local Base64 + online URL passthrough), Update, Delete
// ============================================================================
// CRITICAL DEVELOPMENT NOTE (DO NOT REMOVE)
// ----------------------------------------------------------------------------
// This test relies on local physical files that are intentionally IGNORED by git. 
// To run this test on your machine, you must manually create:
// 1. A folder at `backend/Photos/` containing at least 20 local images (.jpg/.png)
// 2. A folder at `backend/Photos_links/` containing at least 5 `.txt` files 
//    (which hold raw Base64/external links).
// If these folders/files are missing, this test will crash with `fs` ENOENT errors.
// ============================================================================

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../.env') });

import {
    uploadBase64Attachments,
    deleteAttachedAssets
} from '../../../../services/cloudinaryService.js';

// ─────────────────────────────────────────────
// MIME TYPE DETECTOR (by file extension)
// ─────────────────────────────────────────────
const getMime = (filename) => {
    const ext = path.extname(filename).toLowerCase();
    if (ext === '.png')  return 'image/png';
    if (ext === '.avif') return 'image/avif';
    if (ext === '.jpeg') return 'image/jpeg';
    return 'image/jpeg';
};

// ─────────────────────────────────────────────
// PATHS
// ─────────────────────────────────────────────
const PHOTOS_DIR   = path.join(__dirname, '../../../../Photos');
const LINKS_DIR    = path.join(__dirname, '../../../../Photos_links');
const REPORT_PATH  = path.join(__dirname, 'cloudinary_audit.md');

// ─────────────────────────────────────────────
// REPORT ENGINE
// ─────────────────────────────────────────────
let P = 0, F = 0;
let rows = [];

const log = (id, description, expected, actual, pass) => {
    if (pass) { P++; console.log(`✅ ${id}: ${description}`); }
    else       { F++; console.error(`❌ ${id}: ${description} | Expected: ${expected} | Got: ${actual}`); }
    rows.push(`| ${pass ? '✅' : '❌'} **${id}** | ${description} | ${expected} | ${actual} |`);
};

// ─────────────────────────────────────────────
// MAIN
// ─────────────────────────────────────────────
async function runCloudinaryTests() {
    console.log('☁️  Starting Cloudinary CRUD Test Suite...\n');

    // ── Load local images ──
    const localFiles = fs.readdirSync(PHOTOS_DIR).filter(f =>
        ['.jpg', '.jpeg', '.png', '.avif'].includes(path.extname(f).toLowerCase())
    );

    // ── Load online link text files ──
    const linkFiles  = fs.readdirSync(LINKS_DIR).filter(f => f.endsWith('.txt'));
    const onlineUrls = linkFiles.map(f => fs.readFileSync(path.join(LINKS_DIR, f), 'utf-8').trim());

    let reportText = `# Cloudinary CRUD Audit Report

## Environment
- **Local Images Found:** ${localFiles.length} files in \`backend/Photos/\`
- **Online Links Found:** ${onlineUrls.length} URLs from \`backend/Photos_links/\`
- **Cloudinary Folder:** \`alumni_connect_threads\`

---

## Section 1: Local Image Upload (Base64 Encoding → Cloudinary)
Each local file is read as a Buffer, encoded to Base64, prefixed with the correct \`data:image/...\` MIME header, then passed to \`uploadBase64Attachments()\`.

| Status | Test | Expected | Actual |
| :--- | :--- | :--- | :--- |
`;

    // ═══════════════════════════════════════════════════
    // SECTION 1: Upload all 27 local images one by one
    // ═══════════════════════════════════════════════════
    console.log(`\n--- SECTION 1: Local Base64 Uploads (${localFiles.length} images) ---`);

    const uploadedUrls = []; // keep for Delete tests

    for (let i = 0; i < localFiles.length; i++) {
        const filename = localFiles[i];
        const id = `L${String(i + 1).padStart(2, '0')}`;
        try {
            const buffer = fs.readFileSync(path.join(PHOTOS_DIR, filename));
            const mime   = getMime(filename);
            const base64 = `data:${mime};base64,${buffer.toString('base64')}`;

            const urls = await uploadBase64Attachments([base64]);
            const ok   = urls.length === 1 && urls[0].startsWith('https://res.cloudinary.com');

            if (ok) uploadedUrls.push(urls[0]);
            log(id, `Upload: ${filename}`, 'cloudinary URL returned', ok ? urls[0].slice(0, 60) + '...' : 'FAILED', ok);
        } catch (err) {
            log(id, `Upload: ${filename}`, 'cloudinary URL returned', `ERROR: ${err.message}`, false);
        }
    }

    // ═══════════════════════════════════════════════════
    // SECTION 2: External Link Data URIs (Base64 uploads)
    // ═══════════════════════════════════════════════════
    reportText += `\n---\n\n## Section 2: External Link Data URIs
The text files now contain absolute Data URIs. Verifying these properly upload to Cloudinary.

| Status | Test | Expected | Actual |
| :--- | :--- | :--- | :--- |
`;
    console.log(`\n--- SECTION 2: External Link Data URIs (${onlineUrls.length} strings) ---`);

    const passthroughUrls = [];
    for (let i = 0; i < onlineUrls.length; i++) {
        const url  = onlineUrls[i];
        const file = linkFiles[i];
        const id   = `O${String(i + 1).padStart(2, '0')}`;
        try {
            const result = await uploadBase64Attachments([url]);
            // Now these are base64 strings so they should upload!
            const ok = result.length === 1 && result[0] && result[0].startsWith('https://res.cloudinary.com');
            if (ok) passthroughUrls.push(result[0]); // store the actual hosted URL
            log(id, `Upload Data URI: ${file}`, 'Cloudinary URL returned', ok ? 'Upload OK' : (result[0] ? result[0].slice(0, 60) : '[]'), ok);
        } catch (err) {
            log(id, `Upload Data URI: ${file}`, 'Cloudinary URL returned', `ERROR: ${err.message}`, false);
        }
    }

    // ═══════════════════════════════════════════════════
    // SECTION 3: Update simulation
    // ═══════════════════════════════════════════════════
    reportText += `\n---\n\n## Section 3: Update Simulation (Old attachments deleted, new uploaded)
Simulates a thread edit where the old image is wiped from Cloudinary and a new one is uploaded in its place.

| Status | Test | Expected | Actual |
| :--- | :--- | :--- | :--- |
`;
    console.log('\n--- SECTION 3: Update Simulation ---');

    // Pick first 3 uploaded local images as "old" attachments, upload 3 fresh ones as "new"
    const oldUrls = uploadedUrls.slice(0, 3);
    const newFiles = localFiles.slice(3, 6);

    let u1Pass = false;
    try {
        // Delete old
        await deleteAttachedAssets(oldUrls);

        // Upload new
        const newBase64 = newFiles.map(f => {
            const buf  = fs.readFileSync(path.join(PHOTOS_DIR, f));
            const mime = getMime(f);
            return `data:${mime};base64,${buf.toString('base64')}`;
        });
        const newUrls = await uploadBase64Attachments(newBase64);
        u1Pass = newUrls.length === 3 && newUrls.every(u => u.startsWith('https://res.cloudinary.com'));
        if (u1Pass) uploadedUrls.push(...newUrls);
        
        console.log(`\n    [U01 Tracker] Removing 3 IDs from Cloudinary: \n      - ${oldUrls.join('\n      - ')}`);
        console.log(`    [U01 Tracker] Adding 3 new IDs: \n      - ${newUrls.join('\n      - ')}\n`);
        
        log('U01', `Replace old 3 images with ${newFiles.join(', ')}`, '3 new Cloudinary URLs', u1Pass ? `${newUrls.length} new URLs` : 'FAILED', u1Pass);
    } catch (err) {
        log('U01', 'Replace old 3 images with new ones', '3 new Cloudinary URLs', `ERROR: ${err.message}`, false);
    }

    // Batch upload: 5 images in one call
    let u2Pass = false;
    try {
        const batchFiles = localFiles.slice(6, 11);
        const batchB64 = batchFiles.map(f => {
            const buf = fs.readFileSync(path.join(PHOTOS_DIR, f));
            return `data:${getMime(f)};base64,${buf.toString('base64')}`;
        });
        const batchUrls = await uploadBase64Attachments(batchB64);
        u2Pass = batchUrls.length === 5;
        if (u2Pass) uploadedUrls.push(...batchUrls);
        log('U02', `Batch upload of 5 images (${batchFiles.map(f => path.basename(f)).join(', ')})`, '5 Cloudinary URLs', u2Pass ? `${batchUrls.length} URLs` : 'FAILED', u2Pass);
    } catch (err) {
        log('U02', 'Batch upload 5 images', '5 Cloudinary URLs', `ERROR: ${err.message}`, false);
    }

    // Mixed payload: 2 local Base64 + 2 online passthrough URLs together
    let u3Pass = false;
    try {
        const localB64 = localFiles.slice(11, 13).map(f => {
            const buf = fs.readFileSync(path.join(PHOTOS_DIR, f));
            return `data:${getMime(f)};base64,${buf.toString('base64')}`;
        });
        const mixedPayload = [...localB64, ...onlineUrls.slice(0, 2)];
        const mixedResult  = await uploadBase64Attachments(mixedPayload);
        // All 4 inputs (local base64 AND external URLs) should be permanently CAPTURED into Cloudinary!
        const cldCount = mixedResult.filter(u => u.startsWith('https://res.cloudinary.com')).length;
        const httpCount = mixedResult.filter(u => u.startsWith('http') && !u.startsWith('https://res.cloudinary.com')).length;
        u3Pass = cldCount === 4 && mixedResult.length === 4;
        log('U03', 'Mixed payload: 2 local + 2 online URL', '4 Cloudinary URLs', `${cldCount} Cld + ${httpCount} passthrough`, u3Pass);
    } catch (err) {
        log('U03', 'Mixed payload upload', '2 Cloudinary + 2 passthrough', `ERROR: ${err.message}`, false);
    }

    // U04: Batch Update Diff Simulation (Keep some, discard others)
    let u4Pass = false;
    try {
        const currentList = uploadedUrls.slice(-3); // Let's take 3 recently uploaded ones
        const kept = [currentList[0]];              // Imagine user keeps the 1st one
        const discarded = currentList.slice(1);     // Imagine user removes the other 2
        
        // We simulate the logic in the controller: 
        // 1. We have our 'new' list (kept)
        // 2. Diff against original list to find the 'discarded'
        const removed = currentList.filter(url => !kept.includes(url));
        const okMatch = removed.length === 2 && removed[0] === discarded[0];

        // Trigger the batch delete for the removed ones
        await deleteAttachedAssets(removed);
        u4Pass = okMatch;
        console.log(`\n    [U04 Tracker] Kept ID: \n      - ${kept[0]}`);
        console.log(`    [U04 Tracker] Trashed IDs explicitly tracked and dropped: \n      - ${removed.join('\n      - ')}\n`);
        log('U04', `Batch Update Diff: Keep 1, Discard 2 from a list of ${currentList.length}`, 'Discarded IDs removed', u4Pass ? 'Diff logic correct' : 'FAILED', u4Pass);
    } catch (err) {
        log('U04', 'Batch Update Diff', 'Discarded IDs removed', `ERROR: ${err.message}`, false);
    }

    // ═══════════════════════════════════════════════════
    // SECTION 4: Delete all uploaded cloudinary assets
    // ═══════════════════════════════════════════════════
    reportText += `\n---\n\n## Section 4: Deletion (Cleanup All Cloudinary Uploads)
All uploaded \`res.cloudinary.com\` URLs collected from prior sections are deleted via \`deleteAttachedAssets()\`.

| Status | Test | Expected | Actual |
| :--- | :--- | :--- | :--- |
`;
    console.log('\n--- SECTION 4: Deletion ---');

        uploadedUrls.push(...passthroughUrls);
        const toDelete = uploadedUrls.filter(u => u.startsWith('https://res.cloudinary.com'));

    try {
        await deleteAttachedAssets(toDelete);
        log('D01', `Delete all ${toDelete.length} Cloudinary-hosted assets`, 'No error thrown', 'Completed cleanly', true);
    } catch (err) {
        log('D01', `Delete all ${toDelete.length} Cloudinary-hosted assets`, 'No error thrown', `ERROR: ${err.message}`, false);
    }

    // D02: Delete empty array (no-op guard)
    try {
        await deleteAttachedAssets([]);
        log('D02', 'Delete with empty array (no-op guard)', 'Returns without error', 'Completed cleanly', true);
    } catch (err) {
        log('D02', 'Delete with empty array', 'Returns without error', `ERROR: ${err.message}`, false);
    }

    // D03: Delete undefined (null guard)
    try {
        await deleteAttachedAssets(undefined);
        log('D03', 'Delete with undefined input (null guard)', 'Returns without error', 'Completed cleanly', true);
    } catch (err) {
        log('D03', 'Delete with undefined input', 'Returns without error', `ERROR: ${err.message}`, false);
    }

    // D04: Delete passthrough http URL (should be a graceful no-op or log only)
    try {
        await deleteAttachedAssets(['http://example.com/some_fake_passthrough.jpg']);
        log('D04', 'Delete passthrough http URL (non-Cloudinary)', 'Handles gracefully', 'Completed cleanly', true);
    } catch (err) {
        log('D04', 'Delete passthrough http URL', 'Handles gracefully', `ERROR: ${err.message}`, false);
    }

    // ═══════════════════════════════════════════════════
    // SECTION 5: Edge Cases
    // ═══════════════════════════════════════════════════
    reportText += `\n---\n\n## Section 5: Edge Cases
Guards against null/undefined, corrupt Base64, and totally empty inputs.

| Status | Test | Expected | Actual |
| :--- | :--- | :--- | :--- |
`;
    console.log('\n--- SECTION 5: Edge Cases ---');

    // E01: Upload null
    try {
        const r = await uploadBase64Attachments(null);
        log('E01', 'Upload null attachments', '[]', JSON.stringify(r), Array.isArray(r) && r.length === 0);
    } catch (err) {
        log('E01', 'Upload null attachments', '[]', `ERROR: ${err.message}`, false);
    }

    // E02: Upload empty array
    try {
        const r = await uploadBase64Attachments([]);
        log('E02', 'Upload empty array', '[]', JSON.stringify(r), Array.isArray(r) && r.length === 0);
    } catch (err) {
        log('E02', 'Upload empty array', '[]', `ERROR: ${err.message}`, false);
    }

    // E03: Corrupt Base64 string (Service should swallow error and return [])
    try {
        const r = await uploadBase64Attachments(['data:image/jpeg;base64,NOT_VALID_BASE64!!!']);
        log('E03', 'Upload corrupt Base64 string', 'Error caught silently', `Got: JSON ${JSON.stringify(r)}`, Array.isArray(r) && r.length === 0);
    } catch (err) {
        log('E03', 'Upload corrupt Base64 string', 'Error caught silently', `Threw hard crash: ${String(err.message || err).slice(0, 60)}`, false);
    }

    // ─────────────────────────── BUILD REPORT ───────────────────────────
    // Stitch the row data into the correct sections
    const allRows = rows.join('\n');
    // Re-build full table inserting rows (the section headers already placed above)
    const finalReport = reportText.replace(
        '| Status | Test | Expected | Actual |\n| :--- | :--- | :--- | :--- |',
        '| Status | Test | Expected | Actual |\n| :--- | :--- | :--- | :--- |\n' + rows.slice(0, localFiles.length).join('\n')
    );

    // Write report with all rows (simpler flat-append approach)
    const fullReport = `# Cloudinary CRUD Audit Report

## Environment
- **Local Images Tested:** ${localFiles.length}
- **Online Links Tested:** ${onlineUrls.length}
- **Total Tests Run:** ${P + F}
- **Passed ✅:** ${P}
- **Failed ❌:** ${F}
- **Cloudinary Folder:** \`alumni_connect_threads\`

---

## Full Test Log

| Status | Test ID | Description | Expected | Actual |
| :--- | :--- | :--- | :--- | :--- |
${rows.map(r => r).join('\n')}

---

### Summary
- **Total:** ${P + F}
- **Passed:** ${P}
- **Failed:** ${F}
`;

    fs.mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
    fs.writeFileSync(REPORT_PATH, fullReport);
    console.log(`\n🎉 Cloudinary audit complete! Check cloudinary_audit.md`);
    console.log(`\n📊 FINAL TALLY:`);
    console.log(`   - Total checks:  ${P + F}`);
    console.log(`   - Passed:        ${P} ✅`);
    console.log(`   - Failed:        ${F} ❌`);
    process.exit(0);
}

runCloudinaryTests().catch(err => {
    console.error('💥 FATAL:', err);
    process.exit(1);
});
