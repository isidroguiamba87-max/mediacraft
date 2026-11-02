import { NextResponse } from "next/server";
import { voteQuestionFeedback } from "@/lib/bff";

// Thin HTTP wrapper so the Q&A tab (a Client Component) can record a
// helpful/unhelpful vote on one answer, or undo one just cast by mistake
// — see components/events/tabs/QuestionFeedback.tsx.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const { questionId } = await params;
  const body = await req.json().catch(() => null);

  if (body?.type !== "helpful" && body?.type !== "unhelpful") {
    return NextResponse.json({ error: "type must be 'helpful' or 'unhelpful'" }, { status: 400 });
  }
  if (body?.action !== undefined && body.action !== "vote" && body.action !== "undo") {
    return NextResponse.json({ error: "action must be 'vote' or 'undo'" }, { status: 400 });
  }

  await voteQuestionFeedback(questionId, body.type, body.action ?? "vote");
  return NextResponse.json({ ok: true });
}
