import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

import { validateThreadParamId, validateThreadCreation } from '../../../../validators/threadValidator.js';
import { createThread, getThread, updateThread, deleteThread } from '../../../../controllers/threadController.js';
import User from '../../../../models/userModel.js';

// ────────── MOCK UTILITIES ──────────
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
            const next = (err) => { if(err) errCaught = err; resolve(); };
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
            const next = (err) => { if(err) errCaught = err; resolve(); };
            mw(req, res, next);
        });
        if (errCaught) return errCaught;
    }
    return null;
};

async function runGhostIdTests() {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB -> Ghost Attacks\n");
    
    let P=0, F=0;
    let reportText = `# Security Matrix: Ghost Attacks (Non-Existent & Malformed IDs)
Test suite isolating the \`express-validator\` structural checks protecting endpoints from malformed and missing identifiers.

---

## 1. URL Parameter \`:id\` — Malformed Format Rejection
**Expectation**: Invalid IDs fail structural checks and return 404 instantly without querying the database.

| Test Case | Input ID | Expected | Actual | Status |
| :--- | :--- | :--- | :--- | :--- |
`;

    // ── URL Param Tests ──

    // T1: Short garbage string
    let err1 = await runParamValidation({ params: { id: "123" } });
    let c1 = err1 ? err1.statusCode || 404 : 200;
    let p1 = c1 === 404; if(p1) P++; else F++;
    reportText += `| Short String | \`"123"\` | 404 | ${c1} | ${p1 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T2: "undefined" string
    let err2 = await runParamValidation({ params: { id: "undefined" } });
    let c2 = err2 ? err2.statusCode || 404 : 200;
    let p2 = c2 === 404; if(p2) P++; else F++;
    reportText += `| Literal "undefined" | \`"undefined"\` | 404 | ${c2} | ${p2 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T3: Special characters
    let err3 = await runParamValidation({ params: { id: "hack!@#$%^&*()" } });
    let c3 = err3 ? err3.statusCode || 404 : 200;
    let p3 = c3 === 404; if(p3) P++; else F++;
    reportText += `| Special Characters | \`"hack!@#$%^&*()"\` | 404 | ${c3} | ${p3 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T4: SQL Injection attempt
    let err4 = await runParamValidation({ params: { id: "'; DROP TABLE threads;--" } });
    let c4 = err4 ? err4.statusCode || 404 : 200;
    let p4 = c4 === 404; if(p4) P++; else F++;
    reportText += `| SQL Injection String | \`"'; DROP TABLE..."\` | 404 | ${c4} | ${p4 ? '✅ PASS' : '❌ FAIL'} |\n`;


    reportText += `\n## 2. URL Parameter \`:id\` — Valid Structure (Ghost ObjectIDs)
**Expectation**: Structurally valid 24-char hex IDs pass the validator cleanly. The controller will then check the DB and return 404 itself.

| Test Case | Input ID | Expected Validation | Actual Validation | Status |
| :--- | :--- | :--- | :--- | :--- |
`;

    // T5: Perfect ghost ObjectID (validator passes)
    const ghostId = new mongoose.Types.ObjectId();
    let err5 = await runParamValidation({ params: { id: ghostId.toString() } });
    let c5 = err5 ? 'Blocked' : 'Passes';
    let p5 = !err5; if(p5) P++; else F++;
    reportText += `| Valid Ghost ObjectID | \`${ghostId}\` | Passes Structurally | ${c5} | ${p5 ? '✅ PASS' : '❌ FAIL'} |\n`;


    reportText += `\n---\n\n## 3. Body Parameter \`subForumId\` — Creation Payload Checks
**Expectation**: The \`subForumId\` field in thread creation must be present, non-empty, and a valid MongoDB ObjectID format.

| Test Case | Input subForumId | Expected | Actual | Status |
| :--- | :--- | :--- | :--- | :--- |
`;

    const validTitle = "Valid Title Here";
    const validContent = "Valid Content Here 123";

    // T6: Valid subForumId (Pass)
    const validSFId = new mongoose.Types.ObjectId().toString();
    let err6 = await runCreationValidation({ body: { title: validTitle, content: validContent, subForumId: validSFId } });
    let c6 = err6 ? 'Blocked' : 'Passes';
    let p6 = !err6; if(p6) P++; else F++;
    reportText += `| Valid MongoID | \`${validSFId}\` | Passes | ${c6} | ${p6 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T7: Empty String subForumId
    let err7 = await runCreationValidation({ body: { title: validTitle, content: validContent, subForumId: "" } });
    let c7 = err7 ? err7.statusCode || 400 : 200;
    let p7 = c7 === 400; if(p7) P++; else F++;
    reportText += `| Empty String | \`""\` | 400 | ${c7} | ${p7 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T8: Missing subForumId entirely (undefined)
    let err8 = await runCreationValidation({ body: { title: validTitle, content: validContent } });
    let c8 = err8 ? err8.statusCode || 400 : 200;
    let p8 = c8 === 400; if(p8) P++; else F++;
    reportText += `| Missing (undefined) | \`undefined\` | 400 | ${c8} | ${p8 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T9: Invalid format string
    let err9 = await runCreationValidation({ body: { title: validTitle, content: validContent, subForumId: "not_a_mongo_id" } });
    let c9 = err9 ? err9.statusCode || 400 : 200;
    let p9 = c9 === 400; if(p9) P++; else F++;
    reportText += `| Invalid Format | \`"not_a_mongo_id"\` | 400 | ${c9} | ${p9 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T10: Number instead of string
    let err10 = await runCreationValidation({ body: { title: validTitle, content: validContent, subForumId: 12345 } });
    let c10 = err10 ? err10.statusCode || 400 : 200;
    let p10 = c10 === 400; if(p10) P++; else F++;
    reportText += `| Numeric Value | \`12345\` | 400 | ${c10} | ${p10 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T11: null value
    let err11 = await runCreationValidation({ body: { title: validTitle, content: validContent, subForumId: null } });
    let c11 = err11 ? err11.statusCode || 400 : 200;
    let p11 = c11 === 400; if(p11) P++; else F++;
    reportText += `| Null Value | \`null\` | 400 | ${c11} | ${p11 ? '✅ PASS' : '❌ FAIL'} |\n`;


    // ══════════════════════════════════════════════
    // SECTION 4: Live DB — Ghost SubForum ID
    // ══════════════════════════════════════════════
    reportText += `\n---\n\n## 4. Live DB — Ghost SubForum ID (Valid Format, Not in Database)
**Expectation**: A structurally valid MongoID that passes the validator but does NOT exist in the database. The controller must catch this and return \`404: SubForum not found\`.

| Test Case | Input subForumId | Expected | Actual | Status |
| :--- | :--- | :--- | :--- | :--- |
`;

    // Create a temporary user for the request
    const ghostUser = await User.create({ googleId: 'ghost_test', email: 'ghost@iitdh.ac.in', name: 'Ghost Tester', role: 'student' });

    // T12: Valid format but SubForum doesn't exist → Controller returns 404
    const ghostSFId = new mongoose.Types.ObjectId();
    const resT12 = mockRes();
    await run(createThread, { user: ghostUser, body: { title: validTitle, content: validContent, subForumId: ghostSFId.toString(), tags: ['test'] } }, resT12);
    let c12 = resT12.error ? resT12.error.statusCode || 404 : 200;
    let p12 = c12 === 404;
    if(p12) P++; else F++;
    reportText += `| Ghost SubForum (Create) | \`${ghostSFId}\` | 404 | ${c12} | ${p12 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T13: Valid format but Thread doesn't exist → getThread returns 404
    const ghostThreadId = new mongoose.Types.ObjectId();
    const resT13 = mockRes();
    await run(getThread, { user: ghostUser, params: { id: ghostThreadId.toString() } }, resT13);
    let c13 = resT13.error ? resT13.error.statusCode || 404 : 200;
    let p13 = c13 === 404;
    if(p13) P++; else F++;
    reportText += `| Ghost Thread (Get) | \`${ghostThreadId}\` | 404 | ${c13} | ${p13 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T14: Valid format but Thread doesn't exist → updateThread returns 404
    const ghostThreadId2 = new mongoose.Types.ObjectId();
    const resT14 = mockRes();
    await run(updateThread, { user: ghostUser, params: { id: ghostThreadId2.toString() }, body: { title: "Hack" } }, resT14);
    let c14 = resT14.error ? resT14.error.statusCode || 404 : 200;
    let p14 = c14 === 404;
    if(p14) P++; else F++;
    reportText += `| Ghost Thread (Update) | \`${ghostThreadId2}\` | 404 | ${c14} | ${p14 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // T15: Valid format but Thread doesn't exist → deleteThread returns 404
    const ghostThreadId3 = new mongoose.Types.ObjectId();
    const resT15 = mockRes();
    await run(deleteThread, { user: ghostUser, params: { id: ghostThreadId3.toString() } }, resT15);
    let c15 = resT15.error ? resT15.error.statusCode || 404 : 200;
    let p15 = c15 === 404;
    if(p15) P++; else F++;
    reportText += `| Ghost Thread (Delete) | \`${ghostThreadId3}\` | 404 | ${c15} | ${p15 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // Cleanup ghost user
    await User.findByIdAndDelete(ghostUser._id);

    reportText += `\n---\n\n### Execution Summary\n- Total Checks: ${P+F}\n- Passed Matrix Boundaries: ${P}\n- Failed Matrix Boundaries: ${F}`;
    fs.mkdirSync(__dirname, { recursive: true });
    fs.writeFileSync(path.join(__dirname, 'ghost_attacks_report.md'), reportText);
    console.log(`🎉 Matrix complete! Check ghost_attacks_report.md`);
    process.exit(0);
}

runGhostIdTests();
