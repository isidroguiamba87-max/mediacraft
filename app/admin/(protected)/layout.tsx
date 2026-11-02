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
