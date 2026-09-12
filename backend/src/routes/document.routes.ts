import { Router } from "express";
import { documentController } from "../controllers/document.controller";

const router = Router();

router.post("/upload", (req, res, next) => documentController.uploadSupportingDocument(req, res, next));
router.get("/:cid/decrypt", (req, res, next) => documentController.getDecryptedDocument(req, res, next));

export default router;
