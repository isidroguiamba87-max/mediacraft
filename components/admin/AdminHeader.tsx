"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Menu, X, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "./nav-items";

export function AdminHeader({ email }: { email: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function onLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  return (
    <header className="relative border-b border-line bg-paper print:hidden">
      <div className="flex h-16 items-center justify-between px-6 lg:px-10">
        <button
          type="button"
          onClick={() => setMobileOpen((v) => !v)}
          aria-label="Menu"
          className="grid h-10 w-10 place-items-center rounded-full border border-line text-ink lg:hidden"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </button>

        <p className="hidden text-sm text-slate lg:block">{email}</p>

        <button
          type="button"
          onClick={onLogout}
          className="flex items-center gap-2 text-sm font-medium text-slate transition-colors hover:text-brand-red"
        >
          <LogOut size={16} />
          <span className="hidden sm:inline">Sair</span>
        </button>
      </div>

      {mobileOpen && (
        <nav className="border-t border-line bg-paper px-3 py-2 lg:hidden">
          {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-brand px-3 py-2.5 text-sm font-medium",
                  active ? "bg-brand-red/10 text-brand-red" : "text-slate",
                )}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
