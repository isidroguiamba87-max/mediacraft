"use client";

import { useState, type SubmitEvent } from "react";
import { useTranslations } from "next-intl";

// Client design (2026-11-11): thin red-tinted borders, rounded corners,
// small grey placeholders; focus deepens the border to full brand red.
const fieldClass =
  "w-full rounded-[10px] border border-brand-red/55 bg-white px-3.5 text-sm text-ink outline-none transition-colors placeholder:text-slate/80 focus-visible:border-brand-red focus-visible:ring-2 focus-visible:ring-brand-red/15";
const labelClass = "mb-1.5 block text-[13px] font-bold text-brand-navy";

export function ContactForm() {
  const t = useTranslations("contact.form");
  const [status, setStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "message", string>>>({});

  /** Client-side checks with our own translated messages (the browser's
   * native bubbles aren't in the site's language). The server re-checks
   * the same rules in lib/validation/contact.ts. */
  function validate(data: FormData) {
    const next: typeof errors = {};
    if (!String(data.get("name") ?? "").trim()) next.name = t("errors.nameRequired");
    if (!/^[^s@]+@[^s@]+.[^s@]+$/.test(String(data.get("email") ?? "").trim())) next.email = t("errors.emailInvalid");
    if (String(data.get("message") ?? "").trim().length < 20) next.message = t("errors.messageMin");
    return next;
  }

  async function onSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    const formEl = e.currentTarget;
    const form = new FormData(formEl);
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      const first = Object.keys(found)[0];
      (formEl.elements.namedItem(first) as HTMLElement | null)?.focus();
      return;
    }
    setStatus("sending");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(form.entries())),
      });
      if (!res.ok) throw new Error("request failed");
      setStatus("success");
      formEl.reset();
    } catch {
      setStatus("error");
    }
  }

  return (
    <form
      noValidate
      onSubmit={onSubmit}
      className="relative rounded-[1.75rem] font-body border border-brand-red/70 bg-white px-6 pt-7 pb-6 sm:px-8"
    >
      {/* Honeypot — invisible to real visitors (off-screen, not display:none
          or aria-hidden, which some bots skip on purpose), caught
          server-side in app/api/contact/route.ts. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        className="absolute left-[-9999px] top-auto h-0 w-0 overflow-hidden"
        aria-hidden="true"
      />

      <h2 className="text-brand-navy">
        <span className="font-body text-xl font-medium uppercase sm:text-2xl">{t("title")}</span>
      </h2>
      <p className="mt-1.5 font-body text-xs text-slate">{t("subtitle")}</p>
      <span aria-hidden className="mt-2.5 block h-px bg-brand-red/70" />

      <div className="mt-6 grid gap-x-3 gap-y-4 sm:grid-cols-2">
        <label className="block">
          <span className={labelClass}>{t("nameLabel")}</span>
          <input name="name" required autoComplete="name" placeholder={t("namePh")} aria-invalid={!!errors.name} aria-describedby={errors.name ? "err-name" : undefined} className={`h-10 ${fieldClass}`} />
          {errors.name && (
            <span id="err-name" role="alert" className="mt-1 block text-xs text-brand-red">
              {errors.name}
            </span>
          )}
        </label>
        <label className="block">
          <span className={labelClass}>{t("email")}</span>
          <input
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t("emailPh")}
            aria-invalid={!!errors.email}
            aria-describedby={errors.email ? "err-email" : undefined}
            className={`h-10 ${fieldClass}`}
          />
          {errors.email && (
            <span id="err-email" role="alert" className="mt-1 block text-xs text-brand-red">
              {errors.email}
            </span>
          )}
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>{t("subject")}</span>
          <input name="subject" placeholder={t("subjectPh")} className={`h-10 ${fieldClass}`} />
        </label>
        <label className="block sm:col-span-2">
          <span className={labelClass}>{t("message")}</span>
          <textarea
            name="message"
            required
            minLength={20}
            rows={6}
            placeholder={t("messagePh")}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? "err-message" : undefined}
            className={`resize-none py-3 ${fieldClass}`}
          />
          {errors.message && (
            <span id="err-message" role="alert" className="mt-1 block text-xs text-brand-red">
              {errors.message}
            </span>
          )}
          <span className="mt-1.5 block text-xs text-slate">{t("hint")}</span>
        </label>
      </div>

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-5 inline-flex items-center rounded-full bg-brand-red px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-red-deep disabled:opacity-60"
      >
        {status === "sending" ? t("sending") : t("submit")}
      </button>

      {status === "success" && <p className="mt-3 text-sm text-brand-red">{t("success")}</p>}
      {status === "error" && <p className="mt-3 text-sm text-brand-red">{t("error")}</p>}
    </form>
  );
}
