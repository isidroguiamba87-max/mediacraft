import { createClient } from "./server";

export interface DashboardStats {
  ratingsCount: number;
  averageStars: number;
  starDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  galleryCount: number;
}

const EMPTY_DISTRIBUTION: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

/** All the numbers the Dashboard needs, in one place — scoped to one
 * event when `eventId` is given, otherwise across every event. Every
 * query here is a plain `count`/`select` against the admin's own
 * Supabase tables, so it relies on the `is_admin()` RLS policies already
 * in place (same as every other admin page). */
export async function getDashboardStats(eventId?: string): Promise<DashboardStats> {
  const supabase = await createClient();

  let ratingsQuery = supabase.from("ratings").select("stars", { count: "exact" });
  let galleryQuery = supabase.from("gallery_media").select("id", { count: "exact", head: true });

  if (eventId) {
    ratingsQuery = ratingsQuery.eq("event_id", eventId);
    galleryQuery = galleryQuery.eq("event_id", eventId);
  }

  const [ratingsRes, galleryRes] = await Promise.all([ratingsQuery, galleryQuery]);

  if (ratingsRes.error) throw ratingsRes.error;
  if (galleryRes.error) throw galleryRes.error;

  const stars = (ratingsRes.data ?? []).map((r) => r.stars as number);
  const starDistribution = { ...EMPTY_DISTRIBUTION };
  for (const s of stars) {
    if (s >= 1 && s <= 5) starDistribution[s as 1 | 2 | 3 | 4 | 5] += 1;
  }
  const averageStars = stars.length > 0 ? stars.reduce((a, b) => a + b, 0) / stars.length : 0;

  return {
    ratingsCount: stars.length,
    averageStars,
    starDistribution,
    galleryCount: galleryRes.count ?? 0,
  };
}
