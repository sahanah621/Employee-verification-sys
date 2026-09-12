import { Router } from "express";
import { employeeController } from "../controllers/employee.controller";

const router = Router();

router.get("/:employeeAddress/attestations", (req, res, next) => employeeController.getAttestations(req, res, next));
router.get("/:employeeAddress/requests", (req, res, next) => employeeController.getAccessRequests(req, res, next));

export default router;
