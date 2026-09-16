# WorkProof Interactive Multi-Role Demo Guide

This guide walks you through setting up and running the full **WorkProof** decentralized employment verification platform locally on your machine with MetaMask.

---

## 1. Quickstart: Launching the Platform

You will need 4 terminal windows open from the repository root:

### Terminal 1: Start Local Hardhat Blockchain Node
```bash
npm run dev:blockchain
```
*Starts local Ethereum node on `http://127.0.0.1:8545` (Chain ID: `31337`).*

---

### Terminal 2: Deploy Contracts & Seed Realistic Demo State
```bash
npm run seed:blockchain
```
*This command automatically:*
1. Deploys `EmploymentRegistry.sol` to `0x5FbDB2315678afecb367f032d93F642f64180aa3`.
2. Registers **Google DeepMind Inc.** (Signer 0) and **Meta Platforms Global** (Signer 2) on-chain.
3. Issues **2 authentic employment attestations** (Active & Completed) for Employee Alice (Signer 1) with AES-256-GCM encrypted supporting documents.
4. Issues & revokes a 3rd attestation for contractor Bob (Signer 3).
5. Submits and pre-approves an access request from Verifier (Signer 2) for Attestation #1, enabling immediate document decryption testing.
6. Submits a second access request for Attestation #2 in `PENDING` status for Employee approval testing.

---

### Terminal 3: Start Backend Cryptographic & Relayer Service
```bash
npm run dev:backend
```
*Backend runs on `http://localhost:5000` handling Multer uploads, SHA-256 hashing, AES-256-GCM encryption, and access-gated decryption.*

---

### Terminal 4: Start React Web3 Application
```bash
npm run dev:frontend
```
*Frontend runs on `http://localhost:5173`.*

---

## 2. MetaMask Wallet Configuration

To experience all 3 roles, import the following local Hardhat test accounts into MetaMask:

### Network Settings (Localhost):
- **Network Name**: `Hardhat Localhost`
- **RPC URL**: `http://127.0.0.1:8545`
- **Chain ID**: `31337`
- **Currency Symbol**: `ETH`

### Test Accounts & Private Keys:

| Role | Name | Wallet Address | Private Key |
| :--- | :--- | :--- | :--- |
| **Employer** | Google DeepMind Inc. | `0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266` | `0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80` |
| **Employee** | Alice Vance | `0x70997970C51812dc3A010C7d01b50e0d17dc79C8` | `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d` |
| **Verifier** | Meta Background Checks | `0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC` | `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a` |

---

## 3. Interactive Walkthrough

### Scenario A: Employer Portal (Account 0)
1. Open `http://localhost:5173` and connect **Account 0** in MetaMask.
2. Navigate to **Employer Portal** (`/employer`):
   - Notice the green badge indicating **Google DeepMind Inc.** is registered.
   - Inspect the metrics dashboard: Total Issued (3), Active (1), Completed (1), Revoked (1).
   - Review the list of issued attestations with live on-chain status pills.
3. Click **Issue New Attestation** (`/employer/create`):
   - Enter Employee Address: `0x70997970C51812dc3A010C7d01b50e0d17dc79C8`
   - Position: `Senior Quantum AI Researcher`
   - Select Start Date and attach any sample PDF or image file.
   - Click **Issue Attestation on Ethereum**.
   - Watch the multi-step pipeline: file upload & AES-256-GCM encryption -> canonical hashing -> MetaMask transaction signing -> on-chain confirmation!

---

### Scenario B: Public Verifier Portal (Account 2 or Unconnected)
1. Navigate to **Verifier Portal** (`/verification`).
2. Search for **Attestation ID**: `1`.
3. Notice that **even before connecting a wallet**, on-chain validity, organization name (Google DeepMind), dates, and cryptographic hashes are verifiable via Ethereum RPC!
4. Connect **Account 2 (Verifier)** in MetaMask:
   - Notice the green banner: **Authorized Document Access Granted** (pre-approved by Alice during seeding).
   - Click **Decrypt & View Supporting Document**.
   - Sign the challenge message in MetaMask (`WorkProof Document Access: Attestation 1 at ...`).
   - The original unencrypted document opens in an interactive modal with verified SHA-256 hash match!
5. Now search for **Attestation ID**: `2`:
   - Notice the document is **locked**.
   - Select request purpose (e.g. `BACKGROUND_CHECK_LEVEL_3`) and click **Request Access via MetaMask**.
   - Confirm transaction to anchor the request on Ethereum.

---

### Scenario C: Employee Portal & Consent Management (Account 1)
1. Switch MetaMask to **Account 1 (Alice)**.
2. Navigate to **Employee Portal** (`/employee`):
   - View all career credentials anchored to Alice's wallet address.
   - Notice the badge displaying **1 Pending Access Request**.
3. Click **Manage Access Requests** (`/employee/requests`):
   - View the pending request from **Meta Platforms Global** for Attestation #2.
   - Click **Approve Access** (or **Reject Access**).
   - Sign the on-chain transaction via MetaMask.
4. Switch back to **Account 2 (Verifier)**:
   - Return to `/verification`, search `2`, and observe that document access is now **instantly authorized**!

---

### Scenario D: Revocation Cascade Test
1. Switch to **Account 0 (Employer)** on `/employer`.
2. Find Attestation #1 and click **Revoke**. Confirm the transaction on MetaMask.
3. Switch back to **Account 2 (Verifier)** on `/verification` and search for `1`:
   - Notice the prominent red warning banner: **Attestation Revoked by Issuer**.
   - Any attempt to decrypt is strictly blocked on-chain and rejected with `403 Forbidden`.

---

## 4. Technical Architecture Recap

- **Authoritative Single Source of Truth**: Ethereum smart contract (`EmploymentRegistry.sol`).
- **Privacy-Preserving Storage**: AES-256-GCM encrypted supporting documents on IPFS.
- **Stateless Key Derivation**: HKDF (RFC 5869) combining `MASTER_ENCRYPTION_KEY` and on-chain `documentHash`. Zero central database required.
- **Cryptographic Access Gating**: ECDSA wallet signatures with replay-prevention challenge timeouts.
