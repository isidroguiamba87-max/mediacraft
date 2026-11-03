import { createClient } from "./server";
import { finalizeImageUpload, finalizeVideoUpload } from "./mediaUpload";
import { logAdminAction } from "./auditLog";

export type NewsStatus = "draft" | "scheduled" | "published";

export interface AdminNewsItem {
  id: string;
  eventId: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  coverUrl: string | null;
  status: NewsStatus;
  featured: boolean;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

interface NewsRow {
  id: string;
  event_id: string | null;
  title: string;
  summary: string | null;
  body: string | null;
  cover_url: string | null;
  status: NewsStatus;
  featured: boolean;
  published_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRow(row: NewsRow): AdminNewsItem {
  return {
    id: row.id,
    eventId: row.event_id,
    title: row.title,
    summary: row.summary,
    body: row.body,
    coverUrl: row.cover_url,
    status: row.status,
    featured: row.featured,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Every news item, newest first — the admin list (all statuses, all
 * events; the public site filters to status='published' itself via RLS,
 * see lib/bff). */
export async function listNews(): Promise<AdminNewsItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data as NewsRow[]).map(mapRow);
}

export async function getNewsById(id: string): Promise<AdminNewsItem | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.from("news").select("*").eq("id", id).maybeSingle();

  if (error) throw error;
  return data ? mapRow(data as NewsRow) : null;
}

export interface NewsInput {
  eventId: string | null;
  title: string;
  summary: string;
  body: string;
  coverUrl: string | null;
  status: NewsStatus;
  featured: boolean;
  publishedAt: string | null;
}

export async function createNews(input: NewsInput): Promise<AdminNewsItem> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .insert({
      event_id: input.eventId,
      title: input.title,
      summary: input.summary || null,
      body: input.body || null,
      cover_url: input.coverUrl,
      status: input.status,
      featured: input.featured,
      published_at: input.publishedAt,
    })
    .select("*")
    .single();

  if (error) throw error;
  const created = mapRow(data as NewsRow);
  await logAdminAction("news.create", `news:${created.id}`, { title: created.title, status: created.status });
  return created;
}

export async function updateNews(id: string, input: NewsInput): Promise<AdminNewsItem> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news")
    .update({
      event_id: input.eventId,
      title: input.title,
      summary: input.summary || null,
      body: input.body || null,
      cover_url: input.coverUrl,
      status: input.status,
      featured: input.featured,
      published_at: input.publishedAt,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();

  if (error) throw error;
  const updated = mapRow(data as NewsRow);
  await logAdminAction("news.update", `news:${updated.id}`, { title: updated.title, status: updated.status });
  return updated;
}

export async function deleteNews(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("news").delete().eq("id", id);
  if (error) throw error;
  await logAdminAction("news.delete", `news:${id}`);
}

/** Finishes a cover image upload — `tempPath` already holds the raw file,
 * uploaded directly from the browser (see lib/supabase/clientUpload.ts
 * and finalizeImageUpload for why: a Server Action's own request body is
 * capped well below what a real photo needs on Vercel). */
export async function uploadNewsCover(tempPath: string): Promise<string> {
  const supabase = await createClient();
  return finalizeImageUpload(supabase, tempPath, "news");
}

/** Extra photos/video attached to a news item, beyond its single cover —
 * same idea as gallery_media, scoped to one news item instead of one
 * event (see lib/supabase/gallery.ts for the twin implementation). */
export type NewsMediaType = "image" | "video";

export interface AdminNewsMediaItem {
  id: string;
  newsId: string;
  type: NewsMediaType;
  storageUrl: string | null;
  externalVideoUrl: string | null;
  caption: string | null;
  sortOrder: number;
  createdAt: string;
}

interface NewsMediaRow {
  id: string;
  news_id: string;
  type: NewsMediaType;
  storage_url: string | null;
  external_video_url: string | null;
  caption: string | null;
  sort_order: number;
  created_at: string;
}

function mapMediaRow(row: NewsMediaRow): AdminNewsMediaItem {
  return {
    id: row.id,
    newsId: row.news_id,
    type: row.type,
    storageUrl: row.storage_url,
    externalVideoUrl: row.external_video_url,
    caption: row.caption,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

export async function listNewsMedia(newsId: string): Promise<AdminNewsMediaItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("news_media")
    .select("*")
    .eq("news_id", newsId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data as NewsMediaRow[]).map(mapMediaRow);
}

/** Uploads one image to Storage and creates its row — called once per
 * file for a multi-file upload, so one bad file never blocks the rest
 * (same pattern as addGalleryImage). */
export async function addNewsImage(newsId: string, caption: string, tempPath: string): Promise<AdminNewsMediaItem> {
  const supabase = await createClient();
  const publicUrl = await finalizeImageUpload(supabase, tempPath, "news");

  const { data, error } = await supabase
    .from("news_media")
    .insert({
      news_id: newsId,
      type: "image",
      storage_url: publicUrl,
      caption: caption || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapMediaRow(data as NewsMediaRow);
}

export async function addNewsVideo(
  newsId: string,
  caption: string,
  externalVideoUrl: string | null,
  tempPath: string | null,
): Promise<AdminNewsMediaItem> {
  const supabase = await createClient();
  const storageUrl = tempPath ? await finalizeVideoUpload(supabase, tempPath, "news") : null;

  const { data, error } = await supabase
    .from("news_media")
    .insert({
      news_id: newsId,
      type: "video",
      storage_url: storageUrl,
      external_video_url: externalVideoUrl || null,
      caption: caption || null,
    })
    .select("*")
    .single();

  if (error) throw error;
  return mapMediaRow(data as NewsMediaRow);
}

export async function deleteNewsMedia(id: string): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.from("news_media").delete().eq("id", id);
  if (error) throw error;
}
