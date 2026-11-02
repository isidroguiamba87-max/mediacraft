"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  createNews,
  deleteNews,
  updateNews,
  uploadNewsCover,
  addNewsImage,
  addNewsVideo,
  deleteNewsMedia,
  type NewsInput,
  type NewsStatus,
} from "@/lib/supabase/news";
import { getEvent } from "@/lib/pulse/endpoints";

export interface EventPreview {
  title: string;
  coverUrl: string | null;
  scheduleText: string | null;
  locationName: string | null;
  ticketsSold: number;
  ticketsTotal: number;
  sessionsCount: number;
  speakersCount: number;
}

/** Read-only glance at a Pulse event, for the "Evento associado" picker in
 * the Novidades form — same data `/admin/pulse` shows, just condensed.
 * Never writes anything back to Pulse. */
export async function getEventPreviewAction(eventId: string): Promise<EventPreview | null> {
  if (!eventId) return null;
  const { event } = await getEvent(eventId);
  if (!event) return null;

  const ticketsSold = event.tickets.reduce((sum, t) => sum + t.quantitySold, 0);
  const ticketsTotal = event.tickets.reduce((sum, t) => sum + t.quantity, 0);
  const sessionsCount = event.sections.reduce((sum, s) => sum + s.sessions.length, 0);
  const scheduleText =
    event.scheduleDates.length > 0
      ? event.scheduleDates
          .map((d) => `${new Date(d.date).toLocaleDateString("pt-PT")} · ${d.timeFrom}–${d.timeTo}`)
          .join(" · ")
      : null;

  return {
    title: event.title,
    coverUrl: event.coverUrl,
    scheduleText,
    locationName: event.location?.name ?? null,
    ticketsSold,
    ticketsTotal,
    sessionsCount,
    speakersCount: event.speakers.length,
  };
}

function readNewsInput(formData: FormData): Omit<NewsInput, "coverUrl"> {
  const status = formData.get("status") as NewsStatus;
  const publishNow = status === "published";
  const scheduledFor = formData.get("publishedAt") as string;
  const eventId = String(formData.get("eventId") ?? "").trim();

  return {
    eventId: eventId || null,
    title: String(formData.get("title") ?? "").trim(),
    summary: String(formData.get("summary") ?? "").trim(),
    body: String(formData.get("body") ?? "").trim(),
    status,
    featured: formData.get("featured") === "on",
    publishedAt: publishNow
      ? new Date().toISOString()
      : scheduledFor
        ? new Date(scheduledFor).toISOString()
        : null,
  };
}

async function resolveCoverUrl(formData: FormData, existingUrl: string | null) {
  const file = formData.get("cover") as File | null;
  if (file && file.size > 0) {
    return uploadNewsCover(file);
  }
  // Checkbox: "remove the current cover and don't upload a new one".
  if (formData.get("removeCover") === "on") {
    return null;
  }
  return existingUrl;
}

export async function createNewsAction(formData: FormData) {
  const input = readNewsInput(formData);
  const coverUrl = await resolveCoverUrl(formData, null);

  if (!input.title) {
    throw new Error("Título é obrigatório.");
  }

  const created = await createNews({ ...input, coverUrl });
  revalidatePath("/admin/novidades");
  revalidatePath("/novidades");
  // Straight to the edit page, not the list — that's where photos/video
  // can now be attached (the news row has to exist first). `created=true`
  // drives the success toast there (NewsForm) — a Server Action that
  // redirects can't return a value to show one directly on this request.
  redirect(`/admin/novidades/${created.id}?created=true`);
}

export async function updateNewsAction(id: string, existingCoverUrl: string | null, formData: FormData) {
  const input = readNewsInput(formData);
  const coverUrl = await resolveCoverUrl(formData, existingCoverUrl);

  if (!input.title) {
    throw new Error("Título é obrigatório.");
  }

  await updateNews(id, { ...input, coverUrl });
  revalidatePath("/admin/novidades");
  revalidatePath(`/admin/novidades/${id}`);
  revalidatePath("/novidades");
  revalidatePath(`/novidades/${id}`);
  // Redirects back to itself — same reasoning as createNewsAction above:
  // `saved=true` drives NewsForm's success toast.
  redirect(`/admin/novidades/${id}?saved=true`);
}

export async function deleteNewsAction(id: string) {
  await deleteNews(id);
  revalidatePath("/admin/novidades");
  revalidatePath("/novidades");
}

export async function addNewsImagesAction(newsId: string, formData: FormData) {
  const caption = String(formData.get("caption") ?? "").trim();
  const files = formData.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  for (const file of files) {
    await addNewsImage(newsId, caption, file);
  }
  revalidatePath(`/admin/novidades/${newsId}`);
  revalidatePath(`/novidades/${newsId}`);
}

export async function addNewsVideoAction(newsId: string, formData: FormData) {
  const caption = String(formData.get("caption") ?? "").trim();
  const externalVideoUrl = String(formData.get("externalVideoUrl") ?? "").trim() || null;
  const file = formData.get("file") as File | null;
  await addNewsVideo(newsId, caption, externalVideoUrl, file && file.size > 0 ? file : null);
  revalidatePath(`/admin/novidades/${newsId}`);
  revalidatePath(`/novidades/${newsId}`);
}

export async function deleteNewsMediaAction(newsId: string, mediaId: string) {
  await deleteNewsMedia(mediaId);
  revalidatePath(`/admin/novidades/${newsId}`);
  revalidatePath(`/novidades/${newsId}`);
}
