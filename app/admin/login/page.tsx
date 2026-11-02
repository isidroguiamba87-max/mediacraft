"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseNotConfigured } from "@/components/admin/SupabaseNotConfigured";
import { Button } from "@/components/ui/Button";

const inputClass =
  "h-11 w-full rounded-brand border border-line bg-paper px-4 text-sm text-ink outline-none transition-colors focus-visible:border-brand-red";

export default function AdminLoginPage() {
  if (!isSupabaseConfigured) {
    return <SupabaseNotConfigured />;
  }

  return <LoginForm />;
}

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError(signInError.message);
      setBusy(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-full items-center justify-center px-6 py-16">
      <div className="w-full max-w-sm rounded-brand border border-line bg-paper p-8 shadow-brand">
        <div className="inline-block rounded-lg bg-brand-navy px-3 py-2">
          <Image src="/logo/logo.png" alt="MediaCraft" width={3914} height={1138} className="h-6 w-auto" />
        </div>
        <h1 className="mt-6 font-display text-xl text-brand-navy">Painel do Administrador</h1>
        <p className="mt-1 text-sm text-slate">Entra com a tua conta para gerir o site.</p>

        <form onSubmit={onSubmit} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={inputClass}
          />
          <input
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Palavra-passe"
            className={inputClass}
          />

          {error && <p className="text-xs text-brand-red">{error}</p>}

          <Button type="submit" disabled={busy} className="mt-2 w-full justify-center">
            {busy ? "A entrar…" : "Entrar"}
          </Button>
        </form>
      </div>
    </div>
  );
}
