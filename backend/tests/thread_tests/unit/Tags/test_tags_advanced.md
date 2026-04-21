# Tag Validation: Advanced Logic (Hyphenation, Type Coercion, Null Safety)
This suite tests behaviors introduced by merging Person B's `cleanTags` utility with the original `sanitizeTags`.

## 1. Environment State
### Data Loaded
- Forum: `AdvTagForum` (Approved/Active)
- SubForum: `AdvTagSub`
- User: `AdvTester` (Role: student)

---

## 2. Test Execution Log

| Target | Input Data | Description | Expected Behavior | Actual Outcome |
| :--- | :--- | :--- | :--- | :--- |
| ✅ H1 Basic Hyphenation (Pass) | `["Web Dev", "Data Science"]` | Single spaces between words are converted to hyphens. | ["web-dev","data-science"] | ["web-dev","data-science"] |
| ✅ H2 Multi-Space Collapse (Pass) | `["Machine     Learning", " deep  learning "]` | Multiple consecutive spaces collapse into a single hyphen. | ["machine-learning","deep-learning"] | ["machine-learning","deep-learning"] |
| ✅ H3 Pre-Hyphenated (Pass) | `["react-native", "  vue-js  "]` | Tags already containing hyphens are preserved intact. | ["react-native","vue-js"] | ["react-native","vue-js"] |
| ✅ H4 Only Spaces (Fail) | `["   ", "  "]` | Tags composed entirely of spaces are filtered out, resulting in rejection. | 400 | 400 |
| ✅ T1 Number Coercion (Pass) | `[2024, 42]` | Numeric values are safely cast to string tags. | ["2024","42"] | ["2024","42"] |
| ✅ T2 Boolean Coercion (Pass) | `[true, false]` | Boolean values are safely cast to string tags. | ["true","false"] | ["true","false"] |
| ✅ T3 Mixed Types (Pass) | `["react", 2024, true]` | Mixed string/number/boolean array is safely normalized. | ["react","2024","true"] | ["react","2024","true"] |
| ✅ T4 Non-Array Input (Fail) | `'not-an-array'` | A raw string instead of an array is treated as empty and rejected. | 400 | 400 |
| ✅ N1 All Null (Fail) | `[null, null]` | Array of only null values is filtered to empty and rejected. | 400 | 400 |
| ✅ N2 All Undefined (Fail) | `[undefined, undefined]` | Array of only undefined values is filtered to empty and rejected. | 400 | 400 |
| ✅ N3 Mixed Valid+Null (Pass) | `["react", null, "node", undefined]` | Null/undefined entries are silently filtered; valid tags are preserved. | ["react","node"] | ["react","node"] |
| ✅ N4 Update Null Tags (Fail) | `[null, undefined, '']` | Updating tags to only null/undefined/empty values is rejected. | 400 | 400 |

### Summary
- **Total:** 12
- **Passed:** 12
- **Failed:** 0