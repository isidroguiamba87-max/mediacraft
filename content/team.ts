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
    photo: "/images/team/linda-fernando.png",
    linkedin: "https://www.linkedin.com/company/mediacraftmz",
  },
  {
    id: "vanessa-cadir",
    name: "Vanessa Cadir",
    photo: "/images/team/vanessa-cadir.png",
    linkedin: "https://www.linkedin.com/company/mediacraftmz",
  },
  {
    id: "mikail-da-silva",
    name: "Mikail da Silva",
    photo: "/images/team/mikail-da-silva.jpg",
    email: "mikail.dasilva@mediacraft.co.mz",
  },
  {
    id: "leticia-de-sousa",
    name: "Letícia de Sousa",
    photo: "/images/team/leticia-de-sousa.jpg",
    email: "leticia.sousa@mediacraft.co.mz",
    linkedin: "https://www.linkedin.com/in/let%C3%ADcia-sousa-6269063a8/",
  },
  {
    id: "arlina-cunje",
    name: "Arlina Cunje",
    photo: "/images/team/arlina-cunje.jpg",
    linkedin: "https://www.linkedin.com/company/mediacraftmz",
  },
  {
    id: "joaquina-novela",
    name: "Joaquina Novela",
    photo: "/images/team/joaquina-novela.jpg",
    linkedin: "https://www.linkedin.com/company/mediacraftmz",
  },
  {
    id: "eugenia-sive",
    name: "Eugénia Sive",
    photo: "/images/team/eugenia-sive.jpg",
    email: "eugenia.sive@mediacraft.co.mz",
  },
  {
    id: "benicio-moises",
    name: "Benício Moisés",
    photo: "/images/team/benicio-moises.jpg",
  },
  {
    id: "rolando-neves",
    name: "Rolando Neves",
    photo: "/images/team/rolando-neves.jpg",
    email: "rolando.neves@mediacraft.co.mz",
    linkedin: "https://www.linkedin.com/in/rolandoneves/",
  },
  {
    id: "francisco-maculuve",
    name: "Francisco Maculuve",
    photo: "/images/team/francisco-maculuve.jpg",
    linkedin: "https://www.linkedin.com/company/mediacraftmz",
  },
  {
    id: "clesio-singano",
    name: "Clésio Singano",
    photo: "/images/team/clesio-singano.jpg",
    email: "clesio.singano@mediacraft.co.mz",
    linkedin: "https://www.linkedin.com/in/clesio-lubrino-842621aa/",
  },
];
