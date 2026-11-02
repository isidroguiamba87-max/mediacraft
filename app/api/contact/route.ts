import { NextResponse } from "next/server";
import { contactSchema } from "@/lib/validation/contact";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Contact form endpoint. Validates the payload and returns success, but
// doesn't deliver it anywhere yet — wire this up to an email provider
// (e.g. Resend, SES) or a Pulse/CRM endpoint once one is chosen.
export async function POST(req: Request) {
  const ip = clientIp(req);
  const limited = rateLimit(`contact:${ip}`, { limit: 5, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const body = await req.json().catch(() => null);
  const parsed = contactSchema.safeParse(body);
  if (!parsed.success) {
    // Generic message — never echo back which field/why, that's for the
    // client's own `required`/`type="email"` hints to handle.
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  // Honeypot: a real visitor never sees or fills this field (see
  // ContactForm.tsx). A bot that fills every input gets a fake success so
  // it doesn't learn to skip the field next time — just never processed.
  if (parsed.data.website) {
    return NextResponse.json({ ok: true });
  }

  const { name, email, phone, subject, message } = parsed.data;

  // Placeholder until a real delivery channel (email/CRM) is wired in.
  console.log("[contact] new message:", { name, email, phone: phone || null, subject: subject || null, message });

  return NextResponse.json({ ok: true });
}
