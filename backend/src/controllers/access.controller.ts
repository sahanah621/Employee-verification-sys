import { Request, Response, NextFunction } from "express";
import { blockchainService } from "../services/blockchain.service";

export class AccessController {
  /**
   * POST /api/attestations/:id/access-request
   * Submits a request to view the private supporting document of an attestation.
   */
  async requestDocumentAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const attestationId = req.params.id;
      const { requestType, devPrivateKey } = req.body;

      const result = await blockchainService.requestDocumentAccess(
        attestationId,
        requestType || "EMPLOYMENT_VERIFICATION",
        devPrivateKey
      );

      res.status(201).json({
        success: true,
        message: "Document access request submitted successfully on Ethereum",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/access-requests/:id
   * Retrieves access request details by request ID.
   */
  async getAccessRequest(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = req.params.id;
      const request = await blockchainService.getAccessRequest(requestId);

      res.status(200).json({
        success: true,
        data: request,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/access-requests/:id/approve
   * Approves a pending document access request.
   */
  async approveDocumentAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = req.params.id;
      const { devPrivateKey } = req.body;

      const result = await blockchainService.approveDocumentAccess(
        requestId,
        devPrivateKey
      );

      res.status(200).json({
        success: true,
        message: "Document access request approved successfully on Ethereum",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/access-requests/:id/reject
   * Rejects a pending document access request.
   */
  async rejectDocumentAccess(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const requestId = req.params.id;
      const { devPrivateKey } = req.body;

      const result = await blockchainService.rejectDocumentAccess(
        requestId,
        devPrivateKey
      );

      res.status(200).json({
        success: true,
        message: "Document access request rejected on Ethereum",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const accessController = new AccessController();
