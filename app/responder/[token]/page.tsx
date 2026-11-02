import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MessageCircleQuestion } from "lucide-react";
import { resolveSpeakerToken } from "@/lib/supabase/speakerLinks";
import { getQuestionsForSpeaker } from "@/lib/supabase/questions";
import { getEvent } from "@/lib/pulse/endpoints";
import { formatDate } from "@/lib/utils";
import { AnswerForm } from "@/components/responder/AnswerForm";

export const metadata: Metadata = { title: "Responder a perguntas — MediaCraft" };

interface ResponderPageProps {
  params: Promise<{ token: string }>;
}

/**
 * Per-speaker answer link (2026-10-09): an admin copies this from the
 * Perguntas panel and sends it straight to a panelist, who lands here
 * with no login — just the questions addressed to them for this one
 * event, each with its own reply box. Outside [locale] on purpose (see
 * proxy.ts), same reasoning as /admin: a short link meant to be pasted
 * into WhatsApp/email, not part of the translated public site.
 */
export default async function ResponderPage({ params }: ResponderPageProps) {
  const { token } = await params;

  const scope = await resolveSpeakerToken(token);
  if (!scope) notFound();

  const [{ event }, questions] = await Promise.all([
    getEvent(scope.eventId),
    getQuestionsForSpeaker(scope.eventId, scope.speakerName),
  ]);

  return (
    <div className="min-h-screen bg-paper-2">
      <header className="border-b border-line bg-brand-navy px-6 py-8 text-white">
        <div className="mx-auto max-w-2xl">
          <p className="font-mono text-[11px] font-semibold tracking-[0.14em] text-brand-red uppercase">
            {event?.title ?? "Evento"}
          </p>
          <h1 className="mt-2 flex items-center gap-2 font-display text-2xl">
            <MessageCircleQuestion size={24} className="shrink-0 text-brand-red" />
            Olá, {scope.speakerName}
          </h1>
          <p className="mt-2 text-sm text-white/75">
            Estas são as perguntas do público endereçadas a si. Responda aqui — a resposta aparece
            automaticamente na página do evento.
          </p>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-6 py-10">
        {questions.length === 0 ? (
          <p className="text-sm text-slate">Ainda não há perguntas para si neste evento.</p>
        ) : (
          <ul className="flex flex-col gap-5">
            {questions.map((q) => (
              <li key={q.id} className="rounded-brand border border-line bg-paper p-5">
                <p className="text-xs font-semibold text-brand-navy">{q.name}</p>
                <p className="mt-1.5 w-fit max-w-[90%] rounded-2xl rounded-tl-sm bg-paper-2 px-4 py-2.5 text-sm text-ink">
                  {q.question}
                </p>
                <p className="mt-1.5 text-[11px] text-slate">
                  {formatDate(q.createdAt, "pt", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                </p>

                <AnswerForm token={token} questionId={q.id} initialAnswer={q.answer} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
