"use client";

import { useState, type SubmitEvent } from "react";
import { useTranslations } from "next-intl";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/Button";

const fieldClass =
  "h-12 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    const form = new FormData(e.currentTarget);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("success");
      e.currentTarget.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="name" required placeholder={t("name")} className={fieldClass} />
        <input
          name="email"
          type="email"
          required
          placeholder={t("email")}
          className={fieldClass}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <input name="phone" placeholder={t("phone")} className={fieldClass} />
        <input name="subject" placeholder={t("subject")} className={fieldClass} />
      </div>
      <textarea
        name="message"
        required
        rows={5}
        placeholder={t("message")}
        className="resize-none rounded-brand border border-line bg-paper px-4 py-3 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red"
      />

      <Button type="submit" size="lg" disabled={status === "sending"} className="justify-center">
        <Send size={16} />
        {status === "sending" ? t("sending") : t("submit")}
      </Button>

      {status === "success" && <p className="text-sm text-brand-red">{t("success")}</p>}
      {status === "error" && <p className="text-sm text-brand-red">{t("error")}</p>}
    </form>
  );
}
