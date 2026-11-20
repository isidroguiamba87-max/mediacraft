/**
 * Full "Ver mais" copy for the three home-hero pillars (client text,
 * 2026-11-19). Indexed the same way as `showcase.pillars` in
 * messages/*.json (stored order: Comunicação, Reputação, Eventos).
 *
 * Portuguese only for now — on /en and /fr the page-wide machine
 * translation (components/layout/AutoTranslate.tsx) translates it on the
 * fly, popup included.
 */
export interface PillarDetail {
  title: string;
  /** Paragraphs before the list. */
  intro: string[];
  /** Sentence introducing the list (ends with ":"). */
  listLead?: string;
  points?: { label: string; text: string }[];
  /** Paragraphs after the list. */
  outro: string[];
  /** Numbered sub-areas, each a heading + paragraph ("O que fazemos?"). */
  sections?: { title: string; text: string }[];
}

export const pillarDetails: PillarDetail[] = [
  {
    title: "Comunicação estratégica: da intenção à execução.",
    intro: [
      "A comunicação não começa com uma publicação, uma campanha ou um evento. Começa pela compreensão do contexto, dos objectivos e daquilo que precisa de acontecer.",
      "Construir confiança, posicionar uma instituição ou liderança, mobilizar partes interessadas, dar visibilidade a uma agenda, criar espaços de diálogo ou proteger a reputação são objectivos distintos, que exigem abordagens e estratégias adequadas a cada realidade.",
      "Na Media Craft Mozambique, entendemos a comunicação como um instrumento estratégico ao serviço dos objectivos institucionais e empresariais. O nosso trabalho começa pela análise do contexto e pela identificação dos resultados pretendidos, permitindo definir o que comunicar, a quem, porquê e através de que meios.",
    ],
    listLead:
      "A partir dessa compreensão, desenvolvemos e implementamos estratégias que articulam diferentes áreas de intervenção, nomeadamente:",
    points: [
      {
        label: "Comunicação Estratégica e Institucional",
        text: "desenvolvimento de estratégias de comunicação alinhadas com os objectivos e prioridades institucionais.",
      },
      {
        label: "Reputação e Influência",
        text: "posicionamento e fortalecimento da credibilidade e reputação de organizações e lideranças.",
      },
      {
        label: "Envolvimento de Partes Interessadas",
        text: "identificação, mobilização e relacionamento com públicos e interlocutores estratégicos.",
      },
      {
        label: "Campanhas e Mobilização Pública",
        text: "concepção e implementação de campanhas e iniciativas de mobilização e participação pública.",
      },
      {
        label: "Conteúdos, Media e Produção",
        text: "desenvolvimento de conteúdos, relacionamento com os media e produção de materiais de comunicação.",
      },
      {
        label: "Conferências, Eventos e Encontros Estratégicos",
        text: "utilização de encontros e eventos como plataformas de comunicação, relacionamento e influência.",
      },
      {
        label: "Projectos e Implementação de Programas",
        text: "implementação e coordenação de iniciativas e programas de comunicação.",
      },
    ],
    outro: [
      "A nossa intervenção não se limita à definição de estratégias ou à produção de mensagens. Procuramos assegurar a ligação entre o que se pretende alcançar, o que se comunica, quem precisa de ser envolvido e aquilo que efectivamente acontece.",
      "É nesta articulação entre contexto, estratégia, comunicação e execução que assenta a nossa abordagem.",
    ],
  },
  {
    title: "Reputação: aquilo que os outros encontram, percebem e acreditam sobre si.",
    intro: [
      "Antes de uma reunião, parceria, contratação, entrevista ou decisão de investimento, alguém pode pesquisar pela sua organização ou liderança. O que encontra nos motores de pesquisa, nos media, nas plataformas digitais e nas referências de terceiros contribui para formar uma percepção sobre quem é, o que representa e a confiança que inspira.",
      "A reputação começa antes de uma organização decidir comunicar. É construída através das suas acções, decisões, relações, presença pública e das narrativas que circulam sobre si.",
      "Ter visibilidade não significa, necessariamente, ter credibilidade, autoridade ou um posicionamento reconhecido. Uma organização pode estar presente nos diferentes canais de comunicação e, ainda assim, não transmitir uma percepção clara sobre a sua identidade, competência e valor.",
      "É neste contexto que a gestão estratégica da reputação assume particular importância. Não se trata apenas de aumentar a exposição pública, mas de compreender as percepções existentes, fortalecer a confiança e construir uma narrativa institucional coerente, credível e sustentada.",
      "Na Media Craft Mozambique, trabalhamos com organizações, empresas e lideranças na construção e gestão da sua reputação, através de estratégias de comunicação orientadas para o posicionamento, a autoridade e o relacionamento com os públicos relevantes.",
      "A nossa abordagem integra análise reputacional, desenvolvimento de narrativas, comunicação institucional, presença nos media, posicionamento de lideranças e relacionamento com stakeholders.",
    ],
    outro: [
      "Porque a reputação não se constrói apenas pelo que uma organização diz sobre si. Constrói-se pela coerência entre aquilo que diz, aquilo que faz e aquilo que os outros passam a acreditar.",
    ],
  },
  {
    title: "Eventos: plataformas de reputação, relacionamento, influência e resultados.",
    intro: [
      "Um evento começa a comunicar antes mesmo de alguém subir ao palco. A escolha dos convidados, as instituições representadas, o nível dos oradores, o programa, o protocolo e a experiência proporcionada aos participantes transmitem sinais sobre a organização que o realiza e influenciam a forma como esta é percebida.",
      "Uma conferência, um fórum, uma reunião executiva ou um encontro institucional não são apenas operações logísticas. São plataformas onde reputação, comunicação, relacionamento institucional, conteúdo, experiência e objectivos estratégicos se encontram.",
      "O valor de um encontro não se mede exclusivamente pelo número de participantes ou pela execução do programa. Depende também da capacidade de reunir os interlocutores certos, criar condições para conversas relevantes, aproximar stakeholders, facilitar decisões e estabelecer relações que possam produzir resultados.",
      "Na Media Craft Mozambique, abordamos os eventos numa perspectiva estratégica, integrando concepção, planeamento, produção executiva, protocolo, comunicação e gestão de stakeholders. Trabalhamos para que cada encontro corresponda aos objectivos da organização e esteja alinhado com o seu posicionamento institucional.",
    ],
    listLead: "A nossa abordagem considera cinco dimensões fundamentais:",
    points: [
      {
        label: "Objectivo e estratégia",
        text: "definição dos resultados que o encontro pretende alcançar e do seu enquadramento institucional.",
      },
      {
        label: "Stakeholders e participantes",
        text: "identificação das pessoas, instituições e organizações cuja presença e envolvimento são relevantes para o propósito do evento.",
      },
      {
        label: "Protocolo e experiência",
        text: "coordenação do acolhimento, precedências, tratamento institucional, organização e experiência dos participantes.",
      },
      {
        label: "Conteúdo e comunicação",
        text: "desenvolvimento de programas, narrativas e estratégias de comunicação que reforcem o posicionamento e prolonguem o alcance do encontro.",
      },
      {
        label: "Continuidade e legado",
        text: "acompanhamento das relações, decisões, compromissos, conteúdos e oportunidades que resultam do evento.",
      },
    ],
    outro: [
      "O trabalho não termina quando o último convidado sai da sala. O verdadeiro valor de um encontro também está naquilo que começa, muda ou avança depois da sua realização.",
      "Na Media Craft Mozambique, trabalhamos para que cada evento seja concebido e executado em função do seu propósito, protegendo a reputação da organização e criando condições para resultados que ultrapassem o momento da realização.",
    ],
  },
];
