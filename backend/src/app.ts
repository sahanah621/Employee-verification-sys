import express from "express";
import cors from "cors";
import { config } from "./config/env";
import employerRoutes from "./routes/employer.routes";
import attestationRoutes from "./routes/attestation.routes";
import employeeRoutes from "./routes/employee.routes";
import accessRoutes from "./routes/access.routes";
import documentRoutes from "./routes/document.routes";
import { errorHandler } from "./middleware/errorHandler";
import { blockchainService } from "./services/blockchain.service";

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health Check Endpoint (Both /health and /api/health)
const healthHandler = async (req: express.Request, res: express.Response) => {
  const blockchainHealth = await blockchainService.checkHealth();
  const isHealthy = blockchainHealth.connected;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? "healthy" : "degraded",
    service: "WorkProof Backend",
    timestamp: new Date().toISOString(),
    blockchain: blockchainHealth,
  });
};

app.get("/health", healthHandler);
app.get("/api/health", healthHandler);

// API Routes
app.use("/api/employers", employerRoutes);
app.use("/api/attestations", attestationRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/access-requests", accessRoutes);

// Backwards-compatible singular path aliases
app.use("/api/employer", employerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/document", documentRoutes);
app.use("/api/documents", documentRoutes);

// 404 Route Handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Route ${req.method} ${req.originalUrl} not found`,
    },
  });
});

// Centralized error handler
app.use(errorHandler);

export default app;
