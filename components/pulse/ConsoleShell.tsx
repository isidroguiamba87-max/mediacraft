"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { LangSwitcher } from "@/components/layout/LangSwitcher";
import { cn } from "@/lib/utils";
import { ConsoleNav } from "./ConsoleNav";
import { RoleSwitcher } from "./RoleSwitcher";
import { Dashboard } from "./views/Dashboard";
import { EventsTable } from "./views/EventsTable";
import { CreateEvent } from "./views/CreateEvent";
import { Publications } from "./views/Publications";
import { Communications } from "./views/Communications";
import { QA } from "./views/QA";
import { Live } from "./views/Live";
import { Report } from "./views/Report";
import { PanelistHome } from "./views/PanelistHome";
import { ParticipantHome } from "./views/ParticipantHome";
import { CheckinHome } from "./views/CheckinHome";

export type AdminView =
  | "dashboard"
  | "events"
  | "create"
  | "publications"
  | "communications"
  | "qa"
  | "live"
  | "report";

export type PulseRole = "admin" | "panelist" | "participant" | "checkin";

const ADMIN_VIEWS: AdminView[] = [
  "dashboard",
  "events",
  "create",
  "publications",
  "communications",
  "qa",
  "live",
  "report",
];

const ROLES: PulseRole[] = ["admin", "panelist", "participant", "checkin"];

/**
 * Full-screen simulation of the Pulse organiser/panelist/participant/
 * check-in console, opened on top of the public site (see PulseLauncher).
 * Everything here reads from lib/bff/pulseConsoleMock — there is no real
 * backend behind it, same as the rest of the "pulse" namespace.
 */
export function ConsoleShell({ onExit }: { onExit: () => void }) {
  const t = useTranslations("pulse");
  const [role, setRole] = useState<PulseRole>("admin");
  const [view, setView] = useState<AdminView>("dashboard");

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-paper-2">
      <header className="flex h-16 shrink-0 items-center gap-3 border-b border-line bg-paper px-4 lg:px-6">
        <div className="flex items-center gap-2.5">
          <span className="rounded-md bg-brand-navy px-2 py-1.5">
            <Image
              src="/logo/logo.png"
              alt="MediaCraft"
              width={3914}
              height={1138}
              className="h-4 w-auto"
            />
          </span>
          <span className="rounded-full bg-brand-navy px-2 py-1 font-mono text-[10px] font-bold tracking-wide text-white">
            PULSE
          </span>
        </div>
        <div className="ml-auto flex items-center gap-3">
          <LangSwitcher />
          <button
            type="button"
            onClick={onExit}
            className="h-10 rounded-full border border-line px-4 text-sm font-medium text-ink hover:bg-paper-2"
          >
            {t("exit")}
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-60 shrink-0 flex-col gap-7 overflow-y-auto border-r border-line bg-paper p-4 lg:flex">
          {role === "admin" && <ConsoleNav active={view} onChange={setView} />}
          <RoleSwitcher role={role} onChange={setRole} />
        </aside>

        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="flex items-center gap-2 border-b border-line bg-paper p-3 lg:hidden">
            {role === "admin" && (
              <select
                value={view}
                onChange={(e) => setView(e.target.value as AdminView)}
                className="h-9 min-w-0 flex-1 rounded-brand border border-line bg-paper px-3 text-xs text-ink outline-none"
              >
                {ADMIN_VIEWS.map((v) => (
                  <option key={v} value={v}>
                    {t(`nav.${v}`)}
                  </option>
                ))}
              </select>
            )}
            <div className={cn("flex gap-1 overflow-x-auto", role === "admin" ? "shrink-0" : "flex-1")}>
              {ROLES.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => setRole(r)}
                  className={cn(
                    "shrink-0 rounded-full px-3 py-1.5 font-mono text-[11px] whitespace-nowrap transition-colors",
                    role === r ? "bg-brand-navy text-white" : "border border-line text-slate",
                  )}
                >
                  {t(`roles.${r}`)}
                </button>
              ))}
            </div>
          </div>

          <main className="flex-1 overflow-y-auto p-5 lg:p-8">
            {role === "admin" && view === "dashboard" && <Dashboard onNavigate={setView} />}
            {role === "admin" && view === "events" && <EventsTable />}
            {role === "admin" && view === "create" && <CreateEvent />}
            {role === "admin" && view === "publications" && <Publications />}
            {role === "admin" && view === "communications" && <Communications />}
            {role === "admin" && view === "qa" && <QA />}
            {role === "admin" && view === "live" && <Live />}
            {role === "admin" && view === "report" && <Report />}
            {role === "panelist" && <PanelistHome />}
            {role === "participant" && <ParticipantHome />}
            {role === "checkin" && <CheckinHome />}
          </main>
        </div>
      </div>
    </div>
  );
}
