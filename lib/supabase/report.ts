import { createClient } from "./server";
import { getEvent } from "@/lib/pulse/endpoints";

export interface ReportRating {
  stars: number;
  comment: string | null;
}

export interface ReportQuestion {
  name: string;
  question: string;
  answer: string | null;
}

export interface ReportGalleryItem {
  id: string;
  type: "image" | "video";
  storageUrl: string | null;
  externalVideoUrl: string | null;
  caption: string | null;
}

export interface ReportData {
  event: {
    title: string;
    scheduleDates: { date: string; timeFrom: string; timeTo: string }[];
    locationName: string | null;
    ticketsSold: number;
    ticketsTotal: number;
    sessionsCount: number;
    speakersCount: number;
  } | null;
  ratings: ReportRating[];
  averageStars: number;
  starDistribution: Record<1 | 2 | 3 | 4 | 5, number>;
  strengths: ReportRating[];
  improvements: ReportRating[];
  relevantQuestions: ReportQuestion[];
  gallery: ReportGalleryItem[];
}

/** Everything the post-event report page needs, from both sources: Pulse
 * (read-only, for the factual event summary — registrations, sessions,
 * speakers) and Supabase (ratings, moderated questions, gallery — all
 * already built in earlier phases, just queried together here). No new
 * data is written anywhere; this is purely a read/compose step. */
export async function getReportData(eventId: string): Promise<ReportData> {
  const supabase = await createClient();

  const [pulseResult, ratingsRes, questionsRes, galleryRes] = await Promise.all([
    getEvent(eventId),
    supabase.from("ratings").select("stars, comment").eq("event_id", eventId),
    supabase
      .from("questions")
      .select("name, question, answer")
      .eq("event_id", eventId)
      .eq("is_relevant", true),
    supabase
      .from("gallery_media")
      .select("id, type, storage_url, external_video_url, caption")
      .eq("event_id", eventId)
      .eq("published", true),
  ]);

  if (ratingsRes.error) throw ratingsRes.error;
  if (questionsRes.error) throw questionsRes.error;
  if (galleryRes.error) throw galleryRes.error;

  const ratings = ratingsRes.data as ReportRating[];
  const starDistribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of ratings) {
    if (r.stars >= 1 && r.stars <= 5) starDistribution[r.stars as 1 | 2 | 3 | 4 | 5] += 1;
  }
  const averageStars =
    ratings.length > 0 ? ratings.reduce((sum, r) => sum + r.stars, 0) / ratings.length : 0;

  // Simple, honest heuristic — not sentiment analysis: a 4-5 star
  // comment reads as a strength, 1-2 stars as something to improve.
  // 3-star comments are neutral and left out of both lists.
  const strengths = ratings.filter((r) => r.stars >= 4 && r.comment);
  const improvements = ratings.filter((r) => r.stars <= 2 && r.comment);

  const pulseEvent = pulseResult.event;
  const ticketsSold = pulseEvent?.tickets.reduce((sum, t) => sum + t.quantitySold, 0) ?? 0;
  const ticketsTotal = pulseEvent?.tickets.reduce((sum, t) => sum + t.quantity, 0) ?? 0;
  const sessionsCount = pulseEvent?.sections.reduce((sum, s) => sum + s.sessions.length, 0) ?? 0;

  return {
    event: pulseEvent
      ? {
          title: pulseEvent.title,
          scheduleDates: pulseEvent.scheduleDates,
          locationName: pulseEvent.location?.name ?? null,
          ticketsSold,
          ticketsTotal,
          sessionsCount,
          speakersCount: pulseEvent.speakers.length,
        }
      : null,
    ratings,
    averageStars,
    starDistribution,
    strengths,
    improvements,
    relevantQuestions: questionsRes.data as ReportQuestion[],
    gallery: galleryRes.data.map((g) => ({
      id: g.id,
      type: g.type,
      storageUrl: g.storage_url,
      externalVideoUrl: g.external_video_url,
      caption: g.caption,
    })),
  };
}
