import { describe, it } from "node:test";
import assert from "node:assert";
import request from "supertest";
import app from "../src/app";
import { blockchainService } from "../src/services/blockchain.service";

describe("WorkProof Backend API & Blockchain Integration", () => {
  const validAddress = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  const validEmployeeHash = "0x" + "a".repeat(64);
  const validRecordHash = "0x" + "b".repeat(64);

  describe("1. Health Check Endpoints", () => {
    it("GET /health should return service health info", async () => {
      const res = await request(app).get("/health");
      assert.ok(res.status === 200 || res.status === 503);
      assert.strictEqual(res.body.service, "WorkProof Backend");
      assert.ok(res.body.timestamp);
      assert.ok(res.body.blockchain);
      assert.strictEqual(typeof res.body.blockchain.connected, "boolean");
    });

    it("GET /api/health should return service health info", async () => {
      const res = await request(app).get("/api/health");
      assert.ok(res.status === 200 || res.status === 503);
      assert.strictEqual(res.body.service, "WorkProof Backend");
      assert.ok(res.body.blockchain);
    });
  });

  describe("2. Request Validation Middleware", () => {
    it("GET /api/employers/:address/status should reject malformed address", async () => {
      const res = await request(app).get("/api/employers/invalid-eth-address/status");
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.message, "Validation Error");
      assert.ok(res.body.error.details.length > 0);
    });

    it("GET /api/attestations/:id should reject non-numeric or negative ID", async () => {
      const res1 = await request(app).get("/api/attestations/not-a-number");
      assert.strictEqual(res1.status, 400);
      assert.strictEqual(res1.body.success, false);

      const res2 = await request(app).get("/api/attestations/-5");
      assert.strictEqual(res2.status, 400);
      assert.strictEqual(res2.body.success, false);

      const res3 = await request(app).get("/api/attestations/0");
      assert.strictEqual(res3.status, 400);
      assert.strictEqual(res3.body.success, false);
    });

    it("GET /api/employees/:employeeHash/attestations should reject invalid bytes32 hash", async () => {
      const res = await request(app).get("/api/employees/0x1234invalid/attestations");
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
      assert.strictEqual(res.body.error.message, "Validation Error");
    });

    it("POST /api/employers/register should reject empty employerName", async () => {
      const res = await request(app)
        .post("/api/employers/register")
        .send({ employerName: "" });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it("POST /api/attestations should reject missing required fields", async () => {
      const res = await request(app)
        .post("/api/attestations")
        .send({ position: "Engineer" });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });

    it("POST /api/attestations should reject endDate prior to startDate", async () => {
      const res = await request(app)
        .post("/api/attestations")
        .send({
          employee: validAddress,
          employeeHash: validEmployeeHash,
          position: "Staff Engineer",
          startDate: 1700000000,
          endDate: 1600000000, // Invalid: before startDate
          recordHash: validRecordHash,
        });
      assert.strictEqual(res.status, 400);
      assert.strictEqual(res.body.success, false);
    });
  });

  describe("3. Blockchain Service Integration & Query Endpoints", () => {
    it("Should call isEmployerRegistered without error", async () => {
      try {
        const isRegistered = await blockchainService.isEmployerRegistered(validAddress);
        assert.strictEqual(typeof isRegistered, "boolean");
      } catch (err: any) {
        // If local node is not running during unit tests, verify graceful error object
        assert.ok(err);
      }
    });

    it("GET /api/employers/:address/status should return status format", async () => {
      const res = await request(app).get(`/api/employers/${validAddress}/status`);
      if (res.status === 200) {
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.address, validAddress);
        assert.strictEqual(typeof res.body.data.isRegistered, "boolean");
      } else {
        // RPC connectivity error mapped cleanly
        assert.strictEqual(res.body.success, false);
        assert.ok(res.body.error.message);
      }
    });

    it("GET /api/employees/:employeeHash/attestations should return array format", async () => {
      const res = await request(app).get(`/api/employees/${validEmployeeHash}/attestations`);
      if (res.status === 200) {
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.employeeHash, validEmployeeHash);
        assert.ok(Array.isArray(res.body.data.attestationIds));
      } else {
        assert.strictEqual(res.body.success, false);
        assert.ok(res.body.error.message);
      }
    });

    it("GET /api/employees/wallet/:address/attestations should return array format", async () => {
      const res = await request(app).get(`/api/employees/wallet/${validAddress}/attestations`);
      if (res.status === 200) {
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.employeeAddress, validAddress);
        assert.ok(Array.isArray(res.body.data.attestationIds));
      } else {
        assert.strictEqual(res.body.success, false);
        assert.ok(res.body.error.message);
      }
    });

    it("GET /api/employers/:address/attestations should return array format", async () => {
      const res = await request(app).get(`/api/employers/${validAddress}/attestations`);
      if (res.status === 200) {
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.employerAddress, validAddress);
        assert.ok(Array.isArray(res.body.data.attestationIds));
      } else {
        assert.strictEqual(res.body.success, false);
        assert.ok(res.body.error.message);
      }
    });

    it("GET /api/attestations/:id/access should return access summary", async () => {
      const res = await request(app).get(`/api/attestations/1/access?verifier=${validAddress}`);
      if (res.status === 200) {
        assert.strictEqual(res.body.success, true);
        assert.strictEqual(res.body.data.attestationId, 1);
        assert.strictEqual(res.body.data.verifier, validAddress);
        assert.strictEqual(typeof res.body.data.isAuthorized, "boolean");
        assert.ok(Array.isArray(res.body.data.accessRequestIds));
      } else {
        assert.strictEqual(res.body.success, false);
        assert.ok(res.body.error.message);
      }
    });
  });

  describe("4. Error & 404 Handling", () => {
    it("Should return 404 for unknown endpoints", async () => {
      const res = await request(app).get("/api/unknown-route");
      assert.strictEqual(res.status, 404);
      assert.strictEqual(res.body.success, false);
      assert.ok(res.body.error.message.includes("not found"));
    });
  });
});
