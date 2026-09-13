import { Request, Response, NextFunction } from "express";
import { blockchainService } from "../services/blockchain.service";

export class EmployeeController {
  /**
   * GET /api/employees/:employeeHash/attestations
   * Retrieves all attestation IDs associated with a privacy-preserving SHA-256 employee hash.
   */
  async getAttestationsByHash(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const employeeHash = req.params.employeeHash;
      const attestationIds = await blockchainService.getEmployeeAttestations(employeeHash);

      res.status(200).json({
        success: true,
        data: {
          employeeHash,
          attestationCount: attestationIds.length,
          attestationIds,
        },
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/employees/wallet/:address/attestations
   * Retrieves all attestation IDs associated with an employee's Ethereum wallet address.
   */
  async getAttestationsByWallet(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const address = req.params.address;
      const attestationIds = await blockchainService.getEmployeeAttestationsByWallet(address);

      res.status(200).json({
        success: true,
        data: {
          employeeAddress: address,
          attestationCount: attestationIds.length,
          attestationIds,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const employeeController = new EmployeeController();
