import { redirect } from "@/config/i18n";

/**
 * The showcase composition is now the home page — keep this path working for
 * any old links by sending it there.
 */
export default async function ShowcaseRedirect({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  redirect({ href: "/", locale });
}
