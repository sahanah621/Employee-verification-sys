/**
 * Deterministically canonicalizes structured data to JSON string for consistent SHA-256 hashing.
 */
export function canonicalizeJson(obj: Record<string, any>): string {
  if (obj === null || typeof obj !== "object" || Array.isArray(obj)) {
    return JSON.stringify(obj);
  }

  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: Record<string, any> = {};

  for (const key of sortedKeys) {
    const val = obj[key];
    sortedObj[key] = typeof val === "object" && val !== null ? JSON.parse(canonicalizeJson(val)) : val;
  }

  return JSON.stringify(sortedObj);
}
