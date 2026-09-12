import { Router } from "express";
import { verificationController } from "../controllers/verification.controller";

const router = Router();

router.get("/attestation/:attestationId", (req, res, next) => verificationController.verifyAttestation(req, res, next));
router.post("/document/verify", (req, res, next) => verificationController.verifyDocumentIntegrity(req, res, next));

export default router;
