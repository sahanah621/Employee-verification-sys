import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { ethers } from "ethers";
import app from "../src/app";
import { encryptionService } from "../src/services/encryption.service";
import { hashingService } from "../src/services/hashing.service";
import { signatureService } from "../src/services/signature.service";
import { ipfsService, MockIpfsProvider } from "../src/services/ipfs.service";
import { config } from "../src/config/env";

describe("WorkProof Phase 3: Document, Encryption & IPFS Pipeline", () => {
  const masterKey = config.crypto.masterKey;

  // -------------------------------------------------------------
  // 1. Cryptographic AES-256-GCM & HKDF Unit Tests
  // -------------------------------------------------------------
  describe("1. AES-256-GCM & HKDF Cryptography", () => {
    const testDoc = Buffer.from("WorkProof Confidential Employment Verification Document 2026", "utf-8");
    const docHash = hashingService.hashBuffer(testDoc, true);

    it("Should deterministically derive the same 32-byte AES key for the same documentHash", () => {
      const key1 = encryptionService.deriveDocumentKey(masterKey, docHash);
      const key2 = encryptionService.deriveDocumentKey(masterKey, docHash);

      assert.strictEqual(key1.length, 32);
      assert.strictEqual(key2.length, 32);
      assert.strictEqual(key1.toString("hex"), key2.toString("hex"));
    });

    it("Should derive different AES keys for different document hashes", () => {
      const otherDocHash = "0x" + "f".repeat(64);
      const key1 = encryptionService.deriveDocumentKey(masterKey, docHash);
      const key2 = encryptionService.deriveDocumentKey(masterKey, otherDocHash);

      assert.notStrictEqual(key1.toString("hex"), key2.toString("hex"));
    });

    it("Should encrypt and decrypt a document payload successfully with integrity tag", async () => {
      const key = encryptionService.deriveDocumentKey(masterKey, docHash);
      const encrypted = await encryptionService.encrypt(testDoc, key, {
        originalName: "test-cert.pdf",
        mimeType: "application/pdf",
      });

      assert.ok(encrypted.ciphertext);
      assert.ok(encrypted.iv);
      assert.ok(encrypted.authTag);
      assert.strictEqual(encrypted.originalName, "test-cert.pdf");
      assert.strictEqual(encrypted.mimeType, "application/pdf");

      const decrypted = await encryptionService.decrypt(encrypted, key);
      assert.deepStrictEqual(decrypted, testDoc);
      assert.strictEqual(decrypted.toString("utf-8"), testDoc.toString("utf-8"));
    });

    it("Should fail decryption if ciphertext is tampered with (GCM auth tag verification)", async () => {
      const key = encryptionService.deriveDocumentKey(masterKey, docHash);
      const encrypted = await encryptionService.encrypt(testDoc, key);

      // Tamper with ciphertext by altering characters
      const tamperedCiphertext = Buffer.from("tampered" + encrypted.ciphertext.slice(8)).toString("base64");
      const tamperedPayload = { ...encrypted, ciphertext: tamperedCiphertext };

      await assert.rejects(
        async () => {
          await encryptionService.decrypt(tamperedPayload, key);
        },
        /authentication tag mismatch/i
      );
    });

    it("Should fail decryption if authTag is tampered with", async () => {
      const key = encryptionService.deriveDocumentKey(masterKey, docHash);
      const encrypted = await encryptionService.encrypt(testDoc, key);

      const fakeTag = Buffer.from("0".repeat(16)).toString("base64");
      const tamperedPayload = { ...encrypted, authTag: fakeTag };

      await assert.rejects(
        async () => {
          await encryptionService.decrypt(tamperedPayload, key);
        },
        /authentication tag mismatch/i
      );
    });

    it("Should serialize and deserialize an encrypted payload accurately", () => {
      const payload = {
        ciphertext: "dGVzdF9jaXBoZXI=",
        iv: "MTIzNDU2Nzg5MDEy",
        authTag: "MTIzNDU2Nzg5MDEyMzQ1Ng==",
        originalName: "contract.pdf",
        mimeType: "application/pdf",
        sizeBytes: 1024,
      };

      const serialized = encryptionService.serializePayload(payload);
      const deserialized = encryptionService.deserializePayload(serialized);

      assert.deepStrictEqual(deserialized, payload);
    });
  });

  // -------------------------------------------------------------
  // 2. Canonical Hashing & Record Integrity Unit Tests
  // -------------------------------------------------------------
  describe("2. Hashing Service & Canonical Records", () => {
    it("Should compute 0x-prefixed 32-byte (64-hex char) SHA-256 digest", () => {
      const buffer = Buffer.from("Hello WorkProof", "utf-8");
      const hash = hashingService.hashBuffer(buffer, true);

      assert.strictEqual(hash.startsWith("0x"), true);
      assert.strictEqual(hash.length, 66); // 0x + 64 hex characters
    });

    it("Should produce identical recordHash regardless of JSON object key ordering", () => {
      const record1 = {
        employee: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        position: "Lead Security Engineer",
        startDate: 1672531199,
        endDate: 0,
      };

      const record2 = {
        endDate: 0,
        position: "Lead Security Engineer",
        startDate: 1672531199,
        employee: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
      };

      const hash1 = hashingService.hashRecord(record1, true);
      const hash2 = hashingService.hashRecord(record2, true);

      assert.strictEqual(hash1, hash2);
    });
  });

  // -------------------------------------------------------------
  // 3. ECDSA Signature & Access Challenge Verification
  // -------------------------------------------------------------
  describe("3. Signature Service & Access Request Challenges", () => {
    it("Should successfully verify a valid ECDSA signature on challenge message", async () => {
      const wallet = ethers.Wallet.createRandom();
      const timestamp = Math.floor(Date.now() / 1000);
      const challenge = signatureService.buildAccessChallenge(1, timestamp);

      const signature = await wallet.signMessage(challenge);

      const verification = signatureService.verifyAccessRequest(
        1,
        wallet.address,
        signature,
        timestamp,
        300
      );

      assert.strictEqual(verification.valid, true);
    });

    it("Should reject signature from a different wallet address", async () => {
      const wallet1 = ethers.Wallet.createRandom();
      const wallet2 = ethers.Wallet.createRandom();
      const timestamp = Math.floor(Date.now() / 1000);
      const challenge = signatureService.buildAccessChallenge(1, timestamp);

      const signature = await wallet1.signMessage(challenge);

      const verification = signatureService.verifyAccessRequest(
        1,
        wallet2.address, // Expected wallet2, but signed by wallet1
        signature,
        timestamp,
        300
      );

      assert.strictEqual(verification.valid, false);
      assert.ok(verification.error?.includes("Invalid cryptographic signature"));
    });

    it("Should reject expired challenge signatures (replay protection)", async () => {
      const wallet = ethers.Wallet.createRandom();
      const oldTimestamp = Math.floor(Date.now() / 1000) - 400; // 400 seconds ago
      const challenge = signatureService.buildAccessChallenge(1, oldTimestamp);

      const signature = await wallet.signMessage(challenge);

      const verification = signatureService.verifyAccessRequest(
        1,
        wallet.address,
        signature,
        oldTimestamp,
        300 // 300 second maxAge
      );

      assert.strictEqual(verification.valid, false);
      assert.ok(verification.error?.includes("expired or invalid timestamp"));
    });
  });

  // -------------------------------------------------------------
  // 4. IPFS Provider Unit Tests
  // -------------------------------------------------------------
  describe("4. IPFS Service & Mock Storage Provider", () => {
    it("Should upload and retrieve buffer via Mock provider", async () => {
      const mockProvider = new MockIpfsProvider();
      const testBuffer = Buffer.from("Encrypted IPFS Payload Data", "utf-8");

      const cid = await mockProvider.uploadEncryptedBuffer(testBuffer, "test.enc");
      assert.ok(cid.startsWith("Qm"));

      const retrieved = await mockProvider.fetchEncryptedBuffer(cid);
      assert.deepStrictEqual(retrieved, testBuffer);
    });

    it("Should throw error when retrieving non-existent CID", async () => {
      const mockProvider = new MockIpfsProvider();
      await assert.rejects(
        async () => {
          await mockProvider.fetchEncryptedBuffer("QmNonExistentCID");
        },
        /IPFS CID not found/i
      );
    });
  });

  // -------------------------------------------------------------
  // 5. Document API Endpoints Integration Tests
  // -------------------------------------------------------------
  describe("5. Document API Routes Integration", () => {
    it("POST /api/document/upload should reject request without file", async () => {
      const res = await request(app).post("/api/document/upload");
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.message.includes("No file uploaded"));
    });

    it("POST /api/document/upload should encrypt and pin a valid file", async () => {
      const fileContent = "Official Employment Experience Letter Content";
      const expectedHash = hashingService.hashBuffer(Buffer.from(fileContent), true);

      const res = await request(app)
        .post("/api/document/upload")
        .attach("document", Buffer.from(fileContent), {
          filename: "experience_letter.txt",
          contentType: "text/plain",
        });

      assert.strictEqual(res.status, 201);
      assert.strictEqual(res.body.success, true);
      assert.strictEqual(res.body.data.documentHash, expectedHash);
      assert.ok(res.body.data.ipfsCID);
      assert.strictEqual(res.body.data.originalName, "experience_letter.txt");
      assert.strictEqual(res.body.data.mimeType, "text/plain");
      assert.strictEqual(res.body.data.sizeBytes, Buffer.from(fileContent).length);
    });

    it("POST /api/document/prepare should canonicalize and return hashes", async () => {
      const payload = {
        employee: "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
        employeeIdOrEmail: "emp-42@company.com",
        position: "Principal Architect",
        startDate: 1672531199,
        endDate: 0,
      };

      const res = await request(app)
        .post("/api/document/prepare")
        .send(payload);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.success, true);
      assert.ok(res.body.data.employeeHash.startsWith("0x"));
      assert.ok(res.body.data.recordHash.startsWith("0x"));
      assert.strictEqual(res.body.data.employeeHash.length, 66);
      assert.strictEqual(res.body.data.recordHash.length, 66);
    });

    it("POST /api/document/prepare should reject missing required fields", async () => {
      const res = await request(app)
        .post("/api/document/prepare")
        .send({ position: "Engineer" });

      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it("GET /api/document/:attestationId/decrypt should reject invalid attestation ID", async () => {
      const res = await request(app).get("/api/document/abc/decrypt");
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.message.includes("Invalid or missing attestation ID"));
    });

    it("GET /api/document/:attestationId/decrypt should reject missing verifier parameter", async () => {
      const res = await request(app).get("/api/document/1/decrypt");
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.message.includes("Verifier wallet address is required"));
    });
  });
});
