import * as crypto from "crypto";
import { canonicalizeJson } from "../utils/canonicalize";

/**
 * Hashing service placeholder for SHA-256 computations.
 */
export class HashingService {
  /**
   * Computes SHA-256 hash of a file or buffer.
   * Returns a 0x-prefixed 32-byte hex string by default for Solidity bytes32 compatibility.
   */
  hashBuffer(buffer: Buffer, withPrefix = true): string {
    const hex = crypto.createHash("sha256").update(buffer).digest("hex");
    return withPrefix ? `0x${hex}` : hex;
  }

  /**
   * Computes SHA-256 hash of a string (e.g. employee identifier, email, or employee ID).
   */
  hashString(str: string, withPrefix = true): string {
    const hex = crypto.createHash("sha256").update(str, "utf8").digest("hex");
    return withPrefix ? `0x${hex}` : hex;
  }

  /**
   * Computes SHA-256 hash of canonicalized structured employment data.
   */
  hashRecord(recordData: Record<string, any>, withPrefix = true): string {
    const canonical = canonicalizeJson(recordData);
    const hex = crypto.createHash("sha256").update(canonical, "utf8").digest("hex");
    return withPrefix ? `0x${hex}` : hex;
  }
}

export const hashingService = new HashingService();
