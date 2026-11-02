import { NextResponse } from "next/server";
import { addQuestion, getEventQuestions } from "@/lib/bff";
import { addQuestionSchema } from "@/lib/validation/bff";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Thin HTTP wrapper around lib/bff so the Q&A tab (a Client Component)
// can poll for new questions and submit its own — see
// components/events/tabs/QA.tsx.

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const { eventId } = await params;
  const questions = await getEventQuestions(eventId);
  return NextResponse.json({ questions });
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ eventId: string }> },
) {
  const limited = rateLimit(`question:${clientIp(req)}`, { limit: 10, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const { eventId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = addQuestionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  await addQuestion(eventId, parsed.data);
  // No question echoed back: it's unmoderated until an admin marks it
  // relevant, so it must not appear in the asker's own list either.
  return NextResponse.json({ ok: true }, { status: 201 });
}
