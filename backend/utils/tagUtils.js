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

// Escape special regex characters so user input is treated as a literal string
export const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
