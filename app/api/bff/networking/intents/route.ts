import { NextResponse } from "next/server";
import { addNetworkingIntent } from "@/lib/bff";

// Thin HTTP wrapper so ConnectModal (a Client Component) can persist a
// real networking intent — see lib/networking/endpoints.ts's
// createNetworkingIntent, which calls this before resolving where to
// redirect.

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (
    !body?.eventId ||
    !body?.speakerId ||
    !body?.source ||
    !body?.connectionReason ||
    !body?.channel ||
    !body?.attendeeId
  ) {
    return NextResponse.json({ error: "missing required fields" }, { status: 400 });
  }

  await addNetworkingIntent({
    eventId: String(body.eventId),
    speakerId: String(body.speakerId),
    sessionId: body.sessionId ? String(body.sessionId) : null,
    source: body.source === "session" ? "session" : "speakers_directory",
    connectionReason: String(body.connectionReason),
    channel: String(body.channel),
    attendeeId: String(body.attendeeId),
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}
