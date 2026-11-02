import { NextResponse } from "next/server";

// Contact form endpoint. Validates the payload and returns success, but
// doesn't deliver it anywhere yet — wire this up to an email provider
// (e.g. Resend, SES) or a Pulse/CRM endpoint once one is chosen.
export async function POST(req: Request) {
  const body = await req.json().catch(() => null);

  if (!body?.name || !body?.email || !body?.message) {
    return NextResponse.json(
      { error: "name, email and message are required" },
      { status: 400 },
    );
  }

  // Placeholder until a real delivery channel (email/CRM) is wired in.
  console.log("[contact] new message:", {
    name: body.name,
    email: body.email,
    phone: body.phone ?? null,
    subject: body.subject ?? null,
    message: body.message,
  });

  return NextResponse.json({ ok: true });
}
