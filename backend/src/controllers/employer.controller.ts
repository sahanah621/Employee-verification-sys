import { Request, Response, NextFunction } from "express";
import { blockchainService } from "../services/blockchain.service";

export class EmployerController {
  /**
   * GET /api/employers/:address/status
   * Checks whether an address is registered as an authorized employer issuer.
   */
  async getEmployerStatus(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = req.params.address;
      const isRegistered = await blockchainService.isEmployerRegistered(address);

      res.status(200).json({
        success: true,
        data: {
          address,
          isRegistered,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/employers/:address/profile
   * Retrieves the employer's on-chain registration profile.
   */
  async getEmployerProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = req.params.address;
      const profile = await blockchainService.getEmployerProfile(address);

      res.status(200).json({
        success: true,
        data: profile,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/employers/:address/attestations
   * Retrieves all attestation IDs issued by an employer address.
   */
  async getEmployerAttestations(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = req.params.address;
      const attestationIds = await blockchainService.getEmployerAttestations(address);

      res.status(200).json({
        success: true,
        data: {
          employerAddress: address,
          attestationCount: attestationIds.length,
          attestationIds,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/employers/register
   * Registers the caller's wallet address as an authorized employer issuer.
   */
  async registerEmployer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { employerName, devPrivateKey } = req.body;
      const result = await blockchainService.registerEmployer(employerName, devPrivateKey);

      res.status(201).json({
        success: true,
        message: "Employer registered successfully on Ethereum",
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const employerController = new EmployerController();
