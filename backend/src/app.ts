import express from "express";
import cors from "cors";
import { config } from "./config/env";
import employerRoutes from "./routes/employer.routes";
import employeeRoutes from "./routes/employee.routes";
import verificationRoutes from "./routes/verification.routes";
import documentRoutes from "./routes/document.routes";
import { errorHandler } from "./middleware/errorHandler";

const app = express();

// Middleware
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "healthy",
    service: "WorkProof Backend",
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.use("/api/employer", employerRoutes);
app.use("/api/employee", employeeRoutes);
app.use("/api/verification", verificationRoutes);
app.use("/api/document", documentRoutes);

// Centralized error handler
app.use(errorHandler);

export default app;
