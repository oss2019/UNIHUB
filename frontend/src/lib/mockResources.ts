// Re-export resource types from the canonical types module.
// The hardcoded mock data has been removed — resources are now fetched from the API.
export type {
  ResourceCategory,
  ResourceFileType,
  Resource,
  CreateResourceInput,
} from "./types";
