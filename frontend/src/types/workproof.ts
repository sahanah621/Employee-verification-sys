export type UserRole = "employer" | "employee" | "verifier" | "none";

export enum EmploymentStatus {
  Active = 0,
  Terminated = 1,
  Resigned = 2,
  Revoked = 3,
}

export enum AccessStatus {
  None = 0,
  Pending = 1,
  Approved = 2,
  Rejected = 3,
  Revoked = 4,
}

export interface Attestation {
  attestationId: string;
  employer: string;
  employee: string;
  position: string;
  startDate: number;
  endDate: number;
  status: EmploymentStatus;
  recordHash: string;
  documentHash: string;
  ipfsCID: string;
  createdAt: number;
  isRevoked: boolean;
}

export interface AccessRequest {
  requestId: string;
  attestationId: string;
  verifier: string;
  employee: string;
  status: AccessStatus;
  requestedAt: number;
  respondedAt: number;
}

export interface EmployerProfile {
  employerAddress: string;
  organizationName: string;
  isRegistered: boolean;
  registeredAt: number;
}
