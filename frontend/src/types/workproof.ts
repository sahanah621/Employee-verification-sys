export type UserRole = "employer" | "employee" | "verifier" | "none";

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

export const EMPLOYMENT_STATUS_LABELS: Record<EmploymentStatus, string> = {
  [EmploymentStatus.ACTIVE]: "ACTIVE",
  [EmploymentStatus.COMPLETED]: "COMPLETED",
  [EmploymentStatus.REVOKED]: "REVOKED",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  [RequestStatus.PENDING]: "PENDING",
  [RequestStatus.APPROVED]: "APPROVED",
  [RequestStatus.REJECTED]: "REJECTED",
};

export interface Attestation {
  attestationId: number;
  employeeHash: string;
  employee: string;
  employer: string;
  position: string;
  startDate: number;
  endDate: number;
  status: EmploymentStatus;
  recordHash: string;
  documentHash: string;
  ipfsCID: string;
  issueTimestamp: number;
}

export interface AccessRequest {
  requestId: number;
  attestationId: number;
  verifier: string;
  employee: string;
  requestType: string;
  status: RequestStatus;
  timestamp: number;
  respondedAt: number;
}

export interface EmployerProfile {
  employerAddress: string;
  employerName: string;
  isRegistered: boolean;
  registrationTimestamp: number;
}

export interface DocumentUploadResponse {
  documentHash: string;
  ipfsCID: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
}

export interface PrepareAttestationResponse {
  employeeHash: string;
  recordHash: string;
}

export interface DecryptedDocumentResponse {
  attestationId: number;
  documentHash: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  base64Data: string;
}
