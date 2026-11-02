"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ADMIN_NAV_ITEMS } from "./nav-items";

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-64 shrink-0 flex-col border-r border-line bg-paper lg:flex print:hidden">
      <div className="flex h-20 items-center px-6">
        <Link href="/admin" className="rounded-lg bg-brand-navy px-3 py-2">
          <Image src="/logo/logo.png" alt="MediaCraft" width={3914} height={1138} className="h-6 w-auto" />
        </Link>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-3 py-2">
        {ADMIN_NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 rounded-brand px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-red/10 text-brand-red"
                  : "text-slate hover:bg-paper-2 hover:text-ink",
              )}
            >
              <Icon size={18} />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
