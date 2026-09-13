import { Request, Response, NextFunction } from "express";

export class AppError extends Error {
  public statusCode: number;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

/**
 * Extracts a human-readable revert message from ethers.js errors.
 */
function extractEthersRevertReason(err: any): { reason?: string; statusCode: number } {
  const reason =
    err.reason ||
    err.shortMessage ||
    (err.info && err.info.error && err.info.error.message) ||
    err.message ||
    "";

  if (reason.includes("Caller is not a registered employer")) {
    return { reason: "Caller is not a registered employer", statusCode: 403 };
  }
  if (reason.includes("Employer already registered")) {
    return { reason: "Employer is already registered", statusCode: 409 };
  }
  if (reason.includes("Attestation does not exist")) {
    return { reason: "Attestation does not exist", statusCode: 404 };
  }
  if (reason.includes("Access request does not exist")) {
    return { reason: "Access request does not exist", statusCode: 404 };
  }
  if (reason.includes("Only issuer can revoke")) {
    return { reason: "Only the original issuing employer can revoke this attestation", statusCode: 403 };
  }
  if (reason.includes("Only the attestation employee can approve access")) {
    return { reason: "Only the attestation employee can approve this access request", statusCode: 403 };
  }
  if (reason.includes("Only the attestation employee can reject access")) {
    return { reason: "Only the attestation employee can reject this access request", statusCode: 403 };
  }
  if (reason.includes("Employee cannot request access from themselves")) {
    return { reason: "Employee cannot request access from themselves", statusCode: 400 };
  }
  if (reason.includes("Cannot request access for revoked attestation")) {
    return { reason: "Cannot request access for a revoked attestation", statusCode: 400 };
  }
  if (reason.includes("Attestation already revoked")) {
    return { reason: "Attestation is already revoked", statusCode: 400 };
  }
  if (reason.includes("Attestation has no supporting document")) {
    return { reason: "Attestation has no supporting document attached", statusCode: 400 };
  }
  if (reason.includes("Request is not pending")) {
    return { reason: "Access request is no longer in pending state", statusCode: 400 };
  }

  return { statusCode: 500 };
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Check for Multer file size error
  if (err.code === "LIMIT_FILE_SIZE") {
    res.status(400).json({
      success: false,
      error: { message: "File size exceeds 10MB limit" },
    });
    return;
  }

  // Check for smart contract / ethers revert errors
  const { reason, statusCode: ethersStatusCode } = extractEthersRevertReason(err);

  const statusCode = err.statusCode || (reason ? ethersStatusCode : 500);
  const message = reason || err.message || "Internal Server Error";

  if (process.env.NODE_ENV !== "test" && statusCode === 500) {
    console.error("[WorkProof Error]:", err);
  }

  res.status(statusCode).json({
    success: false,
    error: {
      message,
      ...(err.transactionHash && { transactionHash: err.transactionHash }),
      ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
    },
  });
}
