import { redirect } from "next/navigation";
import { Toaster } from "sonner";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { SupabaseNotConfigured } from "@/components/admin/SupabaseNotConfigured";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { PulseAdminLink } from "@/components/admin/PulseAdminLink";

/**
 * Auth gate for every real panel page: no Supabase session → straight to
 * /admin/login. Session refresh itself happens in proxy.ts; this is just
 * the page-level check. `(protected)` is a route group (no URL segment)
 * so /admin/login stays outside it, with no sidebar/guard.
 */
export default async function ProtectedLayout({ children }: { children: React.ReactNode }) {
  if (!isSupabaseConfigured) {
    return <SupabaseNotConfigured />;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/admin/login");
  }

  // Account has a verified TOTP factor but this session only cleared the
  // password step — send it to the second-factor challenge instead of
  // granting access. (Accounts with no factor enrolled never hit this:
  // Supabase only ever asks for aal2 once one exists — see
  // app/admin/seguranca.)
  const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (aal && aal.nextLevel === "aal2" && aal.currentLevel !== aal.nextLevel) {
    redirect("/admin/mfa");
  }

  return (
    <div className="flex min-h-full">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader email={user.email ?? ""} />
        <main className="flex-1 px-6 py-8 lg:px-10">{children}</main>
      </div>
      <PulseAdminLink />
      <Toaster richColors position="top-center" />
    </div>
  );
}
