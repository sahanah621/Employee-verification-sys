import { ethers } from "ethers";

/**
 * Signature service placeholder for ECDSA wallet signature verification.
 */
export class SignatureService {
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
}

export const signatureService = new SignatureService();
