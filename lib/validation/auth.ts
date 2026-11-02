import { z } from "zod";

export const loginSchema = z.object({
  email: z.email().max(254),
  password: z.string().min(1).max(200),
});

export const mfaCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, "O código tem de ter 6 dígitos."),
});
