"use server";

import { headers } from "next/headers";
import { submitRating as submitRatingBff, type SubmitRatingInput } from "@/lib/bff";
import { submitRatingSchema } from "@/lib/validation/bff";
import { rateLimit } from "@/lib/rate-limit";

/** Thin Server Action wrapper so the public RatingPopup (a Client
 * Component) can call into the Supabase-backed submitRating without a
 * dedicated API route. */
export async function submitRatingAction(input: SubmitRatingInput) {
  const forwarded = (await headers()).get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() ?? "unknown";
  const limited = rateLimit(`rating:${ip}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) throw new Error("too many requests");

  const parsed = submitRatingSchema.parse(input);
  await submitRatingBff(parsed);
}
