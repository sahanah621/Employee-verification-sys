import { ethers } from "ethers";

export const CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS || "";

// ABI placeholder for EmploymentRegistry contract functions
export const EMPLOYMENT_REGISTRY_ABI = [
  "function registerEmployer(string calldata organizationName) external",
  "function createAttestation(address employee, string calldata position, uint256 startDate, uint256 endDate, bytes32 recordHash, bytes32 documentHash, string calldata ipfsCID) external returns (bytes32)",
  "function revokeAttestation(bytes32 attestationId) external",
  "function getAttestation(bytes32 attestationId) external view returns (tuple(bytes32 attestationId, address employer, address employee, string position, uint256 startDate, uint256 endDate, uint8 status, bytes32 recordHash, bytes32 documentHash, string ipfsCID, uint256 createdAt, bool isRevoked))",
  "function getEmployeeAttestations(address employee) external view returns (bytes32[])",
  "function requestDocumentAccess(bytes32 attestationId) external returns (bytes32)",
  "function approveAccess(bytes32 requestId) external",
  "function rejectAccess(bytes32 requestId) external",
  "function isVerifierAuthorized(bytes32 attestationId, address verifier) external view returns (bool)",
  "function employers(address) external view returns (address employerAddress, string organizationName, bool isRegistered, uint256 registeredAt)",
];

export function getContract(runner: ethers.ContractRunner) {
  return new ethers.Contract(CONTRACT_ADDRESS, EMPLOYMENT_REGISTRY_ABI, runner);
}
