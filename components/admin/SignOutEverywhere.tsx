"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/Button";

/** For incident response — revokes every refresh token on this account, on
 * every device, not just this browser (plain "Sair" in AdminHeader only
 * signs out locally). */
export function SignOutEverywhere() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onClick() {
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signOut({ scope: "global" });
    setBusy(false);
    if (error) {
      toast.error("Não foi possível terminar as sessões.");
      return;
    }
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <Button variant="ghost" disabled={busy} onClick={onClick}>
      {busy ? "A terminar…" : "Terminar sessão em todos os dispositivos"}
    </Button>
  );
}
