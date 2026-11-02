"use client";

import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Send, X } from "lucide-react";
import { initials } from "@/lib/utils";

interface ChatMessage {
  id: string;
  from: "me" | "them";
  text: string;
  time: string;
}

function now() {
  return new Date().toLocaleTimeString("pt-PT", { hour: "2-digit", minute: "2-digit" });
}

function greeting(peerRole: string) {
  return peerRole === "participant"
    ? "Olá! Em que posso ajudar?"
    : "Olá! Com todo o gosto respondo às tuas questões sobre a sessão.";
}

/**
 * Private 1:1 chat between a participant and a panelist. State is local
 * to this component (resets on close) — it's a UI demo, not a real
 * messaging backend. The organiser never sees message content, only that
 * a conversation happened (see ConsolePanel "Perguntas" views).
 */
export function ChatDrawer({
  open,
  onClose,
  peerName,
  peerRole,
  canEnd = false,
}: {
  open: boolean;
  onClose: () => void;
  peerName: string;
  peerRole: string;
  canEnd?: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <ChatDrawerPanel
          key={`${peerName}-${peerRole}`}
          onClose={onClose}
          peerName={peerName}
          peerRole={peerRole}
          canEnd={canEnd}
        />
      )}
    </AnimatePresence>
  );
}

/** Mounted fresh each time the drawer opens (see `key` above), so its
 * conversation state is naturally seeded per-mount — no effect needed. */
function ChatDrawerPanel({
  onClose,
  peerName,
  peerRole,
  canEnd,
}: {
  onClose: () => void;
  peerName: string;
  peerRole: string;
  canEnd: boolean;
}) {
  const t = useTranslations("pulse.chat");
  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    { id: "greet", from: "them", text: greeting(peerRole), time: now() },
  ]);
  const [draft, setDraft] = useState("");
  const [ended, setEnded] = useState(false);

  function send() {
    const text = draft.trim();
    if (!text || ended) return;
    setMessages((prev) => [...prev, { id: crypto.randomUUID(), from: "me", text, time: now() }]);
    setDraft("");
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: crypto.randomUUID(),
          from: "them",
          text: "Obrigado pela pergunta — respondo com mais detalhe já a seguir à sessão.",
          time: now(),
        },
      ]);
    }, 1000);
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40 bg-brand-navy/40 backdrop-blur-[2px]"
      />
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="fixed top-0 right-0 z-50 flex h-full w-full max-w-sm flex-col bg-paper shadow-brand"
      >
        <div className="flex items-center gap-3 border-b border-line p-5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-brand bg-brand-red font-display text-sm text-white">
            {initials(peerName)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-ink">{peerName}</p>
            <p className="truncate font-mono text-[11px] text-slate">{peerRole}</p>
          </div>
          {canEnd && !ended && (
            <button
              type="button"
              onClick={() => setEnded(true)}
              className="ml-auto shrink-0 rounded-full border border-brand-red/40 px-3 py-1.5 font-mono text-[10px] text-brand-red hover:bg-brand-red/5"
            >
              {t("end")}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ml-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-slate hover:bg-paper-2 hover:text-ink"
          >
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 space-y-3 overflow-y-auto bg-paper-2 p-5">
          <p className="rounded-brand border border-line bg-paper p-3 text-center font-mono text-[11px] text-slate">
            🔒 {t("note")}
          </p>
          {messages.map((m) => (
            <div key={m.id} className={m.from === "me" ? "flex justify-end" : "flex justify-start"}>
              <div
                className={
                  m.from === "me"
                    ? "max-w-[80%] rounded-2xl rounded-tr-sm bg-brand-navy px-4 py-2.5 text-sm text-white"
                    : "max-w-[80%] rounded-2xl rounded-tl-sm border border-line bg-paper px-4 py-2.5 text-sm text-ink"
                }
              >
                {m.text}
                <span className="mt-1 block font-mono text-[9px] opacity-60">{m.time}</span>
              </div>
            </div>
          ))}
          {ended && (
            <p className="rounded-brand border border-brand-red/25 bg-brand-red/5 p-3 text-center font-mono text-[11px] text-brand-red">
              {t("ended")}
            </p>
          )}
        </div>

        {!ended && (
          <div className="flex gap-2 border-t border-line p-4">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={t("placeholder")}
              className="h-11 flex-1 rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
            />
            <button
              type="button"
              onClick={send}
              aria-label="Send"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-brand bg-brand-red text-white hover:bg-brand-red-deep"
            >
              <Send size={16} />
            </button>
          </div>
        )}
      </motion.aside>
    </>
  );
}
