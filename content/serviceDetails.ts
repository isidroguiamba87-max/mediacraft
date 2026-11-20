import type { PillarDetail } from "./pillarDetails";

/**
 * Full "Ver mais" copy for each "O que fazemos?" area (client text,
 * 2026-11-19), keyed by the service id in content/services.ts. Shown in the
 * same popup as the home-hero pillars (PillarDetailModal), each over that
 * area's own background photo.
 *
 * Portuguese only for now — /en and /fr get it through the page-wide
 * machine translation (components/layout/AutoTranslate.tsx).
 */
export const serviceDetails: Record<string, PillarDetail> = {
  events: {
    title: "01. Conferências, Eventos & Plataformas de Diálogo",
    intro: [],
    outro: [],
    sections: [
      {
        title: "Concepção e Organização de Eventos",
        text: "Desenvolvemos e organizamos conferências, fóruns, seminários, congressos e eventos institucionais, assegurando todas as etapas do processo, desde a definição do conceito até à sua concretização. Cada iniciativa é estruturada de acordo com os objectivos, o público-alvo e a dimensão do evento.",
      },
      {
        title: "Plataformas de Diálogo e Conhecimento",
        text: "Criamos e dinamizamos plataformas de diálogo que promovem a partilha de experiências, a reflexão e o intercâmbio de conhecimento entre diferentes sectores. Facilitamos encontros entre instituições, empresas, especialistas e parceiros, incentivando a construção de ideias e soluções conjuntas.",
      },
      {
        title: "Produção e Coordenação de Eventos",
        text: "Asseguramos a gestão técnica, logística, protocolar e operacional de eventos, garantindo uma coordenação integrada de todos os elementos envolvidos. Acompanhamos cada fase da produção, desde a preparação dos espaços e gestão de participantes até à execução e avaliação final.",
      },
      {
        title: "Networking e Parcerias Estratégicas",
        text: "Promovemos experiências e oportunidades de relacionamento que aproximam organizações, empresas, instituições e profissionais de diferentes áreas. Desenvolvemos iniciativas que facilitam a criação de parcerias, o estabelecimento de contactos estratégicos e o fortalecimento das relações institucionais e comerciais.",
      },
    ],
  },
  content: {
    title: "02. Conteúdo, Media & Produção",
    intro: [],
    outro: [],
    sections: [
      {
        title: "Produção Audiovisual",
        text: "Concebemos e produzimos conteúdos audiovisuais para empresas, instituições, marcas e organizações, incluindo vídeos institucionais, documentários, reportagens e produções promocionais. Acompanhamos todo o processo criativo e técnico, desde a conceptualização e elaboração dos guiões até à filmagem, edição e finalização.",
      },
      {
        title: "Produção de Conteúdos Digitais",
        text: "Desenvolvemos conteúdos criativos e estratégicos para redes sociais, websites e outras plataformas digitais, adaptados à identidade e aos objectivos de cada organização. Criamos soluções visuais e textuais que reforçam a presença digital, promovem o envolvimento dos públicos e valorizam a comunicação das marcas.",
      },
      {
        title: "Concepção Editorial e Formatos Mediáticos",
        text: "Desenvolvemos conceitos editoriais, linhas de conteúdo, guiões, entrevistas, reportagens e formatos de comunicação para diferentes meios e plataformas. Trabalhamos na estruturação de narrativas e projectos mediáticos que asseguram clareza, consistência e relevância na transmissão de mensagens.",
      },
      {
        title: "Fotografia e Cobertura de Eventos",
        text: "Disponibilizamos serviços de fotografia e cobertura audiovisual para eventos corporativos, institucionais, culturais e promocionais. Asseguramos o registo dos principais momentos e experiências, através de conteúdos visuais de qualidade que permitem documentar, divulgar e valorizar cada iniciativa.",
      },
    ],
  },
  campaigns: {
    title: "03. Campanhas e Engajamento Público",
    intro: [],
    outro: [],
    sections: [
      {
        title: "Desenvolvimento de Campanhas de Comunicação",
        text: "Concebemos e implementamos campanhas de comunicação orientadas para diferentes públicos, objectivos e contextos de intervenção. Desenvolvemos conceitos criativos, mensagens e estratégias de divulgação que fortalecem a visibilidade das iniciativas e promovem uma comunicação eficaz.",
      },
      {
        title: "Campanhas de Sensibilização e Mobilização",
        text: "Criamos iniciativas de sensibilização e educação pública que incentivam a participação e promovem a consciencialização sobre temas de interesse social e institucional. Desenvolvemos abordagens que aproximam as mensagens das comunidades, estimulando o envolvimento e a adopção de comportamentos positivos.",
      },
      {
        title: "Promoção Turística, Cultural e Institucional",
        text: "Desenvolvemos campanhas e iniciativas destinadas à valorização de destinos turísticos, património cultural, produtos, serviços e potencialidades locais. Trabalhamos na criação de narrativas e experiências promocionais que reforçam a identidade dos destinos e contribuem para a sua visibilidade junto de diferentes públicos.",
      },
      {
        title: "Activação de Marcas e Engajamento Público",
        text: "Criamos experiências e acções de activação que aproximam marcas, instituições e organizações dos seus públicos através de iniciativas presenciais e digitais. Desenvolvemos estratégias de envolvimento que estimulam a interacção, fortalecem a relação com os consumidores e ampliam o impacto das campanhas.",
      },
    ],
  },
  communication: {
    title: "04. Comunicação Estratégica & Institucional",
    intro: [],
    outro: [],
    sections: [
      {
        title: "Planeamento e Estratégia de Comunicação",
        text: "Desenvolvemos planos e estratégias de comunicação alinhados com a missão, visão e objectivos de cada organização. Identificamos públicos prioritários, definimos mensagens-chave e seleccionamos os canais mais adequados para garantir uma comunicação coerente, estruturada e orientada para resultados.",
      },
      {
        title: "Assessoria de Imprensa e Relações Públicas",
        text: "Prestamos serviços de assessoria de imprensa e relações públicas, apoiando organizações na gestão do relacionamento com os órgãos de comunicação social e outros públicos estratégicos. Desenvolvemos comunicados, notas de imprensa, entrevistas e iniciativas de relacionamento que reforçam a visibilidade e credibilidade institucional.",
      },
      {
        title: "Gestão de Imagem e Reputação Institucional",
        text: "Apoiamos empresas e instituições na construção, valorização e protecção da sua identidade e reputação. Desenvolvemos estratégias de posicionamento e comunicação que promovem o reconhecimento institucional, fortalecem a confiança dos públicos e contribuem para uma imagem consistente.",
      },
      {
        title: "Comunicação Interna, Externa e de Crise",
        text: "Desenvolvemos soluções de comunicação que facilitam a circulação de informação e fortalecem o relacionamento entre as organizações e os seus diferentes públicos. Apoiamos igualmente a preparação de estratégias de resposta a situações sensíveis, contribuindo para uma gestão responsável da informação e da reputação institucional.",
      },
    ],
  },
  programs: {
    title: "05. Implementação de Projectos & Programas",
    intro: [],
    outro: [],
    sections: [
      {
        title: "Concepção e Desenvolvimento de Projectos",
        text: "Transformamos ideias e oportunidades em projectos estruturados, através da identificação de necessidades, definição de objectivos e elaboração de propostas de intervenção. Trabalhamos na construção de soluções ajustadas às prioridades de cada organização, considerando a viabilidade, os recursos e os resultados pretendidos.",
      },
      {
        title: "Planeamento, Gestão e Coordenação",
        text: "Asseguramos o planeamento e a coordenação de projectos e programas, definindo actividades, cronogramas, responsabilidades e mecanismos de execução. Acompanhamos os processos de implementação, promovendo uma gestão organizada dos recursos e garantindo o alinhamento entre as actividades e os objectivos estabelecidos.",
      },
      {
        title: "Parcerias e Articulação Institucional",
        text: "Promovemos a identificação, mobilização e articulação de parceiros estratégicos para o desenvolvimento e implementação de projectos e programas. Facilitamos a cooperação entre instituições públicas, organizações privadas, parceiros de desenvolvimento e outros intervenientes, criando oportunidades para iniciativas conjuntas.",
      },
      {
        title: "Monitorização, Avaliação e Resultados",
        text: "Desenvolvemos mecanismos de acompanhamento e avaliação que permitem analisar o progresso, medir resultados e identificar oportunidades de melhoria durante a execução dos projectos. Elaboramos relatórios técnicos e de desempenho que apoiam a tomada de decisões, a transparência e a avaliação do impacto das iniciativas.",
      },
    ],
  },
};
