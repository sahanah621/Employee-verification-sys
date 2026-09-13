import { Request, Response, NextFunction } from "express";
import { hashingService } from "../services/hashing.service";
import { encryptionService } from "../services/encryption.service";
import { ipfsService } from "../services/ipfs.service";
import { signatureService } from "../services/signature.service";
import { blockchainService } from "../services/blockchain.service";
import { config } from "../config/env";
import { AppError } from "../middleware/errorHandler";

export class DocumentController {
  /**
   * POST /api/document/upload
   * Accepts a multipart file ("document"), hashes it (SHA-256),
   * derives AES-256-GCM key, encrypts payload, and pins to IPFS.
   */
  async uploadSupportingDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        throw new AppError("No file uploaded. Please upload a file with field name 'document'", 400);
      }

      const fileBuffer = req.file.buffer;
      const originalName = req.file.originalname;
      const mimeType = req.file.mimetype;

      // 1. Calculate unencrypted SHA-256 document hash (0x-prefixed for Solidity)
      const documentHash = hashingService.hashBuffer(fileBuffer, true);
      const rawHexHash = hashingService.hashBuffer(fileBuffer, false);

      // 2. Derive AES-256-GCM symmetric key via HKDF (stateless, no DB)
      const aesKey = encryptionService.deriveDocumentKey(config.crypto.masterKey, rawHexHash);

      // 3. Encrypt file buffer with AES-256-GCM
      const encryptedPayload = await encryptionService.encrypt(fileBuffer, aesKey, {
        originalName,
        mimeType,
      });

      // 4. Serialize payload and pin to IPFS
      const serializedBuffer = encryptionService.serializePayload(encryptedPayload);
      const ipfsCID = await ipfsService.uploadEncryptedDocument(
        serializedBuffer,
        `${originalName}.enc`
      );

      res.status(201).json({
        success: true,
        message: "Document encrypted and pinned to IPFS successfully",
        data: {
          documentHash,
          ipfsCID,
          originalName,
          mimeType,
          sizeBytes: fileBuffer.length,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/document/prepare
   * Canonicalizes structured employment record and employee identifier to generate SHA-256 hashes.
   */
  async prepareAttestation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employee, employeeIdOrEmail, position, startDate, endDate, additionalMetadata } = req.body;

      if (!employee || !position || !startDate) {
        throw new AppError("employee, position, and startDate are required", 400);
      }

      const employeeHash = hashingService.hashString(
        employeeIdOrEmail || employee.toLowerCase(),
        true
      );

      const recordToHash = {
        employee: employee.toLowerCase(),
        position,
        startDate: Number(startDate),
        endDate: endDate ? Number(endDate) : 0,
        ...(additionalMetadata && typeof additionalMetadata === "object" ? additionalMetadata : {}),
      };

      const recordHash = hashingService.hashRecord(recordToHash, true);

      res.status(200).json({
        success: true,
        data: {
          employeeHash,
          recordHash,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/document/:attestationId/decrypt
   * Authoritative access-controlled document decryption.
   * Verifies on-chain employee consent before decrypting.
   */
  async getDecryptedDocument(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attestationId = req.params.attestationId || req.params.cid;
      if (!attestationId || isNaN(Number(attestationId)) || Number(attestationId) <= 0) {
        throw new AppError("Invalid or missing attestation ID", 400);
      }

      const verifier =
        (req.query.verifier as string) || (req.headers["x-verifier-address"] as string);
      const signature =
        (req.query.signature as string) || (req.headers["x-signature"] as string);
      const timestamp =
        (req.query.timestamp as string) || (req.headers["x-timestamp"] as string);
      const format = (req.query.format as string) || "raw";

      if (!verifier) {
        throw new AppError(
          "Verifier wallet address is required via query param '?verifier=0x...' or 'x-verifier-address' header",
          400
        );
      }

      // 1. Verify caller cryptographic signature if provided
      if (signature && timestamp) {
        const sigVerification = signatureService.verifyAccessRequest(
          attestationId,
          verifier,
          signature,
          Number(timestamp)
        );
        if (!sigVerification.valid) {
          throw new AppError(`Access signature verification failed: ${sigVerification.error}`, 401);
        }
      } else if (config.nodeEnv === "production") {
        throw new AppError("Cryptographic signature and timestamp are required in production", 401);
      }

      // 2. Query authoritative attestation on Ethereum
      const attestation = await blockchainService.getAttestation(attestationId);

      if (!attestation || !attestation.issueTimestamp || Number(attestation.issueTimestamp) === 0) {
        throw new AppError(`Attestation #${attestationId} does not exist`, 404);
      }

      if (attestation.status === 2) {
        throw new AppError(`Attestation #${attestationId} has been revoked. Access denied.`, 403);
      }

      if (!attestation.ipfsCID || attestation.ipfsCID === "") {
        throw new AppError(`Attestation #${attestationId} has no supporting document attached`, 404);
      }

      // 3. Verify access authorization on-chain
      const isOwnerEmployee = attestation.employee.toLowerCase() === verifier.toLowerCase();
      const isIssuerEmployer = attestation.employer.toLowerCase() === verifier.toLowerCase();
      const isAuthorizedVerifier = await blockchainService.hasDocumentAccess(attestationId, verifier);

      if (!isOwnerEmployee && !isIssuerEmployer && !isAuthorizedVerifier) {
        throw new AppError(
          `Unauthorized: Wallet ${verifier} has not been granted document access by the employee`,
          403
        );
      }

      // 4. Retrieve encrypted payload from IPFS
      const encryptedBuffer = await ipfsService.retrieveEncryptedDocument(attestation.ipfsCID);
      const payload = encryptionService.deserializePayload(encryptedBuffer);

      // 5. Derive stateless decryption key from on-chain documentHash
      const cleanDocHash = attestation.documentHash.replace(/^0x/, "");
      const aesKey = encryptionService.deriveDocumentKey(config.crypto.masterKey, cleanDocHash);

      // 6. Decrypt and verify AES-256-GCM authTag
      const decryptedBuffer = await encryptionService.decrypt(payload, aesKey);

      // 7. Verify cryptographic integrity against on-chain documentHash
      const calculatedHash = hashingService.hashBuffer(decryptedBuffer, true);
      if (calculatedHash.toLowerCase() !== attestation.documentHash.toLowerCase()) {
        throw new AppError(
          "Integrity check failed: Decrypted document hash does not match on-chain documentHash",
          500
        );
      }

      // 8. Return file based on requested format
      const mimeType = payload.mimeType || "application/octet-stream";
      const fileName = payload.originalName || `attestation-${attestationId}-document`;

      if (format === "json" || req.headers.accept?.includes("application/json")) {
        res.status(200).json({
          success: true,
          data: {
            attestationId: Number(attestationId),
            documentHash: attestation.documentHash,
            originalName: fileName,
            mimeType,
            sizeBytes: decryptedBuffer.length,
            base64Data: decryptedBuffer.toString("base64"),
          },
        });
        return;
      }

      res.setHeader("Content-Type", mimeType);
      res.setHeader("Content-Disposition", `inline; filename="${fileName}"`);
      res.setHeader("Content-Length", decryptedBuffer.length);
      res.status(200).send(decryptedBuffer);
    } catch (error) {
      next(error);
    }
  }
}

export const documentController = new DocumentController();
