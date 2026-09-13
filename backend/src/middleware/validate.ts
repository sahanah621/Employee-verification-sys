import { Request, Response, NextFunction } from "express";
import { z, ZodError } from "zod";

// --- Common Zod Schemas ---

export const ethereumAddressSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{40}$/, {
    message: "Invalid Ethereum address format (expected 0x followed by 40 hex characters)",
  });

export const bytes32HashSchema = z
  .string()
  .trim()
  .regex(/^0x[a-fA-F0-9]{64}$/, {
    message: "Invalid bytes32 hash format (expected 0x followed by 64 hex characters)",
  });

export const numericIdSchema = z.coerce
  .number()
  .int({ message: "ID must be an integer" })
  .positive({ message: "ID must be a positive number greater than zero" });

// --- Request Body Schemas ---

export const registerEmployerSchema = z.object({
  employerName: z
    .string({ required_error: "employerName is required" })
    .trim()
    .min(1, { message: "employerName cannot be empty" })
    .max(100, { message: "employerName cannot exceed 100 characters" }),
  // Optional dev/testing private key strictly for automated testing/CLI
  devPrivateKey: z.string().optional(),
});

export const createAttestationSchema = z
  .object({
    employee: ethereumAddressSchema,
    employeeHash: bytes32HashSchema,
    position: z
      .string({ required_error: "position is required" })
      .trim()
      .min(1, { message: "position cannot be empty" })
      .max(120, { message: "position cannot exceed 120 characters" }),
    startDate: z
      .number({ required_error: "startDate timestamp is required" })
      .int()
      .positive({ message: "startDate must be a positive Unix timestamp" }),
    endDate: z
      .number()
      .int()
      .nonnegative({ message: "endDate must be a non-negative Unix timestamp" })
      .optional()
      .default(0),
    recordHash: bytes32HashSchema,
    documentHash: bytes32HashSchema
      .optional()
      .or(z.literal(""))
      .or(z.literal("0x0000000000000000000000000000000000000000000000000000000000000000")),
    ipfsCID: z.string().trim().optional().default(""),
    // Optional dev/testing private key strictly for automated testing/CLI
    devPrivateKey: z.string().optional(),
  })
  .refine(
    (data) => data.endDate === 0 || data.endDate >= data.startDate,
    {
      message: "endDate must be greater than or equal to startDate",
      path: ["endDate"],
    }
  );

export const requestAccessSchema = z.object({
  requestType: z
    .string()
    .trim()
    .min(1, { message: "requestType cannot be empty" })
    .default("EMPLOYMENT_VERIFICATION"),
  // Optional dev/testing private key strictly for automated testing/CLI
  devPrivateKey: z.string().optional(),
});

export const devTransactionSchema = z.object({
  // Optional dev/testing private key strictly for automated testing/CLI
  devPrivateKey: z.string().optional(),
});

// --- Middleware Generator ---

type ValidationTarget = "body" | "params" | "query";

export function validate(schema: z.ZodSchema<any>, target: ValidationTarget = "body") {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[target]);
      req[target] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const issues = error.errors.map((e) => ({
          field: e.path.join("."),
          message: e.message,
        }));
        res.status(400).json({
          success: false,
          error: {
            message: "Validation Error",
            details: issues,
          },
        });
        return;
      }
      next(error);
    }
  };
}
