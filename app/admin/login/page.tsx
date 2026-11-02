"use client";

import { useActionState } from "react";
import Image from "next/image";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseNotConfigured } from "@/components/admin/SupabaseNotConfigured";
import { Button } from "@/components/ui/Button";
import { loginAction, type LoginState } from "./actions";

const inputClass =
  "h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";

const initialState: LoginState = { error: null };

export default function AdminLoginPage() {
  if (!isSupabaseConfigured) {
    return <SupabaseNotConfigured />;
  }

  return <LoginForm />;
}

function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, initialState);

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-brand border border-line bg-paper p-8 shadow-brand">
        <div className="inline-block rounded-lg bg-brand-navy px-3 py-2">
          <Image src="/logo/logo.png" alt="MediaCraft" width={3914} height={1138} className="h-6 w-auto" />
        </div>
        <h1 className="mt-6 font-display text-xl text-brand-navy">Painel do Administrador</h1>
        <p className="mt-1 text-sm text-slate">Entra com a tua conta para gerir o site.</p>

        <form action={formAction} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            name="email"
            required
            autoComplete="email"
            placeholder="Email"
            className={inputClass}
          />
          <input
            type="password"
            name="password"
            required
            autoComplete="current-password"
            placeholder="Palavra-passe"
            className={inputClass}
          />

          {state.error && <p className="text-xs text-brand-red">{state.error}</p>}

          <Button type="submit" disabled={pending} className="mt-2 w-full justify-center">
            {pending ? "A entrar…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
