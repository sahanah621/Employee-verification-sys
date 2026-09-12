// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title EmploymentRegistry
 * @notice Authoritative Ethereum smart contract for the WorkProof employment verification network.
 * @dev Stores employer registrations, employment attestation metadata, SHA-256 hashes (recordHash, documentHash, employeeHash),
 *      encrypted document IPFS CIDs, and manages privacy-preserving document access request authorizations.
 */
contract EmploymentRegistry {
    // --- Enums ---
    enum EmploymentStatus {
        ACTIVE,
        COMPLETED,
        REVOKED
    }

    enum RequestStatus {
        PENDING,
        APPROVED,
        REJECTED
    }

    // --- Structs ---
    struct EmployerProfile {
        address employerAddress;
        string employerName;
        bool isRegistered;
        uint256 registrationTimestamp;
    }

    struct Attestation {
        uint256 attestationId;
        bytes32 employeeHash;   // SHA-256 hash of unique employee identifier
        address employee;       // Employee wallet address for access authorization
        address employer;       // Issuer/Employer wallet address
        string position;        // Job title/position
        uint256 startDate;      // Employment start date (Unix timestamp)
        uint256 endDate;        // Employment end date (Unix timestamp, 0 if ongoing)
        EmploymentStatus status;// Current employment status (ACTIVE, COMPLETED, REVOKED)
        bytes32 recordHash;     // SHA-256 hash of canonical structured employment record
        bytes32 documentHash;   // SHA-256 hash of original unencrypted supporting document
        string ipfsCID;         // IPFS CID of AES-256-GCM encrypted supporting document
        uint256 issueTimestamp; // Block timestamp when attestation was created
    }

    struct AccessRequest {
        uint256 requestId;
        uint256 attestationId;
        address verifier;       // Wallet of requesting verifier (Company B)
        address employee;       // Wallet of employee who must authorize
        string requestType;     // Purpose or type of request (e.g. "EMPLOYMENT_VERIFICATION")
        RequestStatus status;   // PENDING, APPROVED, REJECTED
        uint256 timestamp;      // Timestamp when request was submitted
        uint256 respondedAt;    // Timestamp when employee responded (0 if pending)
    }

    // --- State Variables ---
    uint256 private _attestationIdCounter;
    uint256 private _requestIdCounter;

    // Mapping: employer address => EmployerProfile
    mapping(address => EmployerProfile) public employers;

    // Mapping: attestationId => Attestation
    mapping(uint256 => Attestation) public attestations;

    // Mapping: employeeHash (SHA-256) => list of attestation IDs
    mapping(bytes32 => uint256[]) private _employeeHashAttestations;

    // Mapping: employee wallet address => list of attestation IDs
    mapping(address => uint256[]) private _employeeWalletAttestations;

    // Mapping: employer wallet address => list of attestation IDs
    mapping(address => uint256[]) private _employerAttestations;

    // Mapping: requestId => AccessRequest
    mapping(uint256 => AccessRequest) public accessRequests;

    // Mapping: attestationId => list of request IDs
    mapping(uint256 => uint256[]) private _attestationRequests;

    // Mapping: attestationId => verifier address => authorization status
    mapping(uint256 => mapping(address => bool)) private _authorizedVerifiers;

    // --- Events ---
    event EmployerRegistered(
        address indexed employer,
        string employerName,
        uint256 timestamp
    );

    event AttestationCreated(
        uint256 indexed attestationId,
        bytes32 indexed employeeHash,
        address indexed employer,
        address employee,
        string position,
        bytes32 recordHash,
        bytes32 documentHash,
        string ipfsCID,
        uint256 timestamp
    );

    event AttestationRevoked(
        uint256 indexed attestationId,
        address indexed employer,
        uint256 timestamp
    );

    event AccessRequested(
        uint256 indexed requestId,
        uint256 indexed attestationId,
        address indexed verifier,
        address employee,
        string requestType,
        uint256 timestamp
    );

    event AccessGranted(
        uint256 indexed requestId,
        uint256 indexed attestationId,
        address indexed verifier,
        address employee,
        uint256 timestamp
    );

    event AccessRejected(
        uint256 indexed requestId,
        uint256 indexed attestationId,
        address indexed verifier,
        address employee,
        uint256 timestamp
    );

    // --- Modifiers ---
    modifier onlyRegisteredEmployer() {
        require(employers[msg.sender].isRegistered, "Caller is not a registered employer");
        _;
    }

    // --- Employer Registration Functions ---

    /**
     * @notice Registers the caller's wallet address as an authorized employer issuer.
     * @param employerName Name of the employer/organization.
     */
    function registerEmployer(string calldata employerName) external {
        require(!employers[msg.sender].isRegistered, "Employer already registered");
        require(bytes(employerName).length > 0, "Employer name cannot be empty");

        employers[msg.sender] = EmployerProfile({
            employerAddress: msg.sender,
            employerName: employerName,
            isRegistered: true,
            registrationTimestamp: block.timestamp
        });

        emit EmployerRegistered(msg.sender, employerName, block.timestamp);
    }

    /**
     * @notice Checks if an address is registered as an authorized employer issuer.
     * @param employer Address to check.
     */
    function isEmployerRegistered(address employer) external view returns (bool) {
        return employers[employer].isRegistered;
    }

    // --- Attestation Management Functions ---

    /**
     * @notice Creates an employment attestation on the blockchain.
     * @dev Only registered employers can call this. All hashes must be computed off-chain using SHA-256.
     * @param employee Wallet address of the employee for on-chain authorization.
     * @param employeeHash SHA-256 hash of the unique employee identifier.
     * @param position Job title / position of the employee.
     * @param startDate Employment start date (Unix timestamp).
     * @param endDate Employment end date (Unix timestamp, 0 if still active).
     * @param recordHash SHA-256 hash of the canonical structured record.
     * @param documentHash SHA-256 hash of the original supporting document (bytes32(0) if none).
     * @param ipfsCID IPFS CID of the encrypted supporting document ("" if none).
     * @return attestationId Unique identifier of the created attestation.
     */
    function createAttestation(
        address employee,
        bytes32 employeeHash,
        string calldata position,
        uint256 startDate,
        uint256 endDate,
        bytes32 recordHash,
        bytes32 documentHash,
        string calldata ipfsCID
    ) external onlyRegisteredEmployer returns (uint256) {
        require(employee != address(0), "Invalid employee address");
        require(employeeHash != bytes32(0), "Employee hash cannot be empty");
        require(bytes(position).length > 0, "Position cannot be empty");
        require(recordHash != bytes32(0), "Record hash cannot be empty");
        require(startDate > 0, "Invalid start date");
        if (endDate > 0) {
            require(endDate >= startDate, "End date must be greater than or equal to start date");
        }

        uint256 attestationId = ++_attestationIdCounter;

        Attestation storage newAtt = attestations[attestationId];
        newAtt.attestationId = attestationId;
        newAtt.employeeHash = employeeHash;
        newAtt.employee = employee;
        newAtt.employer = msg.sender;
        newAtt.position = position;
        newAtt.startDate = startDate;
        newAtt.endDate = endDate;
        newAtt.status = (endDate > 0 && endDate <= block.timestamp)
            ? EmploymentStatus.COMPLETED
            : EmploymentStatus.ACTIVE;
        newAtt.recordHash = recordHash;
        newAtt.documentHash = documentHash;
        newAtt.ipfsCID = ipfsCID;
        newAtt.issueTimestamp = block.timestamp;

        _employeeHashAttestations[employeeHash].push(attestationId);
        _employeeWalletAttestations[employee].push(attestationId);
        _employerAttestations[msg.sender].push(attestationId);

        emit AttestationCreated(
            attestationId,
            employeeHash,
            msg.sender,
            employee,
            position,
            recordHash,
            documentHash,
            ipfsCID,
            block.timestamp
        );

        return attestationId;
    }

    /**
     * @notice Revokes an existing attestation.
     * @dev Only the original issuing employer can revoke it. Record remains on-chain with status REVOKED.
     * @param attestationId ID of the attestation to revoke.
     */
    function revokeAttestation(uint256 attestationId) external {
        Attestation storage attestation = attestations[attestationId];
        require(attestation.issueTimestamp != 0, "Attestation does not exist");
        require(attestation.employer == msg.sender, "Only issuer can revoke");
        require(attestation.status != EmploymentStatus.REVOKED, "Attestation already revoked");

        attestation.status = EmploymentStatus.REVOKED;

        emit AttestationRevoked(attestationId, msg.sender, block.timestamp);
    }

    // --- Attestation Retrieval Functions ---

    /**
     * @notice Retrieves full attestation details by its unique ID.
     * @param attestationId Attestation ID.
     */
    function getAttestation(uint256 attestationId) external view returns (Attestation memory) {
        require(attestations[attestationId].issueTimestamp != 0, "Attestation does not exist");
        return attestations[attestationId];
    }

    /**
     * @notice Retrieves all attestation IDs associated with an employee identifier hash (SHA-256).
     * @param employeeHash SHA-256 hash of the employee identifier.
     */
    function getEmployeeAttestations(bytes32 employeeHash) external view returns (uint256[] memory) {
        return _employeeHashAttestations[employeeHash];
    }

    /**
     * @notice Retrieves all attestation IDs associated with an employee wallet address.
     * @param employee Employee wallet address.
     */
    function getEmployeeAttestationsByWallet(address employee) external view returns (uint256[] memory) {
        return _employeeWalletAttestations[employee];
    }

    /**
     * @notice Retrieves all attestation IDs issued by an employer.
     * @param employer Employer wallet address.
     */
    function getEmployerAttestations(address employer) external view returns (uint256[] memory) {
        return _employerAttestations[employer];
    }

    // --- Private Document Access Request Functions ---

    /**
     * @notice Requests access to view the private supporting document of an attestation.
     * @dev Only registered employers/verifiers can call this function.
     * @param attestationId Attestation ID.
     * @param requestType Description/purpose of the request (e.g. "EMPLOYMENT_VERIFICATION").
     * @return requestId Unique request ID.
     */
    function requestDocumentAccess(
        uint256 attestationId,
        string calldata requestType
    ) external onlyRegisteredEmployer returns (uint256) {
        Attestation memory attestation = attestations[attestationId];
        require(attestation.issueTimestamp != 0, "Attestation does not exist");
        require(attestation.status != EmploymentStatus.REVOKED, "Cannot request access for revoked attestation");
        require(bytes(attestation.ipfsCID).length > 0, "Attestation has no supporting document");
        require(msg.sender != attestation.employee, "Employee cannot request access from themselves");

        uint256 requestId = ++_requestIdCounter;

        accessRequests[requestId] = AccessRequest({
            requestId: requestId,
            attestationId: attestationId,
            verifier: msg.sender,
            employee: attestation.employee,
            requestType: requestType,
            status: RequestStatus.PENDING,
            timestamp: block.timestamp,
            respondedAt: 0
        });

        _attestationRequests[attestationId].push(requestId);

        emit AccessRequested(
            requestId,
            attestationId,
            msg.sender,
            attestation.employee,
            requestType,
            block.timestamp
        );

        return requestId;
    }

    /**
     * @notice Approves a pending document access request.
     * @dev Only the employee associated with the attestation can approve access.
     * @param requestId ID of the access request to approve.
     */
    function approveDocumentAccess(uint256 requestId) external {
        AccessRequest storage req = accessRequests[requestId];
        require(req.timestamp != 0, "Access request does not exist");
        require(req.status == RequestStatus.PENDING, "Request is not pending");
        require(msg.sender == req.employee, "Only the attestation employee can approve access");

        req.status = RequestStatus.APPROVED;
        req.respondedAt = block.timestamp;
        _authorizedVerifiers[req.attestationId][req.verifier] = true;

        emit AccessGranted(requestId, req.attestationId, req.verifier, msg.sender, block.timestamp);
    }

    /**
     * @notice Rejects a pending document access request.
     * @dev Only the employee associated with the attestation can reject access.
     * @param requestId ID of the access request to reject.
     */
    function rejectDocumentAccess(uint256 requestId) external {
        AccessRequest storage req = accessRequests[requestId];
        require(req.timestamp != 0, "Access request does not exist");
        require(req.status == RequestStatus.PENDING, "Request is not pending");
        require(msg.sender == req.employee, "Only the attestation employee can reject access");

        req.status = RequestStatus.REJECTED;
        req.respondedAt = block.timestamp;
        _authorizedVerifiers[req.attestationId][req.verifier] = false;

        emit AccessRejected(requestId, req.attestationId, req.verifier, msg.sender, block.timestamp);
    }

    /**
     * @notice Verifies whether a specific verifier has active authorization to access the supporting document.
     * @dev Authorization is invalid if the attestation itself is revoked or non-existent.
     * @param attestationId Attestation ID.
     * @param verifier Address of the verifier.
     * @return bool True if verifier is currently authorized and attestation is valid.
     */
    function hasDocumentAccess(uint256 attestationId, address verifier) external view returns (bool) {
        Attestation memory attestation = attestations[attestationId];
        if (attestation.issueTimestamp == 0 || attestation.status == EmploymentStatus.REVOKED) {
            return false;
        }
        return _authorizedVerifiers[attestationId][verifier];
    }

    /**
     * @notice Retrieves access request details by ID.
     * @param requestId Request ID.
     */
    function getAccessRequest(uint256 requestId) external view returns (AccessRequest memory) {
        require(accessRequests[requestId].timestamp != 0, "Access request does not exist");
        return accessRequests[requestId];
    }

    /**
     * @notice Retrieves all request IDs submitted for a given attestation.
     * @param attestationId Attestation ID.
     */
    function getAttestationAccessRequests(uint256 attestationId) external view returns (uint256[] memory) {
        return _attestationRequests[attestationId];
    }
}
