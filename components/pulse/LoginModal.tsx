"use client";

import { useTranslations } from "next-intl";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";

const fieldClass =
  "h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";

export function LoginModal({
  open,
  onClose,
  onEnter,
}: {
  open: boolean;
  onClose: () => void;
  onEnter: () => void;
}) {
  const t = useTranslations("pulse.login");

  return (
    <Modal open={open} onClose={onClose} title={t("title")} className="max-w-md">
      <p className="-mt-3 mb-6 text-sm text-slate">{t("subtitle")}</p>

      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          onEnter();
        }}
      >
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pulse-login-id" className="text-xs font-medium text-slate">
            {t("idLabel")}
          </label>
          <input id="pulse-login-id" className={fieldClass} autoComplete="username" />
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="pulse-login-pw" className="text-xs font-medium text-slate">
            {t("passwordLabel")}
          </label>
          <input id="pulse-login-pw" type="password" className={fieldClass} autoComplete="current-password" />
        </div>

        <Button type="submit" className="justify-center">
          {t("submit")}
        </Button>
        <Button type="button" variant="ghost" className="justify-center" onClick={onEnter}>
          {t("guest")}
        </Button>

        <p className="text-center font-mono text-[11px] text-slate">{t("note")}</p>
      </form>
    </Modal>
  );
}
