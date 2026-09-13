import { Router } from "express";
import { employeeController } from "../controllers/employee.controller";
import {
  validate,
  bytes32HashSchema,
  ethereumAddressSchema,
} from "../middleware/validate";
import { z } from "zod";

const router = Router();

// GET /api/employees/:employeeHash/attestations
router.get(
  "/:employeeHash/attestations",
  validate(z.object({ employeeHash: bytes32HashSchema }), "params"),
  (req, res, next) => employeeController.getAttestationsByHash(req, res, next)
);

// GET /api/employees/wallet/:address/attestations
router.get(
  "/wallet/:address/attestations",
  validate(z.object({ address: ethereumAddressSchema }), "params"),
  (req, res, next) => employeeController.getAttestationsByWallet(req, res, next)
);

export default router;
