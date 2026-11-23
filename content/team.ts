import type { TeamMember } from "@/types";

/**
 * Team roster. Job titles are translated in messages/*.json under
 * team.members.<id>.role; an optional bio lives under .bio and, when
 * present, opens on click in the TeamDeck. Photos sit in
 * public/images/team/<id>.jpg — members without one fall back to an
 * initials tile.
 */
export const team: TeamMember[] = [
  {
    id: "linda-fernando",
    name: "Linda Fernando",
    photo: "/images/team/linda-fernando-2026.webp",
    linkedin: "https://www.linkedin.com/company/mediacraftmz",
  },
  {
    id: "vanessa-cadir",
    name: "Vanessa Cadir",
    photo: "/images/team/vanessa-cadir-2026.webp",
    linkedin: "https://www.linkedin.com/company/mediacraftmz",
  },
  {
    id: "mikail-da-silva",
    name: "Mikail da Silva",
    photo: "/images/team/mikail-da-silva-2026.webp",
    email: "mikail.dasilva@mediacraft.co.mz",
  },
  {
    id: "leticia-de-sousa",
    name: "Letícia de Sousa",
    photo: "/images/team/leticia-de-sousa-2026.webp",
    email: "leticia.sousa@mediacraft.co.mz",
    linkedin: "https://www.linkedin.com/in/let%C3%ADcia-sousa-6269063a8/",
    whatsapp: "https://wa.me/258842729633",
  },
  {
    id: "arlina-cunje",
    name: "Arlina Cunje",
    photo: "/images/team/arlina-cunje-2026.webp",
    linkedin: "https://www.linkedin.com/company/mediacraftmz",
  },
  {
    id: "joaquina-novela",
    name: "Joaquina Novela",
    photo: "/images/team/joaquina-novela-v2.webp",
    linkedin: "https://www.linkedin.com/company/mediacraftmz",
  },
  {
    id: "benicio-moises",
    name: "Benício Moisés",
    photo: "/images/team/benicio-moises-2026.webp",
  },
  {
    id: "rolando-neves",
    name: "Rolando Neves",
    photo: "/images/team/rolando-neves-2026.webp",
    email: "rolando.neves@mediacraft.co.mz",
    linkedin: "https://www.linkedin.com/in/rolandoneves/",
  },
  {
    id: "francisco-maculuve",
    name: "Francisco Maculuve",
    photo: "/images/team/francisco-maculuve-2026.webp",
    linkedin: "https://www.linkedin.com/company/mediacraftmz",
  },
  {
    id: "clesio-singano",
    name: "Clésio Singano",
    photo: "/images/team/clesio-singano-2026.webp",
    email: "clesio.singano@mediacraft.co.mz",
    linkedin: "https://www.linkedin.com/in/clesio-lubrino-842621aa/",
  },
];
