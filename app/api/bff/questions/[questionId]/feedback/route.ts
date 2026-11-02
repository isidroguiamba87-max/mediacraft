import { NextResponse } from "next/server";
import { voteQuestionFeedback } from "@/lib/bff";
import { questionFeedbackSchema } from "@/lib/validation/bff";
import { clientIp, rateLimit } from "@/lib/rate-limit";

// Thin HTTP wrapper so the Q&A tab (a Client Component) can record a
// helpful/unhelpful vote on one answer, or undo one just cast by mistake
// — see components/events/tabs/QuestionFeedback.tsx.

export async function POST(
  req: Request,
  { params }: { params: Promise<{ questionId: string }> },
) {
  const limited = rateLimit(`feedback:${clientIp(req)}`, { limit: 60, windowMs: 10 * 60 * 1000 });
  if (!limited.ok) {
    return NextResponse.json({ error: "too many requests" }, { status: 429 });
  }

  const { questionId } = await params;
  const body = await req.json().catch(() => null);
  const parsed = questionFeedbackSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid payload" }, { status: 400 });
  }

  await voteQuestionFeedback(questionId, parsed.data.type, parsed.data.action ?? "vote");
  return NextResponse.json({ ok: true });
}
