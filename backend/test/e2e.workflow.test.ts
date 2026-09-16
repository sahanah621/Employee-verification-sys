import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";
import { ethers } from "ethers";
import app from "../src/app";
import { blockchainService } from "../src/services/blockchain.service";
import { hashingService } from "../src/services/hashing.service";
import { signatureService } from "../src/services/signature.service";

describe("WorkProof Phase 5: End-to-End Multi-Party Protocol Verification", () => {
  // Setup isolated wallet identities for each role
  const employerWallet = ethers.Wallet.createRandom();
  const employeeWallet = ethers.Wallet.createRandom();
  const verifierWallet = ethers.Wallet.createRandom();

  const testDocumentContent = "CONFIDENTIAL EMPLOYMENT VERIFICATION: Staff Distributed Systems Architect 2024-2026";
  const testDocBuffer = Buffer.from(testDocumentContent, "utf-8");

  it("1. Health Check: Confirms Backend and Blockchain Service Connectivity", async () => {
    const res = await request(app).get("/api/health");
    assert.ok(res.status === 200 || res.status === 503);
    assert.strictEqual(res.body.service, "WorkProof Backend");
    assert.strictEqual(typeof res.body.blockchain.connected, "boolean");
  });

  it("2. Document Upload: Encrypts with AES-256-GCM and pins to IPFS", async () => {
    const res = await request(app)
      .post("/api/document/upload")
      .attach("document", testDocBuffer, {
        filename: "experience_attestation.txt",
        contentType: "text/plain",
      });

    assert.strictEqual(res.status, 201);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.documentHash);
    assert.ok(res.body.data.ipfsCID);
    assert.strictEqual(res.body.data.documentHash, hashingService.hashBuffer(testDocBuffer, true));
  });

  it("3. Attestation Preparation: Canonicalizes structured record to deterministic SHA-256", async () => {
    const res = await request(app)
      .post("/api/document/prepare")
      .send({
        employee: employeeWallet.address,
        employeeIdOrEmail: "emp-e2e-999@deepmind.com",
        position: "Staff Distributed Systems Architect",
        startDate: 1672531200,
        endDate: 0,
      });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.employeeHash.length, 66);
    assert.strictEqual(res.body.data.recordHash.length, 66);
  });

  it("4. ECDSA Challenge Verification: Verifies Verifier signature with timestamp replay protection", async () => {
    const timestamp = Math.floor(Date.now() / 1000);
    const challenge = signatureService.buildAccessChallenge(1, timestamp);
    const validSig = await verifierWallet.signMessage(challenge);

    // Valid signature verification
    const verification = signatureService.verifyAccessRequest(
      1,
      verifierWallet.address,
      validSig,
      timestamp,
      300
    );
    assert.strictEqual(verification.valid, true);

    // Replay attack simulation (old timestamp > 300s)
    const oldTimestamp = timestamp - 350;
    const oldSig = await verifierWallet.signMessage(signatureService.buildAccessChallenge(1, oldTimestamp));
    const replayCheck = signatureService.verifyAccessRequest(
      1,
      verifierWallet.address,
      oldSig,
      oldTimestamp,
      300
    );
    assert.strictEqual(replayCheck.valid, false);
    assert.ok(replayCheck.error?.includes("expired or invalid timestamp"));

    // Impersonation attack simulation (signed by a different wallet)
    const impostorWallet = ethers.Wallet.createRandom();
    const fakeSig = await impostorWallet.signMessage(challenge);
    const impersonationCheck = signatureService.verifyAccessRequest(
      1,
      verifierWallet.address,
      fakeSig,
      timestamp,
      300
    );
    assert.strictEqual(impersonationCheck.valid, false);
    assert.ok(impersonationCheck.error?.includes("Invalid cryptographic signature"));
  });

  it("5. Access Gating: Rejects unauthorized verifier decryption attempts", async () => {
    // When requesting decryption for an unregistered/unauthorized attestation
    const res = await request(app).get(
      `/api/document/99999/decrypt?verifier=${verifierWallet.address}`
    );

    // Rejection expected: either 404 (attestation does not exist) or 503 (offline node) or 403 (unauthorized)
    assert.ok([400, 403, 404, 500, 503].includes(res.status));
    assert.strictEqual(res.body.success, false);
  });

  it("6. Live Node Full Lifecycle Simulation (when local Hardhat node is running)", async () => {
    const health = await blockchainService.checkHealth();
    if (!health.connected) {
      console.log("    ℹ Local Ethereum node offline: Skipping live blockchain state mutations.");
      return;
    }

    console.log("    ✔ Local Ethereum node connected: Running live smart contract multi-party test.");

    // Signers from Hardhat node
    const devKey = "0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80";
    const employerAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";

    // A. Check or register employer
    const isReg = await blockchainService.isEmployerRegistered(employerAddress);
    if (!isReg) {
      await blockchainService.registerEmployer("E2E Test Enterprise Inc.", devKey);
    }

    // B. Issue attestation
    const docUpload = await request(app)
      .post("/api/document/upload")
      .attach("document", testDocBuffer, "test-credential.pdf");

    const attRes = await blockchainService.createAttestation(
      {
        employee: employeeWallet.address,
        employeeHash: hashingService.hashString("e2e-employee-identity"),
        position: "Principal Cloud Engineer",
        startDate: 1672531200,
        endDate: 0,
        recordHash: hashingService.hashRecord({ role: "Principal Cloud Engineer", start: 1672531200 }),
        documentHash: docUpload.body.data.documentHash,
        ipfsCID: docUpload.body.data.ipfsCID,
      },
      devKey
    );

    assert.ok(attRes.attestationId !== undefined && attRes.attestationId > 0);
    const attId: number = attRes.attestationId as number;

    // C. Retrieve attestation on-chain
    const attestation = await blockchainService.getAttestation(attId);
    assert.strictEqual(attestation.attestationId, attId);
    assert.strictEqual(attestation.position, "Principal Cloud Engineer");
    assert.strictEqual(attestation.status, 0); // ACTIVE

    // D. Check document access - Verifier should NOT have access initially
    const hasAccessInitial = await blockchainService.hasDocumentAccess(attId, verifierWallet.address);
    assert.strictEqual(hasAccessInitial, false);
  });
});
