"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/Button";
import { verifyMfaAction, type MfaState } from "./actions";

const initialState: MfaState = { error: null };

export function MfaChallengeForm() {
  const [state, formAction, pending] = useActionState(verifyMfaAction, initialState);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-3">
      <input
        type="text"
        name="code"
        required
        inputMode="numeric"
        autoComplete="one-time-code"
        maxLength={6}
        placeholder="000000"
        className="h-11 w-full rounded-brand border border-line bg-paper px-4 text-center text-lg tracking-[0.3em] text-ink outline-none transition-colors focus-visible:border-brand-red"
      />

      {state.error && <p className="text-xs text-brand-red">{state.error}</p>}

      <Button type="submit" disabled={pending} className="mt-2 w-full justify-center">
        {pending ? "A verificar…" : "Verificar"}
      </Button>
    </form>
  );
}
