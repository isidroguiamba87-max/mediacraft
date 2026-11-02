import type { Partner } from "@/types";

/**
 * Partners & clients for the home page marquee and the "view all" modal.
 * `logo` points at a real mark supplied by MediaCraft in
 * public/images/partners (2026-10-01) — an entry with no `logo` set
 * (bubble, amb, ams, corpo-diplomatico: no artwork supplied) falls back
 * to a text chip instead (see components/home/Partners.tsx).
 */
export const partners: Partner[] = [
  { id: "grupo-banco-mundial", name: "Grupo Banco Mundial", logo: "/images/partners/grupo-banco-mundial.jpg" },
  { id: "africa50", name: "Africa50", logo: "/images/partners/africa50.jpg" },
  { id: "uneca", name: "UNECA", logo: "/images/partners/uneca.png" },
  { id: "uk-in-mozambique", name: "UK in Mozambique", logo: "/images/partners/uk-in-mozambique.jpg" },
  { id: "fsdmoc", name: "FSDMoç", logo: "/images/partners/fsdmoc.png" },
  { id: "huawei", name: "Huawei", logo: "/images/partners/huawei.jpg" },
  { id: "standard-bank", name: "Standard Bank", logo: "/images/partners/standard-bank.png" },
  { id: "millennium-bim", name: "Millennium bim", logo: "/images/partners/millennium-bim.png" },
  { id: "bci", name: "BCI", logo: "/images/partners/bci.png" },
  { id: "moza-banco", name: "Moza Banco", logo: "/images/partners/moza-banco.png" },
  { id: "emose", name: "EMOSE", logo: "/images/partners/emose.png" },
  { id: "mcnet", name: "MCNET", logo: "/images/partners/mcnet.png" },
  { id: "movitel", name: "Movitel", logo: "/images/partners/movitel.png" },
  { id: "e-mola", name: "e-Mola", logo: "/images/partners/e-mola.png" },
  { id: "m-pesa", name: "M-Pesa", logo: "/images/partners/m-pesa.png" },
  { id: "bubble", name: "Bubble" },
  { id: "raxio", name: "Raxio", logo: "/images/partners/raxio.png" },
  { id: "cta", name: "CTA", logo: "/images/partners/cta.jpg" },
  { id: "amb", name: "AMB" },
  { id: "ams", name: "AMS" },
  { id: "fintechmz", name: "FINTECHMz", logo: "/images/partners/fintechmz.png" },
  { id: "corpo-diplomatico", name: "Corpo Diplomático" },
];
