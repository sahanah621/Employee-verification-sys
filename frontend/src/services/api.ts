import {
  DocumentUploadResponse,
  PrepareAttestationResponse,
  DecryptedDocumentResponse,
} from "../types/workproof";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export interface PrepareAttestationPayload {
  employee: string;
  employeeIdOrEmail?: string;
  position: string;
  startDate: number;
  endDate?: number;
  additionalMetadata?: Record<string, any>;
}

export const apiService = {
  /**
   * Check backend & blockchain RPC health status.
   */
  async checkHealth(): Promise<any> {
    const res = await fetch(`${API_URL.replace(/\/api$/, "")}/health`);
    if (!res.ok) {
      throw new Error(`Health check failed with status: ${res.status}`);
    }
    return res.json();
  },

  /**
   * Prepares canonical recordHash and employeeHash via SHA-256.
   */
  async prepareAttestation(
    payload: PrepareAttestationPayload
  ): Promise<{ success: boolean; data: PrepareAttestationResponse }> {
    const res = await fetch(`${API_URL}/document/prepare`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to prepare attestation hashes");
    }
    return data;
  },

  /**
   * Uploads and encrypts supporting document to IPFS via AES-256-GCM + Pinata.
   */
  async uploadDocument(
    file: File
  ): Promise<{ success: boolean; data: DocumentUploadResponse }> {
    const formData = new FormData();
    formData.append("document", file);

    const res = await fetch(`${API_URL}/document/upload`, {
      method: "POST",
      body: formData,
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to upload and encrypt document to IPFS");
    }
    return data;
  },

  /**
   * Authoritative document decryption with on-chain access verification.
   */
  async getDecryptedDocument(
    attestationId: number | string,
    verifier: string,
    signature?: string,
    timestamp?: number,
    format: "json" | "raw" = "json"
  ): Promise<{ success: boolean; data: DecryptedDocumentResponse }> {
    const query = new URLSearchParams({
      verifier,
      format,
      ...(signature && { signature }),
      ...(timestamp && { timestamp: String(timestamp) }),
    });

    const res = await fetch(`${API_URL}/document/${attestationId}/decrypt?${query.toString()}`, {
      headers: {
        Accept: "application/json",
      },
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error?.message || "Failed to decrypt supporting document");
    }
    return data;
  },

  /**
   * Constructs the canonical challenge message for document decryption signature.
   */
  buildAccessChallenge(attestationId: string | number, timestamp: number): string {
    return `WorkProof Document Access: Attestation ${attestationId} at ${timestamp}`;
  },
};
