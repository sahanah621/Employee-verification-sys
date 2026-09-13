import { ethers } from "ethers";

/**
 * Signature service placeholder for ECDSA wallet signature verification.
 */
export class SignatureService {
  /**
   * Constructs the canonical challenge message for requesting decrypted document access.
   */
  buildAccessChallenge(attestationId: string | number, timestamp: number): string {
    return `WorkProof Document Access: Attestation ${attestationId} at ${timestamp}`;
  }

  /**
   * Verifies an Ethereum ECDSA signature against an expected signer address.
   */
  verifyMessage(message: string, signature: string, expectedAddress: string): boolean {
    try {
      const recoveredAddress = ethers.verifyMessage(message, signature);
      return recoveredAddress.toLowerCase() === expectedAddress.toLowerCase();
    } catch {
      return false;
    }
  }

  /**
   * Verifies a verifier's access request signature with replay protection (timestamp expiry).
   */
  verifyAccessRequest(
    attestationId: string | number,
    verifierAddress: string,
    signature: string,
    timestamp: number,
    maxAgeSeconds = 300
  ): { valid: boolean; error?: string } {
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > maxAgeSeconds) {
      return {
        valid: false,
        error: `Signature expired or invalid timestamp. Server time: ${now}, Request time: ${timestamp}`,
      };
    }

    const challenge = this.buildAccessChallenge(attestationId, timestamp);
    const isValid = this.verifyMessage(challenge, signature, verifierAddress);

    if (!isValid) {
      return { valid: false, error: "Invalid cryptographic signature for verifier address" };
    }

    return { valid: true };
  }
}

export const signatureService = new SignatureService();
