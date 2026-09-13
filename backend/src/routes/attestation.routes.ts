import { Router } from "express";
import { attestationController } from "../controllers/attestation.controller";
import { accessController } from "../controllers/access.controller";
import {
  validate,
  numericIdSchema,
  createAttestationSchema,
  requestAccessSchema,
  devTransactionSchema,
} from "../middleware/validate";
import { z } from "zod";

const router = Router();

// GET /api/attestations/:id
router.get(
  "/:id",
  validate(z.object({ id: numericIdSchema }), "params"),
  (req, res, next) => attestationController.getAttestation(req, res, next)
);

// POST /api/attestations
router.post(
  "/",
  validate(createAttestationSchema, "body"),
  (req, res, next) => attestationController.createAttestation(req, res, next)
);

// POST /api/attestations/:id/revoke
router.post(
  "/:id/revoke",
  validate(z.object({ id: numericIdSchema }), "params"),
  validate(devTransactionSchema, "body"),
  (req, res, next) => attestationController.revokeAttestation(req, res, next)
);

// GET /api/attestations/:id/access
router.get(
  "/:id/access",
  validate(z.object({ id: numericIdSchema }), "params"),
  (req, res, next) => attestationController.checkDocumentAccess(req, res, next)
);

// POST /api/attestations/:id/access-request
router.post(
  "/:id/access-request",
  validate(z.object({ id: numericIdSchema }), "params"),
  validate(requestAccessSchema, "body"),
  (req, res, next) => accessController.requestDocumentAccess(req, res, next)
);

export default router;
