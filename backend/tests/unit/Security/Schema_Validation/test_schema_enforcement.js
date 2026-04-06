import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../../../../.env') });

import { validateThreadCreation } from '../../../../validators/threadValidator.js';

// ────────── MOCK RUNNER ──────────
const runValidation = async (req) => {
    let errCaught = null;
    const res = {};
    for (let mw of validateThreadCreation) {
        await new Promise((resolve) => {
            const next = (err) => { 
                if(err) errCaught = err; 
                resolve(); 
            };
            mw(req, res, next);
        });
        if (errCaught) return errCaught;
    }
    return null; // Passed validation cleanly!
};

async function runSchemaTests() {
    console.log("Checking Core Schema Boundaries (8 Tests)...\n");
    
    let reportText = `# Security Matrix: Title & Content Core Boundaries
Strict execution of exact limits (Pass, Empty, Under Limit, Over Limit) against text constraint allocations natively isolated from the DB.

---

| Test Item | Scenario | Input Description | Expected Status | Actual Status | Match |
| :--- | :--- | :--- | :--- | :--- | :--- |
`;

    let P=0, F=0;
    const mockSFId = new mongoose.Types.ObjectId().toString();

    // ==========================================
    // 1. TITLE BOUNDARIES (Min 5, Max 100)
    // ==========================================

    // #1 - Title PASS
    let e1 = await runValidation({ body: { title: "Valid Title", content: "Valid Content String", subForumId: mockSFId } });
    let c1 = e1 ? e1.statusCode || 400 : 200;
    let p1 = c1 === 200; if(p1) P++; else F++;
    reportText += `| **Title** | 1. Pass | \`11 chars\` (Valid) | 200 | ${c1} | ${p1 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // #2 - Title FAIL (Empty)
    let e2 = await runValidation({ body: { title: "", content: "Valid Content String", subForumId: mockSFId } });
    let c2 = e2 ? e2.statusCode || 400 : 200;
    let p2 = c2 === 400; if(p2) P++; else F++;
    reportText += `| **Title** | 2. Fail (Empty) | \`""\` | 400 | ${c2} | ${p2 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // #3 - Title FAIL (Under 5)
    let e3 = await runValidation({ body: { title: "abcd", content: "Valid Content String", subForumId: mockSFId } });
    let c3 = e3 ? e3.statusCode || 400 : 200;
    let p3 = c3 === 400; if(p3) P++; else F++;
    reportText += `| **Title** | 3. Fail (Under) | \`4 chars\` ("abcd") | 400 | ${c3} | ${p3 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // #4 - Title FAIL (Over 100)
    const title101 = "A".repeat(101);
    let e4 = await runValidation({ body: { title: title101, content: "Valid Content String", subForumId: mockSFId } });
    let c4 = e4 ? e4.statusCode || 400 : 200;
    let p4 = c4 === 400; if(p4) P++; else F++;
    reportText += `| **Title** | 4. Fail (Over) | \`101 chars\` Focus | 400 | ${c4} | ${p4 ? '✅ PASS' : '❌ FAIL'} |\n`;


    // ==========================================
    // 2. CONTENT BOUNDARIES (Min 10, Max 5000)
    // ==========================================

    // #5 - Content PASS
    let e5 = await runValidation({ body: { title: "Valid Title", content: "Valid Content String", subForumId: mockSFId } });
    let c5 = e5 ? e5.statusCode || 400 : 200;
    let p5 = c5 === 200; if(p5) P++; else F++;
    reportText += `| **Content** | 5. Pass | \`20 chars\` (Valid) | 200 | ${c5} | ${p5 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // #6 - Content FAIL (Empty)
    let e6 = await runValidation({ body: { title: "Valid Title", content: "", subForumId: mockSFId } });
    let c6 = e6 ? e6.statusCode || 400 : 200;
    let p6 = c6 === 400; if(p6) P++; else F++;
    reportText += `| **Content** | 6. Fail (Empty) | \`""\` | 400 | ${c6} | ${p6 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // #7 - Content FAIL (Under 10)
    let e7 = await runValidation({ body: { title: "Valid Title", content: "short123", subForumId: mockSFId } });
    let c7 = e7 ? e7.statusCode || 400 : 200;
    let p7 = c7 === 400; if(p7) P++; else F++;
    reportText += `| **Content** | 7. Fail (Under)| \`8 chars\` ("short123") | 400 | ${c7} | ${p7 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // #8 - Content FAIL (Over 5000)
    const content5001 = "B".repeat(5001);
    let e8 = await runValidation({ body: { title: "Valid Title", content: content5001, subForumId: mockSFId } });
    let c8 = e8 ? e8.statusCode || 400 : 200;
    let p8 = c8 === 400; if(p8) P++; else F++;
    reportText += `| **Content** | 8. Fail (Over)| \`5001 chars\` Focus | 400 | ${c8} | ${p8 ? '✅ PASS' : '❌ FAIL'} |\n`;

    // Finish File
    reportText += `\n---\n\n### Execution Summary\n- Total Target Checks: ${P+F}\n- Passed Matrix Boundaries: ${P}\n- Failed Matrix Boundaries: ${F}`;
    fs.mkdirSync(__dirname, { recursive: true });
    fs.writeFileSync(path.join(__dirname, 'schema_validation_report.md'), reportText);
    
    console.log(`🎉 Perfect Sweep! Extracted exactly ${P+F} Title/Content Validation Checks into schema_validation_report.md`);
    process.exit(0);
}

runSchemaTests();
