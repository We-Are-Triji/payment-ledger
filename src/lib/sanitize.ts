/** Security utilities for input sanitization, validation, and rate limiting. */

/** Escape HTML special characters to prevent XSS when embedding in raw HTML. */
export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Input length limits. */
export const MAX_NAME_LENGTH = 100;
export const MAX_DESCRIPTION_LENGTH = 2000;

/** Allowed image file extensions for uploads. */
const ALLOWED_IMAGE_EXTENSIONS = new Set(["jpg", "jpeg", "png", "webp", "gif"]);

/** Validate that a file has an allowed image extension. */
export function validateImageFile(file: File): void {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Invalid file type. Allowed: JPG, PNG, WebP, GIF");
  }
}

/** Get the validated extension from a file. */
export function getValidatedExtension(file: File): string {
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_IMAGE_EXTENSIONS.has(ext)) {
    throw new Error("Invalid file type. Allowed: JPG, PNG, WebP, GIF");
  }
  return ext;
}

/** Known safe error message prefixes that can be shown to users. */
const SAFE_ERROR_PREFIXES = [
  "Invalid file type",
  "Name too long",
  "Not authenticated",
  "Please wait before trying again",
  "No changes since last backup",
  "This backup belongs to a different ledger",
  "Invalid backup file format",
  "Invitation not found",
  "Invitation has expired",
  "Invitation has already been used",
  "Invitation has been invalidated",
  "Invitation is no longer valid",
  "Public balance link not found",
  "You are not permitted to view this balance link",
];

/** Convert an unknown error to a user-safe message. */
export function toUserError(error: unknown): string {
  if (error instanceof Error) {
    if (SAFE_ERROR_PREFIXES.some((prefix) => error.message.includes(prefix))) {
      return error.message;
    }
    if (error.message.includes("Not authenticated")) {
      return "Please sign in to continue";
    }
  }
  return "Something went wrong. Please try again.";
}

/** Create a throttle guard that throws if called too soon after the last call. */
export function createThrottle(ms: number) {
  let last = 0;
  return () => {
    const now = Date.now();
    if (now - last < ms) throw new Error("Please wait before trying again");
    last = now;
  };
}
