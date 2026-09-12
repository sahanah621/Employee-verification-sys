// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EmploymentRegistry
 * @notice Authoritative on-chain registry for WorkProof employment attestations and access permissions.
 * @dev Stores attestation metadata, document hashes, and IPFS CIDs. Detailed business logic will be implemented in subsequent phases.
 */
contract EmploymentRegistry {
    // --- Enums ---
    enum EmploymentStatus { Active, Terminated, Resigned, Revoked }
    enum AccessStatus { None, Pending, Approved, Rejected, Revoked }

    // --- Structs ---
    struct Attestation {
        bytes32 attestationId;
        address employer;
        address employee;
        string position;
        uint256 startDate;
        uint256 endDate;
        EmploymentStatus status;
        bytes32 recordHash;     // SHA-256 hash of structured employment data
        bytes32 documentHash;   // SHA-256 hash of original unencrypted document
        string ipfsCID;         // IPFS CID of AES-256-GCM encrypted document
        uint256 createdAt;
        bool isRevoked;
    }

    struct AccessRequest {
        bytes32 requestId;
        bytes32 attestationId;
        address verifier;
        address employee;
        AccessStatus status;
        uint256 requestedAt;
        uint256 respondedAt;
    }

    struct EmployerProfile {
        address employerAddress;
        string organizationName;
        bool isRegistered;
        uint256 registeredAt;
    }

    // --- State Variables ---
    mapping(address => EmployerProfile) public employers;
    mapping(bytes32 => Attestation) public attestations;
    mapping(address => bytes32[]) private _employeeAttestations;
    mapping(bytes32 => AccessRequest) public accessRequests;
    mapping(bytes32 => mapping(address => bool)) private _authorizedVerifiers; // attestationId => verifier => isAuthorized

    // --- Events ---
    event EmployerRegistered(address indexed employer, string organizationName, uint256 timestamp);
    event AttestationCreated(bytes32 indexed attestationId, address indexed employer, address indexed employee, bytes32 recordHash, string ipfsCID, uint256 timestamp);
    event AttestationRevoked(bytes32 indexed attestationId, address indexed employer, uint256 timestamp);
    event AccessRequested(bytes32 indexed requestId, bytes32 indexed attestationId, address indexed verifier, address employee, uint256 timestamp);
    event AccessApproved(bytes32 indexed requestId, bytes32 indexed attestationId, address indexed verifier, address employee, uint256 timestamp);
    event AccessRejected(bytes32 indexed requestId, bytes32 indexed attestationId, address indexed verifier, address employee, uint256 timestamp);

    // --- Constructor ---
    constructor() {
        // Initial setup placeholder
    }

    // --- Employer Registration ---
    function registerEmployer(string calldata organizationName) external {
        require(!employers[msg.sender].isRegistered, "Employer already registered");
        employers[msg.sender] = EmployerProfile({
            employerAddress: msg.sender,
            organizationName: organizationName,
            isRegistered: true,
            registeredAt: block.timestamp
        });
        emit EmployerRegistered(msg.sender, organizationName, block.timestamp);
    }

    // --- Attestation Management Skeleton ---
    function createAttestation(
        address employee,
        string calldata position,
        uint256 startDate,
        uint256 endDate,
        bytes32 recordHash,
        bytes32 documentHash,
        string calldata ipfsCID
    ) external returns (bytes32) {
        bytes32 attestationId = keccak256(
            abi.encodePacked(msg.sender, employee, recordHash, block.timestamp)
        );

        attestations[attestationId] = Attestation({
            attestationId: attestationId,
            employer: msg.sender,
            employee: employee,
            position: position,
            startDate: startDate,
            endDate: endDate,
            status: EmploymentStatus.Active,
            recordHash: recordHash,
            documentHash: documentHash,
            ipfsCID: ipfsCID,
            createdAt: block.timestamp,
            isRevoked: false
        });

        _employeeAttestations[employee].push(attestationId);

        emit AttestationCreated(attestationId, msg.sender, employee, recordHash, ipfsCID, block.timestamp);
        return attestationId;
    }

    function revokeAttestation(bytes32 attestationId) external {
        Attestation storage attestation = attestations[attestationId];
        require(attestation.employer == msg.sender, "Only issuer can revoke");
        attestation.isRevoked = true;
        attestation.status = EmploymentStatus.Revoked;
        emit AttestationRevoked(attestationId, msg.sender, block.timestamp);
    }

    // --- Attestation Lookup ---
    function getAttestation(bytes32 attestationId) external view returns (Attestation memory) {
        require(attestations[attestationId].createdAt != 0, "Attestation not found");
        return attestations[attestationId];
    }

    function getEmployeeAttestations(address employee) external view returns (bytes32[] memory) {
        return _employeeAttestations[employee];
    }

    // --- Access Control Requests & Approvals Skeleton ---
    function requestDocumentAccess(bytes32 attestationId) external returns (bytes32) {
        Attestation memory attestation = attestations[attestationId];
        require(attestation.createdAt != 0, "Attestation not found");

        bytes32 requestId = keccak256(
            abi.encodePacked(attestationId, msg.sender, block.timestamp)
        );

        accessRequests[requestId] = AccessRequest({
            requestId: requestId,
            attestationId: attestationId,
            verifier: msg.sender,
            employee: attestation.employee,
            status: AccessStatus.Pending,
            requestedAt: block.timestamp,
            respondedAt: 0
        });

        emit AccessRequested(requestId, attestationId, msg.sender, attestation.employee, block.timestamp);
        return requestId;
    }

    function approveAccess(bytes32 requestId) external {
        AccessRequest storage request = accessRequests[requestId];
        require(request.employee == msg.sender, "Only employee can approve access");
        request.status = AccessStatus.Approved;
        request.respondedAt = block.timestamp;
        _authorizedVerifiers[request.attestationId][request.verifier] = true;

        emit AccessApproved(requestId, request.attestationId, request.verifier, msg.sender, block.timestamp);
    }

    function rejectAccess(bytes32 requestId) external {
        AccessRequest storage request = accessRequests[requestId];
        require(request.employee == msg.sender, "Only employee can reject access");
        request.status = AccessStatus.Rejected;
        request.respondedAt = block.timestamp;
        _authorizedVerifiers[request.attestationId][request.verifier] = false;

        emit AccessRejected(requestId, request.attestationId, request.verifier, msg.sender, block.timestamp);
    }

    function isVerifierAuthorized(bytes32 attestationId, address verifier) external view returns (bool) {
        return _authorizedVerifiers[attestationId][verifier];
    }
}
