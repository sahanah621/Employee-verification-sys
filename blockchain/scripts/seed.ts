import { ethers } from "hardhat";
import * as crypto from "crypto";

function sha256(data: string | Buffer): string {
  return "0x" + crypto.createHash("sha256").update(data).digest("hex");
}

function canonicalize(obj: Record<string, any>): string {
  const sortedKeys = Object.keys(obj).sort();
  const sortedObj: Record<string, any> = {};
  for (const k of sortedKeys) {
    sortedObj[k] = obj[k];
  }
  return JSON.stringify(sortedObj);
}

async function main() {
  console.log("===============================================================");
  console.log("   🌱 WorkProof Local Blockchain Seeding Engine   ");
  console.log("===============================================================");

  const signers = await ethers.getSigners();
  const [employer1, employee1, verifier1, employee2] = signers;

  console.log("\n[1/5] Identifying Role Actors:");
  console.log(`  🏢 Employer #1 (Signer 0) : ${employer1.address}`);
  console.log(`  👤 Employee #1 (Signer 1) : ${employee1.address}`);
  console.log(`  🔍 Verifier #1 (Signer 2) : ${verifier1.address}`);
  console.log(`  👤 Employee #2 (Signer 3) : ${employee2.address}`);

  // 1. Deploy or connect to EmploymentRegistry
  const EmploymentRegistryFactory = await ethers.getContractFactory("EmploymentRegistry");
  let registry: any;

  const deployedAddress = process.env.EMPLOYMENT_REGISTRY_ADDRESS || "0x5FbDB2315678afecb367f032d93F642f64180aa3";
  const code = await ethers.provider.getCode(deployedAddress);

  if (code !== "0x" && code.length > 2) {
    console.log(`\n[2/5] Connecting to existing contract at: ${deployedAddress}`);
    registry = EmploymentRegistryFactory.attach(deployedAddress);
  } else {
    console.log(`\n[2/5] Deploying fresh EmploymentRegistry contract...`);
    registry = await EmploymentRegistryFactory.deploy();
    await registry.waitForDeployment();
    console.log(`  Contract deployed at: ${await registry.getAddress()}`);
  }

  // 2. Register Employers
  console.log("\n[3/5] Registering Employer Organizations:");
  const isEmp1Reg = await registry.isEmployerRegistered(employer1.address);
  if (!isEmp1Reg) {
    const tx = await registry.connect(employer1).registerEmployer("Google DeepMind Inc.");
    await tx.wait();
    console.log(`  ✔ Registered Employer 1: Google DeepMind Inc. (${employer1.address})`);
  } else {
    console.log(`  ℹ Employer 1 already registered: Google DeepMind Inc.`);
  }

  const isEmp2Reg = await registry.isEmployerRegistered(verifier1.address);
  if (!isEmp2Reg) {
    const tx = await registry.connect(verifier1).registerEmployer("Meta Platforms Global");
    await tx.wait();
    console.log(`  ✔ Registered Employer 2 (Verifier): Meta Platforms Global (${verifier1.address})`);
  } else {
    console.log(`  ℹ Employer 2 already registered: Meta Platforms Global`);
  }

  // 3. Issue Sample Attestations
  console.log("\n[4/5] Issuing Attestations & Anchoring Hashes on Ethereum:");

  // Attestation 1: Active Principal AI Architect for Employee 1 (Alice)
  const emp1Hash = sha256("alice.vance@deepmind.com");
  const doc1Content = "Official Experience Letter - Principal AI Systems Architect - Google DeepMind 2024-2026";
  const doc1Hash = sha256(doc1Content);
  const ipfs1Cid = "QmZtmD2qt8fJpq3CLDHcgDZngpXZCEQu55Kfm48Q06e78a";
  const record1 = {
    employee: employee1.address.toLowerCase(),
    position: "Principal AI Systems Architect",
    startDate: 1672531200, // Jan 1, 2023
    endDate: 0,
  };
  const record1Hash = sha256(canonicalize(record1));

  const txAtt1 = await registry.connect(employer1).createAttestation(
    employee1.address,
    emp1Hash,
    "Principal AI Systems Architect",
    1672531200,
    0,
    record1Hash,
    doc1Hash,
    ipfs1Cid
  );
  await txAtt1.wait();
  console.log(`  ✔ Attestation #1 Created: Principal AI Systems Architect (ACTIVE) -> Employee: ${employee1.address}`);

  // Attestation 2: Completed Senior Research Engineer for Employee 1 (Alice)
  const doc2Content = "Service Certificate - Senior Research Engineer - Google DeepMind 2021-2023";
  const doc2Hash = sha256(doc2Content);
  const ipfs2Cid = "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco";
  const record2 = {
    employee: employee1.address.toLowerCase(),
    position: "Senior Research Engineer",
    startDate: 1609459200, // Jan 1, 2021
    endDate: 1672531199,   // Dec 31, 2022
  };
  const record2Hash = sha256(canonicalize(record2));

  const txAtt2 = await registry.connect(employer1).createAttestation(
    employee1.address,
    emp1Hash,
    "Senior Research Engineer",
    1609459200,
    1672531199,
    record2Hash,
    doc2Hash,
    ipfs2Cid
  );
  await txAtt2.wait();
  console.log(`  ✔ Attestation #2 Created: Senior Research Engineer (COMPLETED) -> Employee: ${employee1.address}`);

  // Attestation 3: Revoked Attestation for Employee 2 (Bob)
  const emp2Hash = sha256("bob.dylan@external.com");
  const doc3Hash = sha256("Contractor Clearance Document");
  const record3 = {
    employee: employee2.address.toLowerCase(),
    position: "Security Systems Contractor",
    startDate: 1704067200,
    endDate: 1719792000,
  };
  const record3Hash = sha256(canonicalize(record3));

  const txAtt3 = await registry.connect(employer1).createAttestation(
    employee2.address,
    emp2Hash,
    "Security Systems Contractor",
    1704067200,
    1719792000,
    record3Hash,
    doc3Hash,
    "QmPlaceholderRevokedDocCID12345"
  );
  const rcpt3 = await txAtt3.wait();
  // Revoke Attestation #3
  const txRevoke = await registry.connect(employer1).revokeAttestation(3);
  await txRevoke.wait();
  console.log(`  ✔ Attestation #3 Created & Revoked: Security Systems Contractor (REVOKED) -> Employee: ${employee2.address}`);

  // 4. Create Access Requests
  console.log("\n[5/5] Creating Verifier Access Requests & Consent State:");

  // Request 1: Verifier requests access to Attestation #1, Employee PRE-APPROVES it
  const txReq1 = await registry.connect(verifier1).requestDocumentAccess(1, "EMPLOYMENT_VERIFICATION_2026");
  await txReq1.wait();
  console.log(`  ✔ Access Request #1 Submitted by Verifier (${verifier1.address}) for Attestation #1`);

  const txApprove = await registry.connect(employee1).approveDocumentAccess(1);
  await txApprove.wait();
  console.log(`  ✔ Access Request #1 APPROVED by Employee (${employee1.address}) -> Verifier is now AUTHORIZED!`);

  // Request 2: Verifier requests access to Attestation #2, Left in PENDING state
  const txReq2 = await registry.connect(verifier1).requestDocumentAccess(2, "BACKGROUND_CHECK_LEVEL_3");
  await txReq2.wait();
  console.log(`  ✔ Access Request #2 Submitted by Verifier (${verifier1.address}) for Attestation #2 -> Left in PENDING state`);

  console.log("\n===============================================================");
  console.log("   🎉 Local Seeding Completed Successfully!   ");
  console.log("===============================================================");
  console.log("\n📋 MetaMask Test Accounts Reference (Hardhat Node Default Keys):");
  console.log("---------------------------------------------------------------");
  console.log("🏢 Employer Portal Test Account (Signer 0):");
  console.log(`   Address     : ${employer1.address}`);
  console.log(`   Private Key : 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80`);
  console.log(`   Org Profile : Google DeepMind Inc.`);
  console.log("---------------------------------------------------------------");
  console.log("👤 Employee Portal Test Account (Signer 1):");
  console.log(`   Address     : ${employee1.address}`);
  console.log(`   Private Key : 0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`);
  console.log(`   Credentials : 2 Attestations (1 Active, 1 Completed)`);
  console.log(`   Pending Req : 1 Pending Request (Ready to Approve/Reject!)`);
  console.log("---------------------------------------------------------------");
  console.log("🔍 Verifier Portal Test Account (Signer 2):");
  console.log(`   Address     : ${verifier1.address}`);
  console.log(`   Private Key : 0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`);
  console.log(`   Org Profile : Meta Platforms Global`);
  console.log(`   Access State: Authorized for Attestation #1 (Ready to Decrypt & View!)`);
  console.log("===============================================================\n");
}

main().catch((err) => {
  console.error("Seeding failed with error:", err);
  process.exitCode = 1;
});
