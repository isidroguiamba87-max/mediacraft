import { NextResponse } from "next/server";
import { z } from "zod";
import { clientIp, rateLimit } from "@/lib/rate-limit";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { addPanelMessage, isValidPanelToken, listPanelMessages } from "@/lib/supabase/panelRoom";

/**
 * Panelists' interaction space (2026-11-13). GET = the messages, POST = add
 * one. Both only work with the event's private link token (generated in
 * the admin's "Interação"); a wrong/old token gets a 404, same as no page.
 */
const postSchema = z.object({
  name: z.string().trim().min(1).max(80),
  message: z.string().trim().min(1).max(2000),
});

async function guard(eventId: string, token: string) {
  if (!isSupabaseConfigured) return NextResponse.json({ error: "unavailable" }, { status: 503 });
  try {
    if (!(await isValidPanelToken(eventId, token))) return NextResponse.json({ error: "not found" }, { status: 404 });
  } catch {
    return NextResponse.json({ error: "unavailable" }, { status: 503 });
  }
  return null;
}

export async function GET(_req: Request, { params }: { params: Promise<{ eventId: string; token: string }> }) {
  const { eventId, token } = await params;
  const blocked = await guard(eventId, token);
  if (blocked) return blocked;
  const messages = await listPanelMessages(eventId).catch(() => null);
  if (!messages) return NextResponse.json({ error: "failed" }, { status: 500 });
  return NextResponse.json({ messages }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(req: Request, { params }: { params: Promise<{ eventId: string; token: string }> }) {
  const { eventId, token } = await params;
  const limited = rateLimit(`panel:${clientIp(req)}`, { limit: 20, windowMs: 60 * 1000 });
  if (!limited.ok) return NextResponse.json({ error: "too many requests" }, { status: 429 });

  const blocked = await guard(eventId, token);
  if (blocked) return blocked;

  const parsed = postSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid payload" }, { status: 400 });

  try {
    await addPanelMessage(eventId, parsed.data.name, parsed.data.message);
  } catch {
    return NextResponse.json({ error: "failed" }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
