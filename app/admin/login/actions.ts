"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loginSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/rate-limit";

export interface LoginState {
  error: string | null;
}

async function requestIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "unknown";
}

const GENERIC_ERROR = "Credenciais inválidas.";

/**
 * Server-side login: the form used to call `supabase.auth.signInWithPassword`
 * straight from the browser (see git history) — moved server-side so a
 * failed attempt never reveals more than "credenciais inválidas" (Supabase's
 * own client error text leaks details like "Email not confirmed" that an
 * attacker could use to enumerate accounts) and so IP-based throttling is
 * possible at all (nothing server-side to hook into from the browser).
 * Supabase's own project-level auth rate limits still apply underneath this
 * — this is a second, app-level layer with a clearer "too many attempts"
 * message.
 */
export async function loginAction(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const ip = await requestIp();
  const limited = rateLimit(`login:${ip}`, { limit: 8, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return { error: "Demasiadas tentativas. Tenta novamente dentro de alguns minutos." };
  }

  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: GENERIC_ERROR };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) {
    return { error: GENERIC_ERROR };
  }

  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
    // Password step passed; a verified TOTP factor exists on this account,
    // so the session stays at aal1 until app/admin/mfa confirms the code.
    redirect("/admin/mfa");
  }

  redirect("/admin");
}
