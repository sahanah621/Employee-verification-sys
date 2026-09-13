export const contractAbi: any[] = [
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "employee",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AccessGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "employee",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AccessRejected",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "employee",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "requestType",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AccessRequested",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "employeeHash",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "employer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "address",
        "name": "employee",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "position",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "recordHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "bytes32",
        "name": "documentHash",
        "type": "bytes32"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "ipfsCID",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AttestationCreated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "employer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "AttestationRevoked",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "employer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "employerName",
        "type": "string"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "name": "EmployerRegistered",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "accessRequests",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "employee",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "requestType",
        "type": "string"
      },
      {
        "internalType": "enum EmploymentRegistry.RequestStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "respondedAt",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "name": "approveDocumentAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "attestations",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "employeeHash",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "employee",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "employer",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "position",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "startDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endDate",
        "type": "uint256"
      },
      {
        "internalType": "enum EmploymentRegistry.EmploymentStatus",
        "name": "status",
        "type": "uint8"
      },
      {
        "internalType": "bytes32",
        "name": "recordHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "documentHash",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "ipfsCID",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "issueTimestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "employee",
        "type": "address"
      },
      {
        "internalType": "bytes32",
        "name": "employeeHash",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "position",
        "type": "string"
      },
      {
        "internalType": "uint256",
        "name": "startDate",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "endDate",
        "type": "uint256"
      },
      {
        "internalType": "bytes32",
        "name": "recordHash",
        "type": "bytes32"
      },
      {
        "internalType": "bytes32",
        "name": "documentHash",
        "type": "bytes32"
      },
      {
        "internalType": "string",
        "name": "ipfsCID",
        "type": "string"
      }
    ],
    "name": "createAttestation",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "employers",
    "outputs": [
      {
        "internalType": "address",
        "name": "employerAddress",
        "type": "address"
      },
      {
        "internalType": "string",
        "name": "employerName",
        "type": "string"
      },
      {
        "internalType": "bool",
        "name": "isRegistered",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "registrationTimestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "name": "getAccessRequest",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "requestId",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "attestationId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "verifier",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "employee",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "requestType",
            "type": "string"
          },
          {
            "internalType": "enum EmploymentRegistry.RequestStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "respondedAt",
            "type": "uint256"
          }
        ],
        "internalType": "struct EmploymentRegistry.AccessRequest",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      }
    ],
    "name": "getAttestation",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "attestationId",
            "type": "uint256"
          },
          {
            "internalType": "bytes32",
            "name": "employeeHash",
            "type": "bytes32"
          },
          {
            "internalType": "address",
            "name": "employee",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "employer",
            "type": "address"
          },
          {
            "internalType": "string",
            "name": "position",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "startDate",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "endDate",
            "type": "uint256"
          },
          {
            "internalType": "enum EmploymentRegistry.EmploymentStatus",
            "name": "status",
            "type": "uint8"
          },
          {
            "internalType": "bytes32",
            "name": "recordHash",
            "type": "bytes32"
          },
          {
            "internalType": "bytes32",
            "name": "documentHash",
            "type": "bytes32"
          },
          {
            "internalType": "string",
            "name": "ipfsCID",
            "type": "string"
          },
          {
            "internalType": "uint256",
            "name": "issueTimestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct EmploymentRegistry.Attestation",
        "name": "",
        "type": "tuple"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      }
    ],
    "name": "getAttestationAccessRequests",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "employeeHash",
        "type": "bytes32"
      }
    ],
    "name": "getEmployeeAttestations",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "employee",
        "type": "address"
      }
    ],
    "name": "getEmployeeAttestationsByWallet",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "employer",
        "type": "address"
      }
    ],
    "name": "getEmployerAttestations",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "",
        "type": "uint256[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "verifier",
        "type": "address"
      }
    ],
    "name": "hasDocumentAccess",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "employer",
        "type": "address"
      }
    ],
    "name": "isEmployerRegistered",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "employerName",
        "type": "string"
      }
    ],
    "name": "registerEmployer",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "requestId",
        "type": "uint256"
      }
    ],
    "name": "rejectDocumentAccess",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      },
      {
        "internalType": "string",
        "name": "requestType",
        "type": "string"
      }
    ],
    "name": "requestDocumentAccess",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "attestationId",
        "type": "uint256"
      }
    ],
    "name": "revokeAttestation",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
];
