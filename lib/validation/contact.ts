import { z } from "zod";

/**
 * Server-side schema for POST /api/contact — the client form
 * (components/contact/ContactForm.tsx) already has `required`/`type="email"`
 * on its inputs, but that's a UX nicety, never a security boundary: a
 * request can always skip the browser entirely. `website` is a honeypot
 * field (visually hidden in the form, never filled by a real visitor) —
 * present in the schema so a bot submitting a value for it still parses,
 * the route handler is what actually acts on it.
 */
export const contactSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.email().max(254),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().max(200).optional().or(z.literal("")),
  message: z.string().trim().min(20).max(5000),
  website: z.string().max(200).optional().or(z.literal("")),
});

export type ContactInput = z.infer<typeof contactSchema>;
