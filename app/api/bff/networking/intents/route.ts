import { NextResponse } from "next/server";
import { addNetworkingIntent } from "@/lib/bff";
import { networkingIntentSchema } from "@/lib/validation/bff";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Thin HTTP wrapper so ConnectModal (a Client Component) can persist a
// real networking intent — see lib/networking/endpoints.ts's
// createNetworkingIntent, which calls this before resolving where to
// redirect.

export async function POST(req: Request) {
  const limited = rateLimit(`networking:${clientIp(req)}`, { limit: 20, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = networkingIntentSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  await addNetworkingIntent({ ...parsed.data, sessionId: parsed.data.sessionId ?? null });

  return NextResponse.json({ ok: true }, { status: 201 });
}
