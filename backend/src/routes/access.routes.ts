import { Router } from "express";
import { accessController } from "../controllers/access.controller";
import {
  validate,
  numericIdSchema,
  devTransactionSchema,
} from "../middleware/validate";
import { z } from "zod";

const router = Router();

// GET /api/access-requests/:id
router.get(
  "/:id",
  validate(z.object({ id: numericIdSchema }), "params"),
  (req, res, next) => accessController.getAccessRequest(req, res, next)
);

// POST /api/access-requests/:id/approve
router.post(
  "/:id/approve",
  validate(z.object({ id: numericIdSchema }), "params"),
  validate(devTransactionSchema, "body"),
  (req, res, next) => accessController.approveDocumentAccess(req, res, next)
);

// POST /api/access-requests/:id/reject
router.post(
  "/:id/reject",
  validate(z.object({ id: numericIdSchema }), "params"),
  validate(devTransactionSchema, "body"),
  (req, res, next) => accessController.rejectDocumentAccess(req, res, next)
);

export default router;
