import { expect } from "chai";
import { ethers } from "hardhat";
import { createHash } from "crypto";
import { EmploymentRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

// Helper to compute SHA-256 hash as bytes32 hex string
function sha256Hash(data: string): string {
  return "0x" + createHash("sha256").update(data).digest("hex");
}

describe("EmploymentRegistry Smart Contract", function () {
  let registry: EmploymentRegistry;
  let deployer: HardhatEthersSigner;
  let employerA: HardhatEthersSigner;
  let employerB: HardhatEthersSigner;
  let employee1: HardhatEthersSigner;
  let employee2: HardhatEthersSigner;
  let verifierCompanyB: HardhatEthersSigner;
  let unauthorizedUser: HardhatEthersSigner;

  // Test data fixtures using SHA-256 hashes
  const sampleEmployeeHash = sha256Hash("employee-national-id-987654321");
  const sampleRecordHash = sha256Hash(
    JSON.stringify({
      position: "Senior Blockchain Engineer",
      department: "Engineering",
      employmentType: "FULL_TIME",
    })
  );
  const sampleDocHash = sha256Hash("EXPERIENCE_CERTIFICATE_ORIGINAL_PDF_BINARY_PAYLOAD");
  const sampleIpfsCID = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";

  beforeEach(async function () {
    [
      deployer,
      employerA,
      employerB,
      employee1,
      employee2,
      verifierCompanyB,
      unauthorizedUser,
    ] = await ethers.getSigners();

    const EmploymentRegistryFactory = await ethers.getContractFactory("EmploymentRegistry");
    registry = await EmploymentRegistryFactory.deploy();
    await registry.waitForDeployment();
  });

  describe("1. Deployment and Initialization", function () {
    it("Should deploy successfully with a valid address", async function () {
      const address = await registry.getAddress();
      expect(address).to.be.properAddress;
    });
  });

  describe("2. Employer Registration", function () {
    it("Should allow an employer to register successfully and emit EmployerRegistered event", async function () {
      const orgName = "Google DeepMind Inc.";

      const tx = await registry.connect(employerA).registerEmployer(orgName);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      // Verify event emission
      await expect(tx)
        .to.emit(registry, "EmployerRegistered")
        .withArgs(employerA.address, orgName, block!.timestamp);

      // Verify stored employer profile
      const profile = await registry.employers(employerA.address);
      expect(profile.employerAddress).to.equal(employerA.address);
      expect(profile.employerName).to.equal(orgName);
      expect(profile.isRegistered).to.equal(true);
      expect(profile.registrationTimestamp).to.equal(block!.timestamp);

      // Verify isEmployerRegistered check
      expect(await registry.isEmployerRegistered(employerA.address)).to.equal(true);
      expect(await registry.isEmployerRegistered(employerB.address)).to.equal(false);
    });

    it("Should reject duplicate registration from the same wallet", async function () {
      await registry.connect(employerA).registerEmployer("Acme Corporation");

      await expect(
        registry.connect(employerA).registerEmployer("Acme Corp Re-registration")
      ).to.be.revertedWith("Employer already registered");
    });

    it("Should reject registration with an empty organization name", async function () {
      await expect(
        registry.connect(employerA).registerEmployer("")
      ).to.be.revertedWith("Employer name cannot be empty");
    });
  });

  describe("3. Attestation Creation", function () {
    beforeEach(async function () {
      await registry.connect(employerA).registerEmployer("Company A Labs");
    });

    it("Should allow a registered employer to create an attestation and emit AttestationCreated event", async function () {
      const position = "Staff Systems Architect";
      const startDate = 1672531199; // 2023-01-01
      const endDate = 0; // ongoing active employment

      const tx = await registry
        .connect(employerA)
        .createAttestation(
          employee1.address,
          sampleEmployeeHash,
          position,
          startDate,
          endDate,
          sampleRecordHash,
          sampleDocHash,
          sampleIpfsCID
        );

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(registry, "AttestationCreated")
        .withArgs(
          1,
          sampleEmployeeHash,
          employerA.address,
          employee1.address,
          position,
          sampleRecordHash,
          sampleDocHash,
          sampleIpfsCID,
          block!.timestamp
        );

      // Retrieve and verify attestation fields
      const att = await registry.getAttestation(1);
      expect(att.attestationId).to.equal(1);
      expect(att.employeeHash).to.equal(sampleEmployeeHash);
      expect(att.employee).to.equal(employee1.address);
      expect(att.employer).to.equal(employerA.address);
      expect(att.position).to.equal(position);
      expect(att.startDate).to.equal(startDate);
      expect(att.endDate).to.equal(endDate);
      expect(att.status).to.equal(0); // EmploymentStatus.ACTIVE
      expect(att.recordHash).to.equal(sampleRecordHash);
      expect(att.documentHash).to.equal(sampleDocHash);
      expect(att.ipfsCID).to.equal(sampleIpfsCID);
      expect(att.issueTimestamp).to.equal(block!.timestamp);
    });

    it("Should mark attestation as COMPLETED if endDate is in the past", async function () {
      const pastStart = 1577836800; // 2020-01-01
      const pastEnd = 1640995200; // 2022-01-01

      await registry
        .connect(employerA)
        .createAttestation(
          employee1.address,
          sampleEmployeeHash,
          "Junior Developer",
          pastStart,
          pastEnd,
          sampleRecordHash,
          sampleDocHash,
          sampleIpfsCID
        );

      const att = await registry.getAttestation(1);
      expect(att.status).to.equal(1); // EmploymentStatus.COMPLETED
    });

    it("Should reject attestation creation by an unregistered wallet", async function () {
      await expect(
        registry
          .connect(unauthorizedUser)
          .createAttestation(
            employee1.address,
            sampleEmployeeHash,
            "Engineer",
            1672531199,
            0,
            sampleRecordHash,
            sampleDocHash,
            sampleIpfsCID
          )
      ).to.be.revertedWith("Caller is not a registered employer");
    });

    it("Should validate inputs when creating an attestation", async function () {
      // Invalid employee address (0x0)
      await expect(
        registry
          .connect(employerA)
          .createAttestation(
            ethers.ZeroAddress,
            sampleEmployeeHash,
            "Engineer",
            1672531199,
            0,
            sampleRecordHash,
            sampleDocHash,
            sampleIpfsCID
          )
      ).to.be.revertedWith("Invalid employee address");

      // Empty employeeHash
      await expect(
        registry
          .connect(employerA)
          .createAttestation(
            employee1.address,
            ethers.ZeroHash,
            "Engineer",
            1672531199,
            0,
            sampleRecordHash,
            sampleDocHash,
            sampleIpfsCID
          )
      ).to.be.revertedWith("Employee hash cannot be empty");

      // Empty position
      await expect(
        registry
          .connect(employerA)
          .createAttestation(
            employee1.address,
            sampleEmployeeHash,
            "",
            1672531199,
            0,
            sampleRecordHash,
            sampleDocHash,
            sampleIpfsCID
          )
      ).to.be.revertedWith("Position cannot be empty");

      // Empty recordHash
      await expect(
        registry
          .connect(employerA)
          .createAttestation(
            employee1.address,
            sampleEmployeeHash,
            "Engineer",
            1672531199,
            0,
            ethers.ZeroHash,
            sampleDocHash,
            sampleIpfsCID
          )
      ).to.be.revertedWith("Record hash cannot be empty");

      // Invalid start date (0)
      await expect(
        registry
          .connect(employerA)
          .createAttestation(
            employee1.address,
            sampleEmployeeHash,
            "Engineer",
            0,
            0,
            sampleRecordHash,
            sampleDocHash,
            sampleIpfsCID
          )
      ).to.be.revertedWith("Invalid start date");

      // End date before start date
      await expect(
        registry
          .connect(employerA)
          .createAttestation(
            employee1.address,
            sampleEmployeeHash,
            "Engineer",
            1672531199,
            1600000000,
            sampleRecordHash,
            sampleDocHash,
            sampleIpfsCID
          )
      ).to.be.revertedWith("End date must be greater than or equal to start date");
    });
  });

  describe("4. Attestation Retrieval & Indexing", function () {
    beforeEach(async function () {
      await registry.connect(employerA).registerEmployer("Employer A");
      await registry.connect(employerB).registerEmployer("Employer B");

      // Create two attestations for employee1 (different employers)
      await registry
        .connect(employerA)
        .createAttestation(
          employee1.address,
          sampleEmployeeHash,
          "Junior Dev",
          1600000000,
          1630000000,
          sampleRecordHash,
          sampleDocHash,
          sampleIpfsCID
        );

      await registry
        .connect(employerB)
        .createAttestation(
          employee1.address,
          sampleEmployeeHash,
          "Senior Dev",
          1640000000,
          0,
          sampleRecordHash,
          sampleDocHash,
          sampleIpfsCID
        );
    });

    it("Should retrieve an attestation by ID", async function () {
      const att = await registry.getAttestation(1);
      expect(att.attestationId).to.equal(1);
      expect(att.employer).to.equal(employerA.address);
      expect(att.position).to.equal("Junior Dev");
    });

    it("Should revert when retrieving a non-existent attestation ID", async function () {
      await expect(registry.getAttestation(999)).to.be.revertedWith(
        "Attestation does not exist"
      );
    });

    it("Should retrieve all attestation IDs by employee identifier hash", async function () {
      const attestations = await registry.getEmployeeAttestations(sampleEmployeeHash);
      expect(attestations.length).to.equal(2);
      expect(attestations[0]).to.equal(1);
      expect(attestations[1]).to.equal(2);
    });

    it("Should retrieve all attestation IDs by employee wallet address", async function () {
      const attestations = await registry.getEmployeeAttestationsByWallet(employee1.address);
      expect(attestations.length).to.equal(2);
      expect(attestations[0]).to.equal(1);
      expect(attestations[1]).to.equal(2);
    });

    it("Should retrieve all attestation IDs issued by an employer", async function () {
      const attestationsA = await registry.getEmployerAttestations(employerA.address);
      expect(attestationsA.length).to.equal(1);
      expect(attestationsA[0]).to.equal(1);

      const attestationsB = await registry.getEmployerAttestations(employerB.address);
      expect(attestationsB.length).to.equal(1);
      expect(attestationsB[0]).to.equal(2);
    });
  });

  describe("5. Attestation Revocation", function () {
    beforeEach(async function () {
      await registry.connect(employerA).registerEmployer("Employer A");
      await registry.connect(employerB).registerEmployer("Employer B");

      await registry
        .connect(employerA)
        .createAttestation(
          employee1.address,
          sampleEmployeeHash,
          "Lead Architect",
          1600000000,
          0,
          sampleRecordHash,
          sampleDocHash,
          sampleIpfsCID
        );
    });

    it("Should allow the original issuer to revoke its attestation and emit AttestationRevoked event", async function () {
      const tx = await registry.connect(employerA).revokeAttestation(1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(registry, "AttestationRevoked")
        .withArgs(1, employerA.address, block!.timestamp);

      // Verify status is changed to REVOKED (enum value 2)
      const att = await registry.getAttestation(1);
      expect(att.status).to.equal(2); // EmploymentStatus.REVOKED

      // Verify record is NOT deleted and original data persists
      expect(att.position).to.equal("Lead Architect");
      expect(att.employer).to.equal(employerA.address);
      expect(att.employee).to.equal(employee1.address);
    });

    it("Should reject revocation attempt by a non-issuer employer", async function () {
      await expect(
        registry.connect(employerB).revokeAttestation(1)
      ).to.be.revertedWith("Only issuer can revoke");
    });

    it("Should reject revocation attempt by unauthorized third party or employee", async function () {
      await expect(
        registry.connect(employee1).revokeAttestation(1)
      ).to.be.revertedWith("Only issuer can revoke");

      await expect(
        registry.connect(unauthorizedUser).revokeAttestation(1)
      ).to.be.revertedWith("Only issuer can revoke");
    });

    it("Should reject revocation of an already revoked attestation", async function () {
      await registry.connect(employerA).revokeAttestation(1);

      await expect(
        registry.connect(employerA).revokeAttestation(1)
      ).to.be.revertedWith("Attestation already revoked");
    });

    it("Should reject revocation of a non-existent attestation", async function () {
      await expect(
        registry.connect(employerA).revokeAttestation(999)
      ).to.be.revertedWith("Attestation does not exist");
    });
  });

  describe("6. Private Document Access Requests", function () {
    beforeEach(async function () {
      await registry.connect(employerA).registerEmployer("Employer A");
      await registry.connect(verifierCompanyB).registerEmployer("Company B Verifier Inc.");

      await registry
        .connect(employerA)
        .createAttestation(
          employee1.address,
          sampleEmployeeHash,
          "Staff Engineer",
          1600000000,
          0,
          sampleRecordHash,
          sampleDocHash,
          sampleIpfsCID
        );
    });

    it("A. Should allow a registered employer/verifier (Company B) to request access successfully and emit AccessRequested", async function () {
      const requestType = "BACKGROUND_CHECK_2026";
      const tx = await registry
        .connect(verifierCompanyB)
        .requestDocumentAccess(1, requestType);

      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(registry, "AccessRequested")
        .withArgs(
          1,
          1,
          verifierCompanyB.address,
          employee1.address,
          requestType,
          block!.timestamp
        );

      const req = await registry.getAccessRequest(1);
      expect(req.requestId).to.equal(1);
      expect(req.attestationId).to.equal(1);
      expect(req.verifier).to.equal(verifierCompanyB.address);
      expect(req.employee).to.equal(employee1.address);
      expect(req.requestType).to.equal(requestType);
      expect(req.status).to.equal(0); // RequestStatus.PENDING
      expect(req.timestamp).to.equal(block!.timestamp);
      expect(req.respondedAt).to.equal(0);

      // Verify request ID is indexed under the attestation
      const reqList = await registry.getAttestationAccessRequests(1);
      expect(reqList.length).to.equal(1);
      expect(reqList[0]).to.equal(1);
    });

    it("B. Should reject document access request by an unregistered wallet", async function () {
      await expect(
        registry
          .connect(unauthorizedUser)
          .requestDocumentAccess(1, "UNREGISTERED_CHECK")
      ).to.be.revertedWith("Caller is not a registered employer");
    });

    it("C. Should reject access request when employee requests access to their own document", async function () {
      // Even if employee registers as an employer, they cannot request access to their own document
      await registry.connect(employee1).registerEmployer("Employee Freelance LLC");

      await expect(
        registry.connect(employee1).requestDocumentAccess(1, "SELF_VERIFY")
      ).to.be.revertedWith("Employee cannot request access from themselves");
    });

    it("D. Should reject access request for a nonexistent attestation", async function () {
      await expect(
        registry.connect(verifierCompanyB).requestDocumentAccess(999, "VERIFY")
      ).to.be.revertedWith("Attestation does not exist");
    });

    it("E. Should reject access request if attestation has no supporting document", async function () {
      // Create attestation with empty IPFS CID
      await registry
        .connect(employerA)
        .createAttestation(
          employee1.address,
          sampleEmployeeHash,
          "Contractor",
          1600000000,
          0,
          sampleRecordHash,
          ethers.ZeroHash,
          ""
        );

      await expect(
        registry.connect(verifierCompanyB).requestDocumentAccess(2, "VERIFY")
      ).to.be.revertedWith("Attestation has no supporting document");
    });

    it("F. Should reject access request for a revoked attestation", async function () {
      await registry.connect(employerA).revokeAttestation(1);

      await expect(
        registry.connect(verifierCompanyB).requestDocumentAccess(1, "VERIFY")
      ).to.be.revertedWith("Cannot request access for revoked attestation");
    });
  });

  describe("7. Employee Access Authorization & Verification Flow", function () {
    beforeEach(async function () {
      await registry.connect(employerA).registerEmployer("Employer A");
      await registry.connect(verifierCompanyB).registerEmployer("Company B Verifier Inc.");

      await registry
        .connect(employerA)
        .createAttestation(
          employee1.address,
          sampleEmployeeHash,
          "Staff Engineer",
          1600000000,
          0,
          sampleRecordHash,
          sampleDocHash,
          sampleIpfsCID
        );

      // Registered verifier submits an access request (requestId = 1)
      await registry
        .connect(verifierCompanyB)
        .requestDocumentAccess(1, "PRE_EMPLOYMENT_SCREENING");
    });

    it("G. Approval flow: registered verifier requests -> employee approves -> verifier becomes authorized", async function () {
      // Initially, verifier does not have access
      expect(await registry.hasDocumentAccess(1, verifierCompanyB.address)).to.equal(false);

      const tx = await registry.connect(employee1).approveDocumentAccess(1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(registry, "AccessGranted")
        .withArgs(
          1,
          1,
          verifierCompanyB.address,
          employee1.address,
          block!.timestamp
        );

      // Verify request status is APPROVED
      const req = await registry.getAccessRequest(1);
      expect(req.status).to.equal(1); // RequestStatus.APPROVED
      expect(req.respondedAt).to.equal(block!.timestamp);

      // Verify hasDocumentAccess is now true for verifier
      expect(await registry.hasDocumentAccess(1, verifierCompanyB.address)).to.equal(true);
    });

    it("H. Rejection flow: registered verifier requests -> employee rejects -> verifier is not authorized", async function () {
      const tx = await registry.connect(employee1).rejectDocumentAccess(1);
      const receipt = await tx.wait();
      const block = await ethers.provider.getBlock(receipt!.blockNumber);

      await expect(tx)
        .to.emit(registry, "AccessRejected")
        .withArgs(
          1,
          1,
          verifierCompanyB.address,
          employee1.address,
          block!.timestamp
        );

      const req = await registry.getAccessRequest(1);
      expect(req.status).to.equal(2); // RequestStatus.REJECTED
      expect(req.respondedAt).to.equal(block!.timestamp);

      // Verifier does NOT have access
      expect(await registry.hasDocumentAccess(1, verifierCompanyB.address)).to.equal(false);
    });

    it("Should reject when the verifier attempts to approve its own request", async function () {
      await expect(
        registry.connect(verifierCompanyB).approveDocumentAccess(1)
      ).to.be.revertedWith("Only the attestation employee can approve access");
    });

    it("Should reject when a different employee attempts to approve or reject", async function () {
      await expect(
        registry.connect(employee2).approveDocumentAccess(1)
      ).to.be.revertedWith("Only the attestation employee can approve access");

      await expect(
        registry.connect(employee2).rejectDocumentAccess(1)
      ).to.be.revertedWith("Only the attestation employee can reject access");
    });

    it("Should reject when the issuing employer attempts to approve or reject access", async function () {
      await expect(
        registry.connect(employerA).approveDocumentAccess(1)
      ).to.be.revertedWith("Only the attestation employee can approve access");

      await expect(
        registry.connect(employerA).rejectDocumentAccess(1)
      ).to.be.revertedWith("Only the attestation employee can reject access");
    });

    it("Should reject approving or rejecting an already responded (non-pending) request", async function () {
      await registry.connect(employee1).approveDocumentAccess(1);

      // Attempt second approval
      await expect(
        registry.connect(employee1).approveDocumentAccess(1)
      ).to.be.revertedWith("Request is not pending");

      // Attempt rejection on approved request
      await expect(
        registry.connect(employee1).rejectDocumentAccess(1)
      ).to.be.revertedWith("Request is not pending");
    });

    it("Should reject approving or rejecting a non-existent request ID", async function () {
      await expect(
        registry.connect(employee1).approveDocumentAccess(999)
      ).to.be.revertedWith("Access request does not exist");

      await expect(
        registry.connect(employee1).rejectDocumentAccess(999)
      ).to.be.revertedWith("Access request does not exist");
    });

    it("Should invalidate access if the attestation is revoked after access was granted", async function () {
      // 1. Employee grants access
      await registry.connect(employee1).approveDocumentAccess(1);
      expect(await registry.hasDocumentAccess(1, verifierCompanyB.address)).to.equal(true);

      // 2. Issuer revokes the attestation
      await registry.connect(employerA).revokeAttestation(1);

      // 3. hasDocumentAccess MUST now return false
      expect(await registry.hasDocumentAccess(1, verifierCompanyB.address)).to.equal(false);
    });

    it("Should return false for hasDocumentAccess on non-existent attestation or unauthorized verifier", async function () {
      expect(await registry.hasDocumentAccess(999, verifierCompanyB.address)).to.equal(false);
      expect(await registry.hasDocumentAccess(1, unauthorizedUser.address)).to.equal(false);
    });
  });
});
