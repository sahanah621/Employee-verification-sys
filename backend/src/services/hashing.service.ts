import * as crypto from "crypto";
import { canonicalizeJson } from "../utils/canonicalize";

/**
 * Hashing service placeholder for SHA-256 computations.
 */
export class HashingService {
  /**
   * Computes SHA-256 hash of a file or buffer.
   */
  hashBuffer(buffer: Buffer): string {
    return crypto.createHash("sha256").update(buffer).digest("hex");
  }

  /**
   * Computes SHA-256 hash of canonicalized structured employment data.
   */
  hashRecord(recordData: Record<string, any>): string {
    const canonical = canonicalizeJson(recordData);
    return crypto.createHash("sha256").update(canonical).digest("hex");
  }
}

export const hashingService = new HashingService();
