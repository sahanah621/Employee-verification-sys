import * as crypto from "crypto";

/**
 * Encrypted payload structure pinned to IPFS.
 * Note: Encryption keys are never stored on Ethereum, IPFS, or exposed to the frontend.
 */
export interface EncryptedPayload {
  ciphertext: string; // Base64-encoded encrypted file content
  iv: string;         // Base64-encoded 12-byte initialization vector for AES-GCM
  authTag: string;    // Base64-encoded 16-byte GCM authentication tag
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
}

export class EncryptionService {
  private readonly algorithm = "aes-256-gcm";
  private readonly ivLength = 12; // Standard 96-bit IV for AES-GCM

  /**
   * Derives a deterministic 256-bit AES key for a specific document
   * using HKDF (RFC 5869) combining the server master key and the on-chain document hash.
   */
  deriveDocumentKey(masterKeyHex: string, documentHashHex: string): Buffer {
    if (!masterKeyHex) {
      throw new Error("Master encryption key is not configured");
    }

    const cleanMasterKey = masterKeyHex.replace(/^0x/, "");
    const cleanDocHash = documentHashHex.replace(/^0x/, "");

    const ikm = Buffer.from(cleanMasterKey, "hex");
    const salt = Buffer.from(cleanDocHash, "hex");
    const info = Buffer.from("workproof-aes256gcm-document-v1", "utf-8");

    // Standard 32-byte (256-bit) derived key
    const derivedKey = crypto.hkdfSync("sha256", ikm, salt, info, 32);
    return Buffer.from(derivedKey);
  }

  /**
   * Encrypts a file buffer using AES-256-GCM.
   */
  async encrypt(
    buffer: Buffer,
    key: Buffer,
    metadata?: { originalName?: string; mimeType?: string }
  ): Promise<EncryptedPayload> {
    if (key.length !== 32) {
      throw new Error("AES-256 key must be exactly 32 bytes (256 bits)");
    }

    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipheriv(this.algorithm, key, iv);

    const ciphertextBuffer = Buffer.concat([cipher.update(buffer), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return {
      ciphertext: ciphertextBuffer.toString("base64"),
      iv: iv.toString("base64"),
      authTag: authTag.toString("base64"),
      originalName: metadata?.originalName,
      mimeType: metadata?.mimeType,
      sizeBytes: buffer.length,
    };
  }

  /**
   * Decrypts an encrypted payload using AES-256-GCM and verifies authenticity tag.
   */
  async decrypt(payload: EncryptedPayload, key: Buffer): Promise<Buffer> {
    if (key.length !== 32) {
      throw new Error("AES-256 key must be exactly 32 bytes (256 bits)");
    }

    if (!payload.ciphertext || !payload.iv || !payload.authTag) {
      throw new Error("Invalid payload: ciphertext, iv, and authTag are required");
    }

    const iv = Buffer.from(payload.iv, "base64");
    const authTag = Buffer.from(payload.authTag, "base64");
    const ciphertext = Buffer.from(payload.ciphertext, "base64");

    if (iv.length !== this.ivLength) {
      throw new Error(`Invalid IV length: expected ${this.ivLength} bytes, got ${iv.length}`);
    }

    const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
    decipher.setAuthTag(authTag);

    try {
      const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
      return decrypted;
    } catch (err: any) {
      throw new Error("Decryption failed: cryptographic authentication tag mismatch or corrupt payload");
    }
  }

  /**
   * Serializes an EncryptedPayload into a JSON Buffer for IPFS storage.
   */
  serializePayload(payload: EncryptedPayload): Buffer {
    return Buffer.from(JSON.stringify(payload), "utf-8");
  }

  /**
   * Deserializes a JSON Buffer from IPFS into an EncryptedPayload.
   */
  deserializePayload(buffer: Buffer): EncryptedPayload {
    try {
      const parsed = JSON.parse(buffer.toString("utf-8"));
      if (!parsed.ciphertext || !parsed.iv || !parsed.authTag) {
        throw new Error("Missing required cryptographic fields in IPFS payload");
      }
      return parsed as EncryptedPayload;
    } catch (err: any) {
      throw new Error(`Failed to parse encrypted payload from IPFS: ${err.message}`);
    }
  }
}

export const encryptionService = new EncryptionService();
