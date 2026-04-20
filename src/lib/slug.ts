// Backend forums don't expose a slug — we derive one from the name and use the id as fallback.
import type { Forum } from "./types";

export const slugify = (s: string) =>
  s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

// We use the forum _id as the route slug for stability (names can change).
// Helpers below let us swap to name-based slugs later without touching routes.
export const forumSlug = (f: Pick<Forum, "_id" | "name">) => f._id;
export const findForumBySlug = (forums: Forum[], slug: string) =>
  forums.find((f) => f._id === slug || slugify(f.name) === slug);
