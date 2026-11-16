import { z } from "zod";

/** app/api/bff/networking/intents POST — see lib/bff/addNetworkingIntent. */
export const networkingIntentSchema = z.object({
  eventId: z.string().trim().min(1).max(200),
  speakerId: z.string().trim().min(1).max(200),
  sessionId: z.string().trim().max(200).nullable().optional(),
  source: z.enum(["session", "speakers_directory"]),
  connectionReason: z.enum(["negocio", "parceria", "tema", "carreira", "investimento", "outro"]),
  channel: z.enum(["linkedin", "whatsapp", "other"]),
  attendeeId: z.string().trim().min(1).max(200),
});

/** [locale]/eventos/[eventId]/rating-actions.ts submitRatingAction — see
 * lib/bff/submitRating. */
export const submitRatingSchema = z.object({
  eventId: z.string().trim().min(1).max(200),
  formId: z.string().trim().min(1).max(200),
  stars: z.number().int().min(1).max(5),
  comment: z.string().trim().max(1000).optional(),
  answers: z
    .array(z.object({ questionId: z.string().trim().min(1).max(200), value: z.unknown() }))
    .max(50)
    .optional(),
  sessionId: z.string().trim().max(200).nullable().optional(),
});
