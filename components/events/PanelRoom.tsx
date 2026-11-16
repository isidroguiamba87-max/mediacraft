"use client";

import { useCallback, useEffect, useRef, useState, type SubmitEvent } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Send } from "lucide-react";
import type { PanelMessage } from "@/lib/supabase/panelRoom";

const POLL_MS = 5000;
const NAME_KEY = "mediacraft:panel-room-name";

/**
 * The panelists' interaction space (2026-11-13): a message box (name is
 * remembered on this device) and every message posted with the same private
 * link, refreshed every few seconds while the page is open. Replaces the
 * public "Perguntas" tab.
 */
export function PanelRoom({ eventId, token }: { eventId: string; token: string }) {
  const t = useTranslations("panelRoom");
  const locale = useLocale();
  const api = `/api/panel/${encodeURIComponent(eventId)}/${encodeURIComponent(token)}`;
  const [messages, setMessages] = useState<PanelMessage[] | null>(null);
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "error">("idle");
  const listRef = useRef<HTMLDivElement>(null);
  const lastCount = useRef(0);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(NAME_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time read of a per-device convenience
      if (saved) setName(saved);
    } catch {
      /* storage blocked — the field just starts empty */
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const res = await fetch(api, { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as { messages: PanelMessage[] };
      setMessages(data.messages);
    } catch {
      /* offline for a moment — next poll retries */
    }
  }, [api]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount, then poll
    void load();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);
    return () => clearInterval(id);
  }, [load]);

  // keep the newest message in view when new ones arrive
  useEffect(() => {
    const n = messages?.length ?? 0;
    if (n > lastCount.current && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
    lastCount.current = n;
  }, [messages]);

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!name.trim() || !text.trim()) return;
    setStatus("sending");
    try {
      const res = await fetch(api, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), message: text.trim() }),
      });
      if (!res.ok) throw new Error("failed");
      try {
        localStorage.setItem(NAME_KEY, name.trim());
      } catch {
        /* ignore */
      }
      setText("");
      setStatus("idle");
      await load();
    } catch {
      setStatus("error");
    }
  }

  const time = (iso: string) =>
    new Intl.DateTimeFormat(locale, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }).format(
      new Date(iso),
    );

  return (
    <div className="mx-auto grid max-w-container gap-6 px-4 pb-16 font-body sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)] lg:px-10">
      {/* write */}
      <form
        onSubmit={onSubmit}
        className="h-fit rounded-[1.5rem] border border-brand-red/50 bg-white p-6 shadow-sm sm:p-8 lg:sticky lg:top-6"
      >
        <h2 className="text-brand-red">
          <span className="block font-body text-xl font-bold tracking-wide uppercase sm:text-2xl">{t("title")}</span>
        </h2>
        <p className="mt-1 text-sm text-slate">{t("intro")}</p>

        <label className="mt-6 block">
          <span className="mb-1.5 block text-[13px] font-bold text-brand-navy">{t("name")}</span>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={80}
            required
            autoComplete="name"
            className="h-11 w-full rounded-[10px] border border-brand-red/55 bg-white px-3.5 text-sm text-ink outline-none focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/15"
          />
        </label>
        <label className="mt-4 block">
          <span className="mb-1.5 block text-[13px] font-bold text-brand-navy">{t("message")}</span>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            maxLength={2000}
            required
            rows={5}
            placeholder={t("placeholder")}
            className="w-full resize-none rounded-[10px] border border-brand-red/55 bg-white px-3.5 py-3 text-sm text-ink outline-none placeholder:text-slate/80 focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/15"
          />
        </label>
        <button
          type="submit"
          disabled={status === "sending" || !name.trim() || !text.trim()}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-brand-red px-6 py-2.5 text-sm font-bold tracking-wide text-white uppercase transition-colors hover:bg-brand-red-deep disabled:opacity-50"
        >
          <Send aria-hidden className="h-4 w-4" />
          {status === "sending" ? t("sending") : t("send")}
        </button>
        {status === "error" && <p className="mt-3 text-sm text-brand-red">{t("error")}</p>}
      </form>

      {/* read */}
      <section aria-live="polite" className="rounded-[1.5rem] border border-line bg-paper-2 p-4 sm:p-6">
        <p className="px-2 text-xs font-bold tracking-[0.14em] text-brand-navy uppercase">
          {t("conversation")} {messages ? `· ${messages.length}` : ""}
        </p>
        <div ref={listRef} className="mt-3 flex max-h-[65vh] flex-col gap-3 overflow-y-auto px-1 pb-1">
          {messages === null ? (
            <p className="px-2 py-10 text-center text-sm text-slate">{t("loading")}</p>
          ) : messages.length === 0 ? (
            <p className="px-2 py-10 text-center text-sm text-slate">{t("empty")}</p>
          ) : (
            messages.map((m) => {
              const mine = name.trim() && m.name === name.trim();
              return (
                <article
                  key={m.id}
                  className={`max-w-[92%] rounded-2xl px-4 py-3 shadow-sm ${mine ? "self-end bg-brand-red/10" : "self-start bg-white"}`}
                >
                  <p className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-bold text-brand-navy">{m.name}</span>
                    <span className="text-[11px] text-slate">{time(m.createdAt)}</span>
                  </p>
                  <p className="mt-1 text-sm leading-relaxed whitespace-pre-line text-ink">{m.message}</p>
                </article>
              );
            })
          )}
        </div>
      </section>
    </div>
  );
}
