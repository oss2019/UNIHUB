# UNIHUB Integration Test Results (V3)

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
| **Mechanical** | ✅ | ❌ | Archived | Automobile, Thermo | Visible (All Levels) | Blocked |
| **Mathematics** | ❌ | ❌ | Dead | Calculus, Algebra | Hidden (Admin Only) | Blocked |

### Tag Map (with Overlaps)
| SubForum | Tags | Intra-Overlap | Inter-Overlap |
| :--- | :--- | :--- | :--- |
| Web Dev (CS) | react, node, python, nextjs | python â†’ AI & ML | python â†’ Careers |
| AI & ML (CS) | python, pytorch, data | python â†’ Web Dev | data â†’ Calculus, Algebra |
| Cyber Sec (CS) | security, networking, linux | â€” | networking â†’ Events |
| Events (General) | fest, hackathon, networking | â€” | networking â†’ Cyber Sec |
| Careers (General) | placement, resume, python | â€” | python â†’ Web Dev, AI & ML |
| Hobbies (General) | gaming, music, photography | â€” | â€” |
| VLSI (EE) | vlsi, verilog, fpga | â€” | â€” |
| Power Sys (EE) | power, grid, renewable | â€” | â€” |
| Automobile (ME) | ev, engines, design | design â†’ Thermo | â€” |
| Thermo (ME) | heat, fluid, design | design â†’ Automobile | â€” |
| Calculus (Math) | calc, integration, data | data â†’ Algebra | data â†’ AI & ML |
| Algebra (Math) | linear, matrices, data | data â†’ Calculus | data â†’ AI & ML |

---

## 2. Test Execution Log

| Target | Description | Expected Behavior | Actual Outcome |
| :--- | :--- | :--- | :--- |
| ✅ A1 Tag Normalize | Validates lowercase, trim, dedup. | ['react', 'node'] | [react,node] |
| ✅ A2 Ghost Block | Blocks threads with only whitespace tags. | 400 | 400 |
| ✅ A3 Dedup Case | Triples of same tag collapse to one. | ['python'] | [python] |
| ✅ A4 Trim+Lower | Mixed spacing and casing normalized. | ['fest','hackathon','networking'] | [fest,hackathon,networking] |
| ✅ A5 Undefined Tags | Undefined tags array rejected. | 400 | 400 |
| ✅ A6 Empty Array | Empty tags array rejected. | 400 | 400 |
| ✅ A7 Hyphenation (Pass) | Spaces are safely converted to hyphens. | ['web-dev', 'artificial-intelligence'] | [web-dev,artificial-intelligence] |
| ✅ A10 Hyphen Collapse (Edge) | Multiple consecutive spaces collapse into a single hyphen without duplication. | ['machine-learning', 'deep-learning'] | [machine-learning,deep-learning] |
| ✅ A11 Pre-Hyphenated (Pass) | Tags that already contain hyphens are kept intact without adding extra formatting. | ['react-native', 'vue-js'] | [react-native,vue-js] |
| ✅ A8 Type Safety (Pass) | Non-string primitive tags are safely converted to strings. | ['2024', 'true'] | [2024,true] |
| ✅ A9 Null Safety (Fail) | Threads with only null/undefined tags are filtered out and rejected. | 400 | 400 |
| ✅ B1 Live Student | Student posts in Live CS forum. | 201 | 201 |
| ✅ B2 Live Alumni | Alumni posts in Live CS forum. | 201 | 201 |
| ✅ B3 General Student | Student posts in Live General forum. | 201 | 201 |
| ✅ B4 General Alumni | Alumni posts in Live General forum. | 201 | 201 |
| ✅ B5 Pending Student | Student blocked from Pending EE forum. | 403 | 403 |
| ✅ B6 Pending Alumni | Alumni blocked from Pending EE forum. | 403 | 403 |
| ✅ B7 Pending Admin | Admin overrides Pending gate. | 201 | 201 |
| ✅ B8 Archived Admin | Admin blocked from posting in Archived ME forum. | 403 | 403 |
| ✅ B9 Archived Student | Student blocked from posting in Archived ME forum. | 403 | 403 |
| ✅ B10 Dead Admin | Admin blocked from posting in Dead Math forum. | 403 | 403 |
| ✅ C1 Pending Forum Admin | Admin sees pending forum feed. | > 0 | 2 |
| ✅ C2 Pending Forum Student | Student gets 0 in pending forum feed. | 0 | 0 |
| ✅ C3 Pending Forum Alumni | Alumni gets 0 in pending forum feed. | 0 | 0 |
| ✅ C4 Pending Individual Student | Student views pending thread via direct ID. | success | success |
| ✅ C5 Pending Individual Alumni | Alumni views pending thread via direct ID. | success | success |
| ✅ C6 Archived Forum Student | Student browses archived forum list. | > 0 | 1 |
| ✅ C7 Archived Forum Alumni | Alumni browses archived forum list. | > 0 | 1 |
| ✅ C8 Archived Individual Student | Student views archived thread. | success | success |
| ✅ C9 Dead Forum Admin | Admin audit-views dead forum. | > 0 | 1 |
| ✅ C10 Dead Forum Student | Student gets 0 in dead forum. | 0 | 0 |
| ✅ C11 Dead Individual Admin | Admin views dead thread. | success | success |
| ✅ C12 Dead Individual Student | Student blocked from dead thread. | 403 | 403 |
| ✅ C13 Dead Individual Alumni | Alumni blocked from dead thread. | 403 | 403 |
| ✅ C14 Live General Student | Student sees General forum feed. | > 0 | 3 |
| ✅ D1 Edit Author | Student edits own thread. | success | success |
| ✅ D2 Edit Foreign Alumni | Alumni blocked from editing student's thread. | 403 | 403 |
| ✅ D3 Edit Admin Foreign | Admin blocked from editing student's text. | 403 | 403 |
| ✅ D4 Edit Foreign Student | Student blocked from editing peer's thread. | 403 | 403 |
| ✅ D5 Pin Admin | Admin pins alumni's thread. | true | true |
| ✅ D6 Pin Author Student | Student pin on own thread rejected. | 403 | 403 |
| ✅ D7 Pin Author Alumni | Alumni unpin on own thread rejected. | 403 | 403 |
| ✅ D8 Pin Foreign Student | Foreign student pin attempt rejected. | 403 | 403 |
| ✅ D9 Delete Admin Override | Admin deletes student's thread. | success | success |
| ✅ D10 Delete Foreign Alumni | Alumni blocked from deleting peer's thread. | 403 | 403 |
| ✅ D11 Delete Author Alumni | Alumni deletes own thread. | success | success |
| ✅ D12 Delete Foreign Student | Student blocked from deleting peer's thread. | 403 | 403 |
| ✅ E1 Page 1 Default | Default fetch limits to max 20 threads. | 20 | 20 |
| ✅ E2 Page 2 | Second page returns remaining items. | > 0 | 12 |
| ✅ E3 Page OOB | Out of bounds page returns empty list. | 0 | 0 |
| ✅ E4 Custom Limit | Custom limit=5 returns exactly 5. | 5 | 5 |
| ✅ F1 Missing Content | Blocks thread creation without content. | 400 | 400 |
| ✅ F2 Missing Title | Blocks thread creation without title. | 400 | 400 |
| ✅ F3 Missing SubForumId | Blocks thread creation without subForumId. | 400 | 400 |
| ✅ F4 Fake Resource ID | Returns 404 for valid but non-real DB ID. | 404 | 404 |
| ✅ G1 URL Short Form | Blocks 3 char short malformed ObjectIDs. | 404 | 404 |
| ✅ G2 URL Literal Undefined | Blocks literal 'undefined' string injection. | 404 | 404 |
| ✅ G3 Body SubForum Empty | Blocks completely empty formatted subForum target. | 400 | 400 |
| ✅ G4 Body SubForum Missing | Blocks natively omitted subForum parameter. | 400 | 400 |
| ✅ G5 Body SubForum Malformed | Blocks structurally malformed subForum format string. | 400 | 400 |
| ✅ G6 Perfect Formation Base | Approves perfect 24-hex formatted dummy. | null | null |
| ✅ G7 Live Ghost Create Sweep | Controller correctly maps perfectly formatted ghost creation to 404. | 404 | 404 |
| ✅ H1 Title Pass Mid Size | Valid mathematically perfectly bound title passes. | null | null |
| ✅ H2 Title Fail Empty | Perfectly empty string blocks correctly. | 400 | 400 |
| ✅ H3 Title Fail Under Limits | Limits string natively bound tightly to less than 5 check. | 400 | 400 |
| ✅ H4 Title Fail Over Limits | Blocks inherently completely blown 101 character sizes. | 400 | 400 |
| ✅ H5 Content Pass Mid Size | Passes perfectly mathematically 20 sized string check natively. | null | null |
| ✅ H6 Content Fail Empty | Perfectly empty generic block falls short intrinsically. | 400 | 400 |
| ✅ H7 Content Fail Under Limits | Limits natively under 10 boundary. | 400 | 400 |
| ✅ H8 Content Fail Over Limits | Blocks strictly exceeding limits natively. | 400 | 400 |

### Summary
- **Total:** 70
- **Passed:** 70
- **Failed:** 0