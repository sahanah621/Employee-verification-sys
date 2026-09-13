import { Request, Response, NextFunction } from "express";
import { blockchainService } from "../services/blockchain.service";

export class AttestationController {
  /**
   * GET /api/attestations/:id
   * Retrieves full attestation details by its unique on-chain ID.
   */
  async getAttestation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attestationId = req.params.id;
      const attestation = await blockchainService.getAttestation(attestationId);

      res.status(200).json({
        success: true,
        data: attestation,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attestations
   * Creates an employment attestation on the blockchain.
   */
  async createAttestation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const {
        employee,
        employeeHash,
        position,
        startDate,
        endDate,
        recordHash,
        documentHash,
        ipfsCID,
        devPrivateKey,
      } = req.body;

      const result = await blockchainService.createAttestation(
        {
          employee,
          employeeHash,
          position,
          startDate,
          endDate,
          recordHash,
          documentHash,
          ipfsCID,
        },
        devPrivateKey
      );

      res.status(201).json({
        success: true,
        message: "Employment attestation created successfully on Ethereum",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/attestations/:id/revoke
   * Revokes an existing attestation on-chain.
   */
  async revokeAttestation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attestationId = req.params.id;
      const { devPrivateKey } = req.body;

      const result = await blockchainService.revokeAttestation(
        attestationId,
        devPrivateKey
      );

      res.status(200).json({
        success: true,
        message: "Employment attestation revoked successfully on Ethereum",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/attestations/:id/access
   * Checks document access authorization and lists access requests for an attestation.
   */
  async checkDocumentAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attestationId = req.params.id;
      const verifier = req.query.verifier as string | undefined;

      const [requestIds, isAuthorized] = await Promise.all([
        blockchainService.getAttestationAccessRequests(attestationId),
        verifier ? blockchainService.hasDocumentAccess(attestationId, verifier) : false,
      ]);

      res.status(200).json({
        success: true,
        data: {
          attestationId: Number(attestationId),
          accessRequestIds: requestIds,
          ...(verifier && {
            verifier,
            isAuthorized,
          }),
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const attestationController = new AttestationController();
