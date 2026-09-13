import { ethers } from "ethers";
import {
  getProvider,
  getDevSigner,
  getEmploymentRegistryContract,
  CONTRACT_ADDRESS,
} from "../config/blockchain";

export enum EmploymentStatus {
  ACTIVE = 0,
  COMPLETED = 1,
  REVOKED = 2,
}

export enum RequestStatus {
  PENDING = 0,
  APPROVED = 1,
  REJECTED = 2,
}

export interface EmployerProfile {
  employerAddress: string;
  employerName: string;
  isRegistered: boolean;
  registrationTimestamp: number;
}

export interface AttestationResponse {
  attestationId: number;
  employeeHash: string;
  employee: string;
  employer: string;
  position: string;
  startDate: number;
  endDate: number;
  status: EmploymentStatus;
  statusLabel: string;
  recordHash: string;
  documentHash: string;
  ipfsCID: string;
  issueTimestamp: number;
}

export interface AccessRequestResponse {
  requestId: number;
  attestationId: number;
  verifier: string;
  employee: string;
  requestType: string;
  status: RequestStatus;
  statusLabel: string;
  timestamp: number;
  respondedAt: number;
}

export interface CreateAttestationParams {
  employee: string;
  employeeHash: string;
  position: string;
  startDate: number;
  endDate?: number;
  recordHash: string;
  documentHash?: string;
  ipfsCID?: string;
}

export interface TransactionResult {
  transactionHash: string;
  blockNumber: number;
  from: string;
  to: string;
  gasUsed: string;
  attestationId?: number;
  requestId?: number;
}

const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  [EmploymentStatus.ACTIVE]: "ACTIVE",
  [EmploymentStatus.COMPLETED]: "COMPLETED",
  [EmploymentStatus.REVOKED]: "REVOKED",
};

const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: "PENDING",
  [RequestStatus.APPROVED]: "APPROVED",
  [RequestStatus.REJECTED]: "REJECTED",
};

/**
 * Service for interacting with the EmploymentRegistry smart contract on Ethereum.
 * Read operations execute directly against the RPC provider with no private key required.
 * Transaction operations accept an explicitly provided dev/test signer key for automated testing.
 */
export class BlockchainService {
  private getReadOnlyContract(): ethers.Contract {
    return getEmploymentRegistryContract(getProvider());
  }

  private getWriteContract(privateKey?: string): { contract: ethers.Contract; signer: ethers.Wallet } {
    const signer = getDevSigner(privateKey);
    const contract = getEmploymentRegistryContract(signer);
    return { contract, signer };
  }

  // ==========================================
  // READ OPERATIONS (Provider-based)
  // ==========================================

  /**
   * Health check for Ethereum RPC connectivity and contract presence.
   */
  async checkHealth(): Promise<{
    connected: boolean;
    blockNumber?: number;
    network?: string;
    contractAddress: string;
    error?: string;
  }> {
    try {
      const provider = getProvider();
      const [blockNumber, network, code] = await Promise.all([
        provider.getBlockNumber(),
        provider.getNetwork(),
        provider.getCode(CONTRACT_ADDRESS),
      ]);

      const contractDeployed = code !== "0x" && code.length > 2;

      return {
        connected: true,
        blockNumber,
        network: `${network.name} (Chain ID: ${network.chainId})`,
        contractAddress: CONTRACT_ADDRESS,
        ...(contractDeployed ? {} : { error: "No contract bytecode found at configured address" }),
      };
    } catch (err: any) {
      return {
        connected: false,
        contractAddress: CONTRACT_ADDRESS,
        error: err.message || "Failed to connect to Ethereum provider",
      };
    }
  }

  /**
   * Check if a wallet address is a registered employer issuer.
   */
  async isEmployerRegistered(employerAddress: string): Promise<boolean> {
    const contract = this.getReadOnlyContract();
    return await contract.isEmployerRegistered(employerAddress);
  }

  /**
   * Get an employer's registered profile.
   */
  async getEmployerProfile(employerAddress: string): Promise<EmployerProfile> {
    const contract = this.getReadOnlyContract();
    const profile = await contract.employers(employerAddress);
    return {
      employerAddress: profile.employerAddress,
      employerName: profile.employerName,
      isRegistered: profile.isRegistered,
      registrationTimestamp: Number(profile.registrationTimestamp),
    };
  }

  /**
   * Retrieve an employment attestation by its unique on-chain ID.
   */
  async getAttestation(attestationId: number | string): Promise<AttestationResponse> {
    const contract = this.getReadOnlyContract();
    const att = await contract.getAttestation(BigInt(attestationId));
    const statusNumber = Number(att.status) as EmploymentStatus;

    return {
      attestationId: Number(att.attestationId),
      employeeHash: att.employeeHash,
      employee: att.employee,
      employer: att.employer,
      position: att.position,
      startDate: Number(att.startDate),
      endDate: Number(att.endDate),
      status: statusNumber,
      statusLabel: EMPLOYMENT_STATUS_LABELS[statusNumber] || "UNKNOWN",
      recordHash: att.recordHash,
      documentHash: att.documentHash,
      ipfsCID: att.ipfsCID,
      issueTimestamp: Number(att.issueTimestamp),
    };
  }

  /**
   * Retrieve all attestation IDs for an employee by SHA-256 identifier hash.
   */
  async getEmployeeAttestations(employeeHash: string): Promise<number[]> {
    const contract = this.getReadOnlyContract();
    const ids = await contract.getEmployeeAttestations(employeeHash);
    return ids.map((id: bigint) => Number(id));
  }

  /**
   * Retrieve all attestation IDs for an employee by Ethereum wallet address.
   */
  async getEmployeeAttestationsByWallet(employeeAddress: string): Promise<number[]> {
    const contract = this.getReadOnlyContract();
    const ids = await contract.getEmployeeAttestationsByWallet(employeeAddress);
    return ids.map((id: bigint) => Number(id));
  }

  /**
   * Retrieve all attestation IDs issued by an employer.
   */
  async getEmployerAttestations(employerAddress: string): Promise<number[]> {
    const contract = this.getReadOnlyContract();
    const ids = await contract.getEmployerAttestations(employerAddress);
    return ids.map((id: bigint) => Number(id));
  }

  /**
   * Check whether a verifier currently has authorized access to an attestation's private document.
   */
  async hasDocumentAccess(
    attestationId: number | string,
    verifierAddress: string
  ): Promise<boolean> {
    const contract = this.getReadOnlyContract();
    return await contract.hasDocumentAccess(BigInt(attestationId), verifierAddress);
  }

  /**
   * Retrieve details of a document access request by request ID.
   */
  async getAccessRequest(requestId: number | string): Promise<AccessRequestResponse> {
    const contract = this.getReadOnlyContract();
    const req = await contract.getAccessRequest(BigInt(requestId));
    const statusNumber = Number(req.status) as RequestStatus;

    return {
      requestId: Number(req.requestId),
      attestationId: Number(req.attestationId),
      verifier: req.verifier,
      employee: req.employee,
      requestType: req.requestType,
      status: statusNumber,
      statusLabel: REQUEST_STATUS_LABELS[statusNumber] || "UNKNOWN",
      timestamp: Number(req.timestamp),
      respondedAt: Number(req.respondedAt),
    };
  }

  /**
   * Retrieve all access request IDs submitted for a given attestation ID.
   */
  async getAttestationAccessRequests(attestationId: number | string): Promise<number[]> {
    const contract = this.getReadOnlyContract();
    const ids = await contract.getAttestationAccessRequests(BigInt(attestationId));
    return ids.map((id: bigint) => Number(id));
  }

  // ==========================================
  // TRANSACTION OPERATIONS (Test/Dev Signer)
  // ==========================================

  /**
   * Registers an employer on the blockchain.
   * NOTE: For automated tests / development scripts. Production is signed via MetaMask.
   */
  async registerEmployer(
    employerName: string,
    signerPrivateKey?: string
  ): Promise<TransactionResult> {
    const { contract, signer } = this.getWriteContract(signerPrivateKey);
    const tx = await contract.registerEmployer(employerName);
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: signer.address,
      to: CONTRACT_ADDRESS,
      gasUsed: receipt.gasUsed.toString(),
    };
  }

  /**
   * Creates an employment attestation on the blockchain.
   * NOTE: For automated tests / development scripts. Production is signed via MetaMask.
   */
  async createAttestation(
    params: CreateAttestationParams,
    signerPrivateKey?: string
  ): Promise<TransactionResult> {
    const { contract, signer } = this.getWriteContract(signerPrivateKey);
    const tx = await contract.createAttestation(
      params.employee,
      params.employeeHash,
      params.position,
      BigInt(params.startDate),
      BigInt(params.endDate || 0),
      params.recordHash,
      params.documentHash || ethers.ZeroHash,
      params.ipfsCID || ""
    );
    const receipt = await tx.wait();

    // Parse emitted AttestationCreated event to extract attestationId
    let attestationId: number | undefined;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "AttestationCreated") {
          attestationId = Number(parsed.args.attestationId);
          break;
        }
      } catch {
        // Not a log from this contract interface
      }
    }

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: signer.address,
      to: CONTRACT_ADDRESS,
      gasUsed: receipt.gasUsed.toString(),
      attestationId,
    };
  }

  /**
   * Revokes an attestation.
   * NOTE: For automated tests / development scripts. Production is signed via MetaMask.
   */
  async revokeAttestation(
    attestationId: number | string,
    signerPrivateKey?: string
  ): Promise<TransactionResult> {
    const { contract, signer } = this.getWriteContract(signerPrivateKey);
    const tx = await contract.revokeAttestation(BigInt(attestationId));
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: signer.address,
      to: CONTRACT_ADDRESS,
      gasUsed: receipt.gasUsed.toString(),
      attestationId: Number(attestationId),
    };
  }

  /**
   * Requests access to a private supporting document.
   * NOTE: For automated tests / development scripts. Production is signed via MetaMask.
   */
  async requestDocumentAccess(
    attestationId: number | string,
    requestType: string,
    signerPrivateKey?: string
  ): Promise<TransactionResult> {
    const { contract, signer } = this.getWriteContract(signerPrivateKey);
    const tx = await contract.requestDocumentAccess(BigInt(attestationId), requestType);
    const receipt = await tx.wait();

    let requestId: number | undefined;
    for (const log of receipt.logs) {
      try {
        const parsed = contract.interface.parseLog(log);
        if (parsed && parsed.name === "AccessRequested") {
          requestId = Number(parsed.args.requestId);
          break;
        }
      } catch {
        // Not an event matching this interface
      }
    }

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: signer.address,
      to: CONTRACT_ADDRESS,
      gasUsed: receipt.gasUsed.toString(),
      requestId,
    };
  }

  /**
   * Approves a document access request.
   * NOTE: For automated tests / development scripts. Production is signed via MetaMask.
   */
  async approveDocumentAccess(
    requestId: number | string,
    signerPrivateKey?: string
  ): Promise<TransactionResult> {
    const { contract, signer } = this.getWriteContract(signerPrivateKey);
    const tx = await contract.approveDocumentAccess(BigInt(requestId));
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: signer.address,
      to: CONTRACT_ADDRESS,
      gasUsed: receipt.gasUsed.toString(),
      requestId: Number(requestId),
    };
  }

  /**
   * Rejects a document access request.
   * NOTE: For automated tests / development scripts. Production is signed via MetaMask.
   */
  async rejectDocumentAccess(
    requestId: number | string,
    signerPrivateKey?: string
  ): Promise<TransactionResult> {
    const { contract, signer } = this.getWriteContract(signerPrivateKey);
    const tx = await contract.rejectDocumentAccess(BigInt(requestId));
    const receipt = await tx.wait();

    return {
      transactionHash: receipt.hash,
      blockNumber: receipt.blockNumber,
      from: signer.address,
      to: CONTRACT_ADDRESS,
      gasUsed: receipt.gasUsed.toString(),
      requestId: Number(requestId),
    };
  }
}

export const blockchainService = new BlockchainService();
