"use server";

import { submitRating as submitRatingBff, type SubmitRatingInput } from "@/lib/bff";

/** Thin Server Action wrapper so the public RatingPopup (a Client
 * Component) can call into the Supabase-backed submitRating without a
 * dedicated API route. */
export async function submitRatingAction(input: SubmitRatingInput) {
  await submitRatingBff(input);
}
