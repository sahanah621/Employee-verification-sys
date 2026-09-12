# WorkProof Technical Architecture

## 1. System Overview

WorkProof provides privacy-preserving employment attestations using the Ethereum blockchain as the authoritative registry and IPFS as the storage network for encrypted supporting documents.

```text
+-------------------------------------------------------------------------+
|                        Ethereum Smart Contract                          |
|                       (EmploymentRegistry.sol)                          |
|                                                                         |
|  - Attestations (IDs, Hashes, Dates, Status, IPFS CIDs)                 |
|  - Role / Employer Registry                                             |
|  - Verifier Access Requests & Employee Access Permissions               |
+--------------------+-------------------------------+--------------------+
                     ^                               ^
                     |                               |
          +----------+----------+         +----------+----------+
          |  Company A (Issuer) |         | Company B (Verifier)|
          |  Employer Portal    |         | Verification Portal |
          +----------+----------+         +----------+----------+
                     |                               |
                     +---------------+---------------+
                                     |
                             +-------v-------+
                             | Employee      |
                             | Portal        |
                             +-------+-------+
                                     |
                                     v
                 +---------------------------------------+
                 |       Node.js / Express Backend       |
                 |                                       |
                 |  - AES-256-GCM Encryption/Decryption  |
                 |  - SHA-256 Document Hashing           |
                 |  - IPFS Pinning & Gateway Adapter     |
                 |  - Authorization Verification         |
                 +-------------------+-------------------+
                                     |
                                     v
                 +---------------------------------------+
                 |                 IPFS                  |
                 |      (Encrypted Supporting Files)     |
                 +---------------------------------------+
```

---

## 2. Cryptographic and Storage Boundary

### Ethereum (On-Chain)
Authoritative state stored on-chain:
- `attestationId` (bytes32): Unique identifier for the employment attestation.
- `employee` (address): Employee Ethereum wallet address.
- `employer` (address): Employer Ethereum wallet address.
- `recordHash` (bytes32): SHA-256 hash of canonicalized structured employment data.
- `documentHash` (bytes32): SHA-256 hash of the original unencrypted supporting document.
- `ipfsCID` (string): Content identifier of the AES-256-GCM encrypted document stored on IPFS.
- `startDate` / `endDate` (uint256): Employment timeline.
- `status` (enum): Active, Terminated, Revoked.
- `accessAuthorizations` (mapping): Tracks which verifier address is authorized by the employee to view supporting documents.

### IPFS (Decentralized File Storage)
- Stores only **AES-256-GCM encrypted** binary blobs.
- **Rule**: Possessing an IPFS CID does not grant access. The payload is unreadable without decryption key and authorization.

### Cryptography
- **AES-256-GCM**: Symmetric encryption providing confidentiality and authenticity tags for supporting documents.
- **SHA-256**: Deterministic integrity verification of records and documents.
- **ECDSA**: Wallet identity signing and transaction authorization.

---

## 3. Security Invariants

1. **No Central Database**: Neither Postgres, Mongo, nor Firebase is used as authoritative storage.
2. **No Plaintext Leaks**: Sensitive personal attributes (salary, Aadhaar/passport, phone numbers) are never stored on public blockchains or in plaintext on IPFS.
3. **No Keys On-Chain**: Encryption keys are strictly forbidden from being stored in smart contracts, frontend bundles, or public networks.
4. **Independent Verifiability**: Any verifier can check on-chain attestation status directly against the smart contract.
