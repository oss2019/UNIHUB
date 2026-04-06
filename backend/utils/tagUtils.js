import { AppError } from "./appError.js";

// ─────────────────────────────────────────────────────────────────────────────
// Tag sanitiser — lowercase, hyphenated, deduplicated
// ─────────────────────────────────────────────────────────────────────────────
export const cleanTags = (tags) => [
  ...new Set(
    (Array.isArray(tags) ? tags : [])
      .map((t) => String(t).toLowerCase().trim().replace(/\s+/g, "-"))
      .filter(Boolean),
  ),
];
