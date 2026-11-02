import { NextResponse } from "next/server";
import { addQuestion, getEventQuestions } from "@/lib/bff";

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
  const { eventId } = await params;
  const body = await req.json().catch(() => null);

  if (!body?.name || !body?.question) {
    return NextResponse.json(
      { error: "name and question are required" },
      { status: 400 },
    );
  }

  await addQuestion(eventId, {
    name: String(body.name),
    question: String(body.question),
    panelTitle: body.panelTitle ? String(body.panelTitle) : undefined,
    speakerName: body.speakerName ? String(body.speakerName) : undefined,
  });
  // No question echoed back: it's unmoderated until an admin marks it
  // relevant, so it must not appear in the asker's own list either.
  return NextResponse.json({ ok: true }, { status: 201 });
}
