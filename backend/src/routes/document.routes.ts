import { Router } from "express";
import multer from "multer";
import { documentController } from "../controllers/document.controller";

const router = Router();

// Configure Multer with in-memory buffer storage and 10MB file limit
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB maximum file size
  },
  fileFilter: (_req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "image/png",
      "image/jpeg",
      "image/jpg",
      "text/plain",
    ];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: PDF, PNG, JPEG, TXT.`));
    }
  },
});

// Multipart document upload -> SHA-256 hash -> AES-256-GCM encrypt -> Pin to IPFS
router.post("/upload", upload.single("document"), (req, res, next) =>
  documentController.uploadSupportingDocument(req, res, next)
);

// Canonicalize and hash employment record & employee identifier
router.post("/prepare", (req, res, next) =>
  documentController.prepareAttestation(req, res, next)
);

// Decrypt supporting document with on-chain access control
router.get("/:attestationId/decrypt", (req, res, next) =>
  documentController.getDecryptedDocument(req, res, next)
);

// Backwards-compatible CID path
router.get("/cid/:cid/decrypt", (req, res, next) =>
  documentController.getDecryptedDocument(req, res, next)
);

export default router;
