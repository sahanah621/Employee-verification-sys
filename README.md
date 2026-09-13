# WorkProof

> **Privacy-Preserving Blockchain-Based Employment Attestation and Verification Network**

WorkProof is a decentralized employment attestation and verification platform designed to allow employers to issue tamper-proof employment attestations on an Ethereum-compatible blockchain while ensuring employee privacy by storing encrypted supporting documents on IPFS.

---

## 1. What WorkProof Is

WorkProof provides a trustless, authoritative employment verification mechanism without relying on centralized databases or exposing sensitive personal data. 

- **Authoritative On-Chain State**: Attestations, cryptographic hashes, IPFS CIDs, and access-control permissions live on Ethereum.
- **Privacy-Preserving Storage**: Supporting documents (e.g., recommendation letters, certificates) are encrypted using **AES-256-GCM** before being pinned to **IPFS**.
- **User-Centric Consent**: Employees maintain complete control over who can access and decrypt their private supporting documents.
- **No Central Database**: Neither Postgres, MongoDB, nor Firebase is used as an authoritative data store. Ethereum is the single source of truth for attestation metadata and access authorization.

---

## 2. User Roles & Wallet Separation

All three portals interact with the **same Ethereum smart contract (`EmploymentRegistry.sol`)**, distinguished by wallet address and role-based permissions:

```text
                    Ethereum Network
                           │
                  EmploymentRegistry.sol
                           │
        ┌──────────────────┼──────────────────┐
        │                  │                  │
    Company A           Employee          Company B
    Issuer Portal        Portal           Verifier Portal
```

| Role | Portal | Wallet Responsibilities |
| :--- | :--- | :--- |
| **Company A (Employer/Issuer)** | Employer Portal | Registers employer identity, creates employment attestations, and revokes attestations (signed by Company A wallet). |
| **Employee** | Employee Portal | Views owned employment attestations, reviews verifier access requests, and approves or rejects document access (signed by Employee wallet). |
| **Company B (Verifier)** | Verification Portal | Checks on-chain attestation validity, queries employee attestations, and submits document access requests (signed by Company B wallet). |

### Important Wallet / Signer Architecture

* **Client-Side Signing (Production)**: In production, user actions (registration, attestation issuance/revocation, access requests, approvals/rejections) are **signed client-side by the user's wallet via MetaMask**.
* **Backend Coordination**: The backend provides read operations via an Ethereum RPC provider, cryptographic canonical hashing (SHA-256), and access verification. The backend **never** impersonates users and **never** exposes or accepts private keys over production API routes.
* **Development Signer (Testing Only)**: A local development private key configuration is provided strictly for automated integration tests and local deployment scripts.

---

## 3. Storage Boundary Principles

| Storage Layer | What Is Stored | What Is NEVER Stored |
| :--- | :--- | :--- |
| **Ethereum (`EmploymentRegistry.sol`)** | Attestation IDs, SHA-256 record hashes, SHA-256 document hashes, SHA-256 employee hashes, employer/employee wallet addresses, positions, start/end dates, IPFS CIDs, access approval states. | Plaintext documents, salaries, personal IDs (Aadhaar/passport), phone numbers, encryption keys. |
| **IPFS** | AES-256-GCM encrypted supporting documents. | Plaintext files, private keys. |
| **Backend / Secrets** | Ephemeral cryptographic processing, access validation. | Permanent authoritative attestation state (no database). |

---

## 4. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, ethers.js
- **Backend**: Node.js, Express, TypeScript, ethers.js v6, Multer, Zod
- **Blockchain**: Solidity (`^0.8.20`), Hardhat, TypeScript, ethers.js v6
- **Storage**: IPFS (Pinata pinning service)
- **Cryptography**: SHA-256 (Hashing), AES-256-GCM (Document Encryption), ECDSA (Ethereum Wallets)

---

## 5. Repository Structure

```text
workproof/
├── frontend/                     # React + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/           # UI components & layouts
│   │   ├── pages/                # Role-specific portal pages
│   │   ├── services/             # API and Blockchain client services
│   │   └── App.tsx               # App routing
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Express + TypeScript backend service
│   ├── src/
│   │   ├── config/               # Environment, Blockchain, and ABI configs
│   │   ├── controllers/          # Employer, Attestation, Employee, Access controllers
│   │   ├── middleware/           # Zod validation and contract error mapping
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # BlockchainService, Hashing, Encryption, IPFS services
│   │   ├── app.ts                # Express application setup
│   │   └── server.ts             # Server entry point
│   ├── test/                     # Backend API & integration test suite
│   ├── package.json
│   └── tsconfig.json
│
├── blockchain/                   # Hardhat Ethereum smart contract suite
│   ├── contracts/                # EmploymentRegistry.sol
│   ├── scripts/                  # deploy.ts
│   ├── test/                     # EmploymentRegistry.test.ts (33 test cases)
│   ├── hardhat.config.ts
│   └── tsconfig.json
│
├── docs/                         # Architecture specifications
│   └── architecture.md
├── .gitignore
├── README.md
└── package.json                  # Monorepo root scripts
```

---

## 6. Local Development Quickstart

### Step A: Install Dependencies

```bash
# In repository root:
npm run install:all
```

Or individually:

```bash
cd blockchain && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

---

### Step B: Start Local Blockchain & Deploy Contract

> [!NOTE]
> **Local Hardhat Network vs Public Testnet**:
> The local Hardhat development node runs locally on `http://127.0.0.1:8545` (Chain ID: `31337`). Restarting or resetting the local node resets blockchain state, requiring contract redeployment.

1. **Start the local Hardhat node**:
   ```bash
   cd blockchain
   npx hardhat node
   ```

2. **Deploy `EmploymentRegistry.sol` to local network** (in a second terminal):
   ```bash
   cd blockchain
   npx hardhat run scripts/deploy.ts --network localhost
   ```
   *Output will display the deployed contract address (e.g. `0x5FbDB2315678afecb367f032d93F642f64180aa3`).*

3. **Run Hardhat Test Suite**:
   ```bash
   cd blockchain
   npx hardhat test
   ```
   *(33 tests covering registration, attestation lifecycle, SHA-256 indexing, access requests, and authorization rules).*

---

### Step C: Configure & Run Backend Service

1. **Configure Environment Variables**:
   In `backend/.env`:
   ```env
   PORT=5000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173

   # Ethereum Blockchain Configuration
   ETH_RPC_URL=http://127.0.0.1:8545
   EMPLOYMENT_REGISTRY_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3

   # Development/Testing Private Key (Never used in production)
   BACKEND_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
   ```

2. **Run Backend Tests**:
   ```bash
   cd backend
   npm test
   ```

3. **Start Backend Server**:
   ```bash
   cd backend
   npm run dev
   ```
   *Backend runs on `http://localhost:5000`.*

---

## 7. Backend API Reference

### Health & Connectivity
* `GET /api/health` — Checks service health and Ethereum node/contract connectivity.

### Employer Endpoints
* `GET /api/employers/:address/status` — Checks if an Ethereum address is a registered employer issuer.
* `GET /api/employers/:address/profile` — Retrieves employer name and registration timestamp.
* `GET /api/employers/:address/attestations` — Retrieves all attestation IDs issued by an employer.
* `POST /api/employers/register` — Registers an employer identity on-chain.
  ```json
  { "employerName": "Google DeepMind Inc." }
  ```

### Attestation Endpoints
* `GET /api/attestations/:id` — Retrieves full on-chain attestation details by attestation ID.
* `POST /api/attestations` — Issues an employment attestation.
  ```json
  {
    "employee": "0x70997970C51812dc3A010C7d01b50e0d17dc79C8",
    "employeeHash": "0x5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8",
    "position": "Staff Systems Architect",
    "startDate": 1672531199,
    "endDate": 0,
    "recordHash": "0x4b227777d4dd1fc61c6f884f48641d02b4d121d3fd328cb08b5531fcacdabf8a",
    "documentHash": "0xef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d",
    "ipfsCID": "QmXoypizjW3WknFiJnKLwHCnL72vedxjQkDDP1mXWo6uco"
  }
  ```
* `POST /api/attestations/:id/revoke` — Revokes an attestation (only callable by the issuing employer).
* `GET /api/attestations/:id/access?verifier=0x...` — Checks if a verifier address is authorized and lists access requests.

### Employee Endpoints
* `GET /api/employees/:employeeHash/attestations` — Retrieves all attestation IDs by SHA-256 employee hash.
* `GET /api/employees/wallet/:address/attestations` — Retrieves all attestation IDs by employee wallet address.

### Document Access Request Endpoints
* `POST /api/attestations/:id/access-request` — Registered verifier submits an access request.
  ```json
  { "requestType": "BACKGROUND_CHECK_2026" }
  ```
* `GET /api/access-requests/:id` — Retrieves access request details and current status (`PENDING`, `APPROVED`, `REJECTED`).
* `POST /api/access-requests/:id/approve` — Employee approves access request (authorizes verifier).
* `POST /api/access-requests/:id/reject` — Employee rejects access request (denies authorization).
