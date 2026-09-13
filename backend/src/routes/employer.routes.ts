import { Router } from "express";
import { employerController } from "../controllers/employer.controller";
import {
  validate,
  ethereumAddressSchema,
  registerEmployerSchema,
} from "../middleware/validate";
import { z } from "zod";

const router = Router();

// GET /api/employers/:address/status
router.get(
  "/:address/status",
  validate(z.object({ address: ethereumAddressSchema }), "params"),
  (req, res, next) => employerController.getEmployerStatus(req, res, next)
);

// GET /api/employers/:address/profile
router.get(
  "/:address/profile",
  validate(z.object({ address: ethereumAddressSchema }), "params"),
  (req, res, next) => employerController.getEmployerProfile(req, res, next)
);

// GET /api/employers/:address/attestations
router.get(
  "/:address/attestations",
  validate(z.object({ address: ethereumAddressSchema }), "params"),
  (req, res, next) => employerController.getEmployerAttestations(req, res, next)
);

// POST /api/employers/register
router.post(
  "/register",
  validate(registerEmployerSchema, "body"),
  (req, res, next) => employerController.registerEmployer(req, res, next)
);

export default router;
