import { AppError } from "./appError.js";


export const cleanTags = (tags) => {
  if (!Array.isArray(tags)) return [];

  const processedTags = tags
    .filter((t) => t != null) // Filter out null/undefined before string coercion
    .map((t) => String(t).toLowerCase().trim().replace(/\s+/g, "-")) // Hyphenate instead of removing spaces
    .filter((t) => t.length > 0); // Explicit check for empty strings

  return [...new Set(processedTags)];
};

// Escape special regex characters so user input is treated as a literal string
export const escapeRegex = (str) =>
  str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
