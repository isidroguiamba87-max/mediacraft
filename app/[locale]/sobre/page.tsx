import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/config/i18n";

/**
 * One-page site (2026-11-11): this content now lives on the home page as
 * the #sobre-nos section. The old route is kept only so existing links and
 * bookmarks still land in the right place.
 */
export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  redirect({ href: "/#sobre-nos", locale });
}
