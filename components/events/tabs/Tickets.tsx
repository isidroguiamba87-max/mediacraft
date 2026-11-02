"use client";

import { useEffect, useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import QRCode from "qrcode";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { SafeHtml } from "@/components/ui/SafeHtml";
import { cn, formatDate, formatPrice, isValidMobileMoneyNumber } from "@/lib/utils";
import { payReservation, reserveTicket } from "@/lib/pulse/endpoints";
import { PulseApiError } from "@/lib/pulse/types";
import type {
  FormAnswerInput,
  PulseEventForm,
  PulseEventTicket,
  PulseFormElement,
  PulseScheduleDate,
} from "@/lib/pulse/types";

type Step = "select" | "form" | "payment" | "done";

const PAYMENT_METHOD_LOGO: Record<"mpesa" | "emola", string> = {
  mpesa: "/images/partners/m-pesa.png",
  emola: "/images/partners/e-mola.png",
};

interface ContactInfo {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

/** elementType values that carry `listValues` (confirmed from
 * `custom-forms.validation.ts` LIST_TYPES) — everything else is a plain
 * value input. "file" gets no input at all: `answers` is a JSON array
 * (`{elementId, value}`), there's no multipart/upload path wired into the
 * reservation/payment flow, so a file-type field can't be collected here. */
const LIST_TYPES = new Set(["dropdown", "multi_select", "radio_buttons", "checkbox"]);
const MULTI_TYPES = new Set(["multi_select", "checkbox"]);

/**
 * Reservation form built from the confirmed real schemas: a reservation
 * is `{ tickets: [{ticketId, quantity}], dateIds, ...contact }` — one
 * call can cover several ticket types and multiple event dates at once.
 * There's no participant login on this site (that lives in a separate
 * Pulse participant app), so this always goes through the `auth=false`
 * path, which makes email/first name/last name/phone required.
 *
 * If the selected ticket(s) have a custom registration `form` attached
 * (`PulseEventForm`, `ticketId: null` = applies to every ticket), its
 * fields are collected as an extra step and sent as `answers` on the
 * PAYMENT call (not the reservation call — confirmed from
 * `enroll.validation.ts`, `answers` only exists on `paySchema`).
 *
 * Payment (mpesa/emola) only shows a form when the cart total is > 0 —
 * but `payReservation` is ALWAYS called, even for a free cart: reserving
 * alone only creates a PENDING `Reservation` (confirmed from
 * `enroll.repository.ts`) — the actual `Registration`/QR only gets
 * created inside `pay()`, price or no price. Per backend the payment
 * call itself blocks while their side polls the mobile-money gateway, so
 * this just shows a "processing" state rather than polling client-side.
 */
export function Tickets({
  eventId,
  tickets,
  scheduleDates,
  form,
}: {
  eventId: string;
  tickets: PulseEventTicket[];
  scheduleDates: PulseScheduleDate[];
  form: PulseEventForm[];
}) {
  const t = useTranslations("tickets");
  const locale = useLocale();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [dateIds, setDateIds] = useState<string[]>(
    scheduleDates.length === 1 ? [scheduleDates[0].id] : [],
  );
  const [contact, setContact] = useState<ContactInfo>({
    email: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });
  const [answers, setAnswers] = useState<Record<string, unknown>>({});
  const [method, setMethod] = useState<"mpesa" | "emola">("mpesa");
  const [paymentPhone, setPaymentPhone] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [busy, setBusy] = useState(false);
  /** Prefer `.message` — Pulse's own translated text (`payload.message`)
   * when the envelope carried one — falling back to a generic local
   * string keyed by `.code` for network-level failures with no body. */
  const [error, setError] = useState<PulseApiError | null>(null);
  const [reservationId, setReservationId] = useState<string | null>(null);
  /** Authoritative price from the reservation response, not our own
   * client-side sum — Pulse computes it server-side (`totalPrice`) and
   * that's what payment actually validates against. */
  const [totalPrice, setTotalPrice] = useState(0);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [enrollments, setEnrollments] = useState<string[]>([]);
  const [qrUrls, setQrUrls] = useState<string[]>([]);

  // Rendered on-screen as a safety net alongside the automatic email Pulse
  // sends with the ticket PDF — a spam folder or a mistyped address
  // shouldn't be the only way to get the QR that gets someone into the door.
  useEffect(() => {
    if (enrollments.length === 0) return;
    let cancelled = false;
    Promise.all(enrollments.map((code) => QRCode.toDataURL(code, { margin: 1, width: 220 }))).then(
      (urls) => {
        if (!cancelled) setQrUrls(urls);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [enrollments]);
  const [now, setNow] = useState(() => Date.now());

  // Reservations only live ~5 minutes server-side (confirmed) — retrying
  // `payReservation` against an already-expired one just 402s forever with
  // no indication why, so this ticks a visible countdown and flips the UI
  // into a "start over" state before the user hits that wall blind.
  useEffect(() => {
    if (step !== "payment" || !expiresAt) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [step, expiresAt]);

  const secondsLeft = expiresAt
    ? Math.max(0, Math.round((new Date(expiresAt).getTime() - now) / 1000))
    : null;
  const reservationExpired = secondsLeft === 0;

  function onRestart() {
    setStep("select");
    setReservationId(null);
    setTotalPrice(0);
    setExpiresAt(null);
    setError(null);
    setEnrollments([]);
  }

  const selected = useMemo(
    () =>
      tickets
        .map((ticket) => ({ ticket, quantity: quantities[ticket.id] ?? 0 }))
        .filter((s) => s.quantity > 0),
    [tickets, quantities],
  );
  // Pulse multiplies each ticket's requested quantity by the number of
  // selected dates (`calculateTotalPrice`, `dateIds.length`) — an
  // estimate only; the server's `totalPrice` after reserving is authoritative.
  const estimatedTotal =
    selected.reduce((sum, s) => sum + s.ticket.price * s.quantity, 0) *
    Math.max(dateIds.length, 1);
  const needsPayment = estimatedTotal > 0;
  const phoneValid = isValidMobileMoneyNumber(paymentPhone, method);

  // Elements from every custom form that applies to a selected ticket
  // (`ticketId: null` = applies to all), deduped by element id.
  const formElements = useMemo(() => {
    const selectedIds = new Set(selected.map((s) => s.ticket.id));
    const byId = new Map<string, PulseFormElement>();
    for (const f of form) {
      if (f.ticketId !== null && !selectedIds.has(f.ticketId)) continue;
      for (const el of f.elements) byId.set(el.id, el);
    }
    return [...byId.values()].sort((a, b) => a.orderIndex - b.orderIndex);
  }, [form, selected]);

  function setQuantity(ticketId: string, qty: number) {
    setQuantities((prev) => ({ ...prev, [ticketId]: Math.max(0, qty) }));
  }

  function toggleDate(id: string) {
    setDateIds((prev) => (prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]));
  }

  const canSubmit =
    selected.length > 0 &&
    dateIds.length > 0 &&
    Boolean(contact.email.trim()) &&
    Boolean(contact.firstName.trim()) &&
    Boolean(contact.lastName.trim()) &&
    Boolean(contact.phoneNumber.trim());

  const formValid = formElements.every((el) => {
    if (!el.isRequired || el.elementType === "file") return true;
    const value = answers[el.id];
    return MULTI_TYPES.has(el.elementType)
      ? Array.isArray(value) && value.length > 0
      : Boolean(String(value ?? "").trim());
  });

  function buildAnswers(): FormAnswerInput[] | undefined {
    if (formElements.length === 0) return undefined;
    return formElements
      .filter((el) => answers[el.id] !== undefined && el.elementType !== "file")
      .map((el) => ({ elementId: el.id, value: answers[el.id] }));
  }

  function onContinueFromSelect() {
    if (!canSubmit) return;
    setStep(formElements.length > 0 ? "form" : "select");
    if (formElements.length === 0) doReserve();
  }

  function onContinueFromForm() {
    if (!formValid) return;
    doReserve();
  }

  async function doReserve() {
    setBusy(true);
    setError(null);
    try {
      const reservation = await reserveTicket({
        eventId,
        authenticated: false,
        locale,
        tickets: selected.map((s) => ({ ticketId: s.ticket.id, quantity: s.quantity })),
        dateIds,
        email: contact.email,
        firstName: contact.firstName,
        lastName: contact.lastName,
        phoneNumber: contact.phoneNumber,
      });
      setReservationId(reservation.id);
      setTotalPrice(reservation.totalPrice);
      setExpiresAt(reservation.expiresAt);
      if (reservation.totalPrice > 0) {
        // Paid ticket: show the mpesa/emola form, onPay finalizes it.
        setStep("payment");
        return;
      }
      // Free ticket: reserving alone does NOT create the actual
      // Registration/QR — confirmed from enroll.repository.ts, `pay()` is
      // unconditionally what calls `confirmReservation` (paid or not). A
      // reservation left unpaid just sits PENDING and expires (~5 min) —
      // so a free reservation must still call payReservation, with no
      // method/phoneNumber, right away.
      const result = await payReservation({
        eventId,
        reservationId: reservation.id,
        locale,
        answers: buildAnswers(),
      });
      setEnrollments(result.enrollments);
      setStep("done");
    } catch (err) {
      setError(err instanceof PulseApiError ? err : new PulseApiError("UNKNOWN", 0));
    } finally {
      setBusy(false);
    }
  }

  async function onPay() {
    if (!reservationId || !phoneValid) return;
    setBusy(true);
    setError(null);
    try {
      const result = await payReservation({
        eventId,
        reservationId,
        locale,
        method,
        phoneNumber: paymentPhone,
        answers: buildAnswers(),
      });
      setEnrollments(result.enrollments);
      setStep("done");
    } catch (err) {
      setError(err instanceof PulseApiError ? err : new PulseApiError("UNKNOWN", 0));
    } finally {
      setBusy(false);
    }
  }

  if (tickets.length === 0) {
    return <p className="text-sm text-slate">{t("empty")}</p>;
  }

  if (step === "done") {
    return (
      <div className="mx-auto max-w-md rounded-brand border border-line bg-paper-2 p-8 text-center">
        <p className="font-display text-lg text-brand-navy">{t("confirmedTitle")}</p>
        <p className="mt-2 text-sm text-slate">
          {enrollments.length > 0
            ? t("confirmedBodyCount", { count: enrollments.length })
            : t("confirmedBody")}
        </p>

        {qrUrls.length > 0 && (
          <div className="mt-6 flex flex-col items-center gap-6">
            {qrUrls.map((url, i) => (
              <div key={i} className="rounded-brand border border-line bg-paper p-4">
                {/* eslint-disable-next-line @next/next/no-img-element -- local data: URL, not a remote/optimizable image */}
                <img src={url} alt={t("qrAlt", { count: i + 1 })} className="h-44 w-44" />
                {enrollments.length > 1 && (
                  <p className="mt-2 font-mono text-xs text-slate">{t("qrLabel", { count: i + 1 })}</p>
                )}
              </div>
            ))}
            <p className="text-xs text-slate">{t("qrHint")}</p>
          </div>
        )}
      </div>
    );
  }

  if (step === "payment") {
    return (
      <div className="mx-auto max-w-md rounded-brand border border-line p-6">
        <p className="font-display text-lg text-brand-navy">{t("paymentTitle")}</p>
        <p className="mt-1 text-sm text-slate">
          {t("paymentTotal", { total: formatPrice(totalPrice, locale) })}
        </p>
        {reservationExpired && (
          <p className="mt-1 text-xs font-medium text-brand-red">{t("paymentExpired")}</p>
        )}

        {reservationExpired ? (
          <Button onClick={onRestart} className="mt-5 w-full justify-center">
            {t("startOver")}
          </Button>
        ) : (
          <>
            <div className="mt-5 flex gap-3">
              {(["mpesa", "emola"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMethod(m)}
                  aria-pressed={method === m}
                  aria-label={m}
                  className={cn(
                    "flex flex-1 items-center justify-center rounded-brand border bg-paper px-4 py-3",
                    method === m ? "border-brand-red" : "border-line",
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element -- local static asset */}
                  <img src={PAYMENT_METHOD_LOGO[m]} alt={m} className="h-9 w-auto" />
                </button>
              ))}
            </div>

            <input
              value={paymentPhone}
              onChange={(e) => setPaymentPhone(e.target.value)}
              placeholder={t("paymentPhonePlaceholder")}
              className="mt-4 h-11 w-full rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
            />
            {paymentPhone.trim() && !phoneValid && (
              <p className="mt-1.5 text-xs text-brand-red">{t("paymentPhoneInvalid")}</p>
            )}

            {error && (
              <div className="mt-3">
                <p className="text-xs text-brand-red">
                  {error.message !== error.code ? error.message : `${t("payError")} (${error.code})`}
                </p>
                <button
                  type="button"
                  onClick={onRestart}
                  className="mt-1.5 text-xs font-medium text-brand-navy underline hover:text-brand-red"
                >
                  {t("startOver")}
                </button>
              </div>
            )}

            <Button
              onClick={onPay}
              disabled={busy || !phoneValid}
              className="mt-5 w-full justify-center"
            >
              {busy ? t("paying") : t("payNow")}
            </Button>
          </>
        )}
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="mx-auto max-w-md">
        <p className="font-display text-lg text-brand-navy">{t("formTitle")}</p>
        <div className="mt-5 flex flex-col gap-4">
          {formElements.map((el) => (
            <FormField
              key={el.id}
              element={el}
              value={answers[el.id]}
              onChange={(value) => setAnswers((prev) => ({ ...prev, [el.id]: value }))}
              t={t}
            />
          ))}
        </div>

        {error && (
          <p className="mt-3 text-xs text-brand-red">
            {error.message !== error.code ? error.message : `${t("reserveError")} (${error.code})`}
          </p>
        )}

        <Button
          onClick={onContinueFromForm}
          disabled={!formValid || busy}
          className="mt-6 w-full justify-center"
        >
          {busy ? t("reserving") : needsPayment ? t("continueToPayment") : t("reserve")}
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="grid gap-4 sm:grid-cols-2">
        {tickets.map((ticket) => (
          <TicketRow
            key={ticket.id}
            ticket={ticket}
            quantity={quantities[ticket.id] ?? 0}
            onChange={(qty) => setQuantity(ticket.id, qty)}
            locale={locale}
            t={t}
          />
        ))}
      </div>

      {scheduleDates.length > 1 && (
        <div className="mt-8">
          <p className="text-xs font-semibold tracking-wide text-slate uppercase">{t("dates")}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {scheduleDates.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDate(d.id)}
                className={cn(
                  "rounded-full border px-4 py-2 text-xs font-medium",
                  dateIds.includes(d.id)
                    ? "border-brand-red text-brand-red"
                    : "border-line text-slate",
                )}
              >
                {formatDate(d.date, locale)} · {d.timeFrom}–{d.timeTo}
              </button>
            ))}
          </div>
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-8 rounded-brand border border-line p-5">
          <p className="text-xs font-semibold tracking-wide text-slate uppercase">
            {t("contactTitle")}
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <input
              value={contact.firstName}
              onChange={(e) => setContact((c) => ({ ...c, firstName: e.target.value }))}
              placeholder={t("firstName")}
              className="h-11 rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
            />
            <input
              value={contact.lastName}
              onChange={(e) => setContact((c) => ({ ...c, lastName: e.target.value }))}
              placeholder={t("lastName")}
              className="h-11 rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
            />
            <input
              value={contact.email}
              onChange={(e) => setContact((c) => ({ ...c, email: e.target.value }))}
              placeholder={t("email")}
              type="email"
              className="h-11 rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
            />
            <input
              value={contact.phoneNumber}
              onChange={(e) => setContact((c) => ({ ...c, phoneNumber: e.target.value }))}
              placeholder={t("phoneNumber")}
              className="h-11 rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red"
            />
          </div>
        </div>
      )}

      {error && (
        <p className="mt-3 text-xs text-brand-red">
          {error.message !== error.code ? error.message : `${t("reserveError")} (${error.code})`}
        </p>
      )}

      <Button
        onClick={onContinueFromSelect}
        disabled={!canSubmit || busy}
        className="mt-6 w-full justify-center sm:w-auto"
      >
        {busy
          ? t("reserving")
          : formElements.length > 0
            ? t("continueToForm")
            : needsPayment
              ? t("continueToPayment")
              : t("reserve")}
      </Button>
    </div>
  );
}

function TicketRow({
  ticket,
  quantity,
  onChange,
  locale,
  t,
}: {
  ticket: PulseEventTicket;
  quantity: number;
  onChange: (qty: number) => void;
  locale: string;
  t: ReturnType<typeof useTranslations>;
}) {
  const soldOut = ticket.state !== "ACTIVE" || ticket.quantitySold >= ticket.quantity;

  return (
    <div className={cn("flex flex-col rounded-brand border border-line p-5", soldOut && "opacity-60")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-ink">{ticket.title}</p>
          <p className="mt-1 font-mono text-[10px] tracking-wide text-slate uppercase">
            {t(`area.${ticket.area}`)}
          </p>
        </div>
        <p className="shrink-0 font-display text-lg text-brand-navy">
          {ticket.price === 0 ? t("free") : formatPrice(ticket.price, locale)}
        </p>
      </div>

      {ticket.details && <SafeHtml html={ticket.details} className="mt-2 text-xs text-slate" />}

      {soldOut ? (
        <p className="mt-4 text-xs font-medium text-brand-red">{t("soldOut")}</p>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            onClick={() => onChange(quantity - 1)}
            disabled={quantity === 0}
            aria-label="-"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-slate disabled:opacity-40"
          >
            <Minus size={14} />
          </button>
          <span className="w-6 text-center text-sm font-medium text-ink">{quantity}</span>
          <button
            type="button"
            onClick={() => onChange(quantity + 1)}
            aria-label="+"
            className="flex h-8 w-8 items-center justify-center rounded-full border border-line text-slate"
          >
            <Plus size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

const inputClass =
  "h-11 w-full rounded-brand border border-line px-4 text-sm outline-none focus-visible:border-brand-red";

/** Renders one custom registration field, keyed off `elementType`
 * (confirmed values: text_field, textarea, dropdown, multi_select,
 * radio_buttons, checkbox, date, number, email, file — see
 * `custom-forms.validation.ts`). `file` has no input: `answers` is a
 * plain JSON array, there's no upload path wired into this flow yet. */
function FormField({
  element,
  value,
  onChange,
  t,
}: {
  element: PulseFormElement;
  value: unknown;
  onChange: (value: unknown) => void;
  t: ReturnType<typeof useTranslations>;
}) {
  const label = element.caption || element.key;
  const activeValues = (element.listValues ?? []).filter((v) => v.isActive !== false);

  if (element.elementType === "file") {
    return (
      <div>
        <p className="text-xs font-medium text-slate">
          {label}
          {element.isRequired && <span className="text-brand-red"> *</span>}
        </p>
        <p className="mt-1 text-xs text-brand-red">{t("formFileUnsupported")}</p>
      </div>
    );
  }

  if (LIST_TYPES.has(element.elementType)) {
    const multi = MULTI_TYPES.has(element.elementType);
    const selectedValues = new Set(
      multi ? ((value as string[] | undefined) ?? []) : value ? [value as string] : [],
    );

    function toggle(v: string) {
      if (multi) {
        const next = new Set(selectedValues);
        if (next.has(v)) next.delete(v);
        else next.add(v);
        onChange([...next]);
      } else {
        onChange(v);
      }
    }

    return (
      <div>
        <p className="text-xs font-medium text-slate">
          {label}
          {element.isRequired && <span className="text-brand-red"> *</span>}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {activeValues.map((v) => (
            <button
              key={v.id}
              type="button"
              onClick={() => toggle(v.value)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                selectedValues.has(v.value)
                  ? "border-brand-red text-brand-red"
                  : "border-line text-slate",
              )}
            >
              {v.name}
            </button>
          ))}
        </div>
      </div>
    );
  }

  const inputType =
    element.elementType === "number"
      ? "number"
      : element.elementType === "email"
        ? "email"
        : element.elementType === "date"
          ? "date"
          : "text";

  return (
    <div>
      <p className="mb-1.5 text-xs font-medium text-slate">
        {label}
        {element.isRequired && <span className="text-brand-red"> *</span>}
      </p>
      {element.elementType === "textarea" ? (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={element.placeholder ?? undefined}
          rows={3}
          className="w-full resize-none rounded-brand border border-line px-4 py-3 text-sm outline-none focus-visible:border-brand-red"
        />
      ) : (
        <input
          type={inputType}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={element.placeholder ?? undefined}
          className={inputClass}
        />
      )}
    </div>
  );
}
