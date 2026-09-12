import { Router } from "express";
import { employerController } from "../controllers/employer.controller";

const router = Router();

router.post("/register", (req, res, next) => employerController.registerEmployer(req, res, next));
router.post("/attestation/prepare", (req, res, next) => employerController.prepareAttestation(req, res, next));

export default router;
