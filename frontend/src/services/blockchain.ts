import { ethers } from "ethers";

export const CONTRACT_ADDRESS =
  import.meta.env.VITE_CONTRACT_ADDRESS ||
  "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const RPC_URL =
  import.meta.env.VITE_RPC_URL || "http://127.0.0.1:8545";

export const EXPECTED_CHAIN_ID = Number(
  import.meta.env.VITE_CHAIN_ID || 31337
);

export const EMPLOYMENT_REGISTRY_ABI = [
  // Events
  "event EmployerRegistered(address indexed employer, string employerName, uint256 timestamp)",
  "event AttestationCreated(uint256 indexed attestationId, bytes32 indexed employeeHash, address indexed employer, address employee, string position, bytes32 recordHash, bytes32 documentHash, string ipfsCID, uint256 timestamp)",
  "event AttestationRevoked(uint256 indexed attestationId, address indexed employer, uint256 timestamp)",
  "event AccessRequested(uint256 indexed requestId, uint256 indexed attestationId, address indexed verifier, address employee, string requestType, uint256 timestamp)",
  "event AccessGranted(uint256 indexed requestId, uint256 indexed attestationId, address indexed verifier, address employee, uint256 timestamp)",
  "event AccessRejected(uint256 indexed requestId, uint256 indexed attestationId, address indexed verifier, address employee, uint256 timestamp)",

  // Employer Registration
  "function registerEmployer(string calldata employerName) external",
  "function isEmployerRegistered(address employer) external view returns (bool)",
  "function employers(address) external view returns (address employerAddress, string employerName, bool isRegistered, uint256 registrationTimestamp)",

  // Attestation Management
  "function createAttestation(address employee, bytes32 employeeHash, string calldata position, uint256 startDate, uint256 endDate, bytes32 recordHash, bytes32 documentHash, string calldata ipfsCID) external returns (uint256)",
  "function revokeAttestation(uint256 attestationId) external",
  "function getAttestation(uint256 attestationId) external view returns (tuple(uint256 attestationId, bytes32 employeeHash, address employee, address employer, string position, uint256 startDate, uint256 endDate, uint8 status, bytes32 recordHash, bytes32 documentHash, string ipfsCID, uint256 issueTimestamp))",
  "function getEmployeeAttestations(bytes32 employeeHash) external view returns (uint256[])",
  "function getEmployeeAttestationsByWallet(address employee) external view returns (uint256[])",
  "function getEmployerAttestations(address employer) external view returns (uint256[])",

  // Access Requests
  "function requestDocumentAccess(uint256 attestationId, string calldata requestType) external returns (uint256)",
  "function approveDocumentAccess(uint256 requestId) external",
  "function rejectDocumentAccess(uint256 requestId) external",
  "function hasDocumentAccess(uint256 attestationId, address verifier) external view returns (bool)",
  "function getAccessRequest(uint256 requestId) external view returns (tuple(uint256 requestId, uint256 attestationId, address verifier, address employee, string requestType, uint8 status, uint256 timestamp, uint256 respondedAt))",
  "function getAttestationAccessRequests(uint256 attestationId) external view returns (uint256[])",
];

let fallbackProvider: ethers.JsonRpcProvider | null = null;

export function getFallbackProvider(): ethers.JsonRpcProvider {
  if (!fallbackProvider) {
    fallbackProvider = new ethers.JsonRpcProvider(RPC_URL, undefined, {
      staticNetwork: ethers.Network.from({ name: "hardhat", chainId: EXPECTED_CHAIN_ID }),
      batchMaxCount: 1,
    });
  }
  return fallbackProvider;
}

export function getReadOnlyContract(): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, EMPLOYMENT_REGISTRY_ABI, getFallbackProvider());
}

export function getContract(runner: ethers.ContractRunner): ethers.Contract {
  return new ethers.Contract(CONTRACT_ADDRESS, EMPLOYMENT_REGISTRY_ABI, runner);
}
