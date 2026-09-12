# WorkProof

> **Privacy-Preserving Blockchain-Based Employment Attestation and Verification Network**

WorkProof is a decentralized employment attestation and verification platform designed to allow employers to issue tamper-proof employment attestations on an Ethereum-compatible blockchain while ensuring employee privacy by storing encrypted supporting documents on IPFS.

---

## 1. What WorkProof Is

WorkProof provides a trustless, authoritative employment verification mechanism without relying on centralized databases or exposing sensitive personal data. 

- **Authoritative On-Chain State**: Attestations, cryptographic hashes, IPFS CIDs, and access-control permissions live on Ethereum.
- **Privacy-Preserving Storage**: Supporting documents (e.g., recommendation letters, certificates) are encrypted using **AES-256-GCM** before being pinned to **IPFS**.
- **User-Centric Consent**: Employees maintain complete control over who can access and decrypt their private supporting documents.

---

## 2. User Roles

All three portals interact with the **same Ethereum smart contract (`EmploymentRegistry.sol`)**, distinguished by wallet address and role-based permissions:

| Role | Portal | Responsibilities |
| :--- | :--- | :--- |
| **Company A (Employer/Issuer)** | Employer Portal | Registers employer identity, creates employment attestations, computes canonical document hashes, and uploads encrypted supporting documents to IPFS. |
| **Employee** | Employee Portal | Views owned employment attestations, reviews verifier access requests, and grants or revokes document access permissions on-chain. |
| **Company B (Verifier)** | Verification Portal | Checks on-chain attestation validity, verifies record integrity, requests access to private supporting documents, and views verified decrypted records upon employee approval. |

---

## 3. Architecture & Data Flow

```text
                 Ethereum Network
                       │
              EmploymentRegistry.sol
                       │
        ┌──────────────┼──────────────┐
        │              │              │
    Company A       Employee       Company B
    Employer         Portal        Verification
     Portal                         Portal
        │              │              │
        └──────────────┼──────────────┘
                       │
                  Node + Express
                    Backend
                  /          \
                 /            \
        Cryptography          IPFS (Pinata)
                             │
                    Encrypted Documents
```

### IPFS Document Encryption & Verification Flow

1. **Document Issuance**:
   $$\text{Original File} \xrightarrow{\text{SHA-256}} \text{documentHash}$$
   $$\text{Original File} \xrightarrow{\text{AES-256-GCM}} \text{Encrypted File} \xrightarrow{\text{IPFS}} \text{CID}$$
   $$\text{Store in Smart Contract: } (\text{attestationId}, \text{recordHash}, \text{documentHash}, \text{CID})$$

2. **Access Control & Integrity Check**:
   - Company B requests access $\rightarrow$ Employee approves on-chain.
   - Backend verifies on-chain authorization $\rightarrow$ Retrieves encrypted file via CID from IPFS.
   - Backend decrypts file $\rightarrow$ Calculates SHA-256 of decrypted file $\rightarrow$ Compares with on-chain `documentHash`.
   - Document access is granted only if hash verification passes.

### Storage Boundary Principles

| Storage Layer | What Is Stored | What Is NEVER Stored |
| :--- | :--- | :--- |
| **Ethereum (`EmploymentRegistry.sol`)** | Attestation IDs, hashes, employer addresses, positions, start/end dates, IPFS CIDs, document hashes, access approval states. | Plaintext documents, salaries, personal IDs (Aadhaar/passport), phone numbers, encryption keys. |
| **IPFS** | AES-256-GCM encrypted supporting documents. | Plaintext files, private keys. |
| **Backend / Secrets** | Ephemeral cryptographic processing, access validation. | Permanent authoritative attestation state (no database). |

---

## 4. Technology Stack

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, ethers.js
- **Backend**: Node.js, Express, TypeScript, ethers.js, Multer, Zod
- **Blockchain**: Solidity (`^0.8.20`), Hardhat, TypeScript, ethers.js
- **Storage**: IPFS (Pinata pinning service)
- **Cryptography**: SHA-256 (Hashing), AES-256-GCM (Document Encryption), ECDSA (Ethereum Wallets)

---

## 5. Repository Structure

```text
workproof/
├── frontend/                     # React + Vite + TypeScript web application
│   ├── src/
│   │   ├── components/           # UI components & layouts (Navbar, etc.)
│   │   ├── pages/                # Role-specific portal pages
│   │   ├── services/             # API and Blockchain client services
│   │   ├── hooks/                # React Web3 hooks (useWallet, useContract)
│   │   ├── types/                # Shared TypeScript domain types
│   │   ├── App.tsx               # App routing
│   │   └── main.tsx              # React entry point
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                      # Express + TypeScript service
│   ├── src/
│   │   ├── config/               # Environment, Blockchain, and IPFS configs
│   │   ├── controllers/          # Request handlers
│   │   ├── routes/               # API route definitions
│   │   ├── services/             # Blockchain, Hashing, Encryption, Signature, IPFS services
│   │   ├── utils/                # Canonicalization utilities
│   │   ├── middleware/           # Error handling middleware
│   │   ├── app.ts                # Express application setup
│   │   └── server.ts             # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── blockchain/                   # Hardhat development environment
│   ├── contracts/                # Solidity smart contracts (EmploymentRegistry.sol)
│   ├── scripts/                  # Deployment scripts
│   ├── test/                     # Smart contract test suites
│   ├── hardhat.config.ts
│   └── tsconfig.json
│
├── docs/                         # Architecture and technical specs
│   └── architecture.md
├── .gitignore
├── README.md
└── package.json                  # Monorepo root scripts
```

> **Current Implementation Status**: Initial project structure, TypeScript interfaces, router/controller skeletons, and smart contract skeleton are configured. Core cryptographic pipelines, wallet integrations, and contract implementations will be phased in step by step.

---

## 6. Installation

Install dependencies across all packages:

```bash
# From the repository root (workproof/):
npm run install:all
```

Or install in each package individually:

```bash
cd blockchain && npm install
cd ../backend && npm install
cd ../frontend && npm install
```

---

## 7. Running Blockchain Environment

To start a local Ethereum node and compile/test the smart contract:

```bash
cd blockchain

# Compile smart contracts
npm run compile

# Run tests
npm test

# Run a local Hardhat JSON-RPC node
npm run node

# Deploy to local network (in a separate terminal)
npm run deploy:local
```

---

## 8. Running Backend Service

```bash
cd backend

# Copy environment template
cp .env.example .env

# Run in development mode (with hot reloading)
npm run dev

# Build TypeScript to JavaScript
npm run build

# Run compiled production build
npm start
```

---

## 9. Running Frontend Application

```bash
cd frontend

# Copy environment template
cp .env.example .env

# Start Vite development server
npm run dev

# Build for production
npm run build
```

The frontend application will be accessible at `http://localhost:5173`.
