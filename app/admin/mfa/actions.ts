"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { mfaCodeSchema } from "@/lib/validation/auth";
import { rateLimit } from "@/lib/rate-limit";

export interface MfaState {
  error: string | null;
}

export async function verifyMfaAction(_prev: MfaState, formData: FormData): Promise<MfaState> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const limited = rateLimit(`mfa:${ip}`, { limit: 10, windowMs: 15 * 60 * 1000 });
  if (!limited.ok) {
    return { error: "Demasiadas tentativas. Tenta novamente dentro de alguns minutos." };
  }

  const parsed = mfaCodeSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: "O código tem de ter 6 dígitos." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data: factorsData } = await supabase.auth.mfa.listFactors();
  const factor = factorsData?.totp.find((f) => f.status === "verified");
  if (!factor) redirect("/admin");

  const { error } = await supabase.auth.mfa.challengeAndVerify({
    factorId: factor.id,
    code: parsed.data.code,
  });
  if (error) {
    return { error: "Código inválido." };
  }

  redirect("/admin");
}
