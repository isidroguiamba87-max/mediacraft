# Checklist de SEO — MediaCraft

Estado em 2026-11-03, no fim das Fases 0-7 do prompt de segurança/SEO.
✅ implementado · ⚠️ parcial / precisa de confirmação · ⏳ depende de acção externa (não implementável só no repositório)

## B1. Fundações técnicas de indexação

- ✅ `sitemap.xml` dinâmico (`app/sitemap.ts`) — páginas estáticas + eventos reais do Pulse + novidades publicadas, com `lastModified`/`changeFrequency`/`priority` e hreflang por URL. Protegido contra listar eventos "fantasma": se o Pulse estiver em baixo e `getPublicEvents` cair no fallback de dados fictícios, esses eventos são excluídos do sitemap.
- ✅ `robots.txt` (`app/robots.ts`) — bloqueia `/admin`, `/api`, `/responder`, aponta para o sitemap no domínio canónico.
- ✅ `llms.txt` e `llms-full.txt` em `public/` — conteúdo institucional real (serviços, missão/visão/valores, história, contactos), não texto genérico.
- ✅ Canonical em todas as páginas (`lib/seo.ts`, `buildMetadata`).
- ✅ hreflang completo (pt/en/fr + `x-default`) — **corrigido um bug real**: antes, todas as páginas herdavam do layout um hreflang fixo que apontava sempre para a raiz do idioma (ex.: `/eventos` dizia que a sua versão em inglês era `/en`, não `/en/eventos`).
- ✅ `noindex` automático fora de produção (`VERCEL_ENV !== "production"`) — cobre os deploys de preview da Vercel — e nas páginas 404 (locale e global).
- ✅ Página 404 personalizada por idioma já existia (`app/[locale]/not-found.tsx`).
- ⏳ Redireccionamentos 301 de URLs antigos — não aplicável: não há URLs antigos conhecidos (site novo nesta estrutura).

## B2. Metadados

- ✅ Metadata API do Next.js com helper central (`lib/seo.ts`) — título único (50-60 caracteres), meta description única (140-160) por página e idioma, já existiam nos textos de `messages/*.json` e foram verificados.
- ✅ Open Graph completo (título, descrição, URL, imagem, `og:locale`+`alternateLocale`, tipo) e Twitter Card (`summary_large_image`) em todas as páginas.
- ✅ Imagem OG de marca, gerada dinamicamente (`app/[locale]/opengraph-image.tsx`, cores `#001B32`/`#BF262E`), por omissão; páginas de evento/notícia usam a capa real quando existe.
- ✅ Favicon (`app/icon.png`), `apple-touch-icon` (180×180, gerado a partir do ícone existente), `manifest.webmanifest` (`app/manifest.ts`) e `theme-color`.

## B3. Dados estruturados (Schema.org / JSON-LD)

- ✅ `Organization`+`LocalBusiness` (nome, logo, morada, email, redes sociais via `sameAs`) — injectado uma vez, em todas as páginas.
- ✅ `WebSite` — sem `SearchAction` (não há pesquisa no site; adicionar se um dia existir).
- ✅ `BreadcrumbList` em todas as páginas internas (eventos, evento individual, novidades, notícia individual, sobre, contacto, política de privacidade, termos de uso).
- ✅ `Event` completo nas páginas de evento (datas, local/morada, organizador, bilhetes/preço, imagem) — testado ao vivo num evento real.
- ✅ `Person` para os 11 membros da equipa em `/sobre` (nome, cargo real, foto, LinkedIn/email).
- ✅ `Service` para os 5 pilares de serviço na home.
- ⚠️ `ImageObject` para a galeria de cada evento — não implementado separadamente; a capa do evento já tem `image` no `Event`, mas as fotos individuais da galeria (carregadas do lado do cliente) não têm o seu próprio JSON-LD. Impacto reduzido (a galeria em si não é conteúdo tipicamente indexado como imagem de resultado).
- ✅ Protecção contra XSS no JSON-LD: título vindo do Pulse/Supabase com `</script>` escapado antes de entrar no `<script>`.
- ⏳ Validação no Rich Results Test / Schema Markup Validator — ferramentas externas (google.com/search/test, validator.schema.org), não corridas nesta sessão. Ver acção manual.

## B4. Conteúdo e palavras-chave

- ✅ Um só `<h1>` por página, hierarquia `h1→h2→h3` — auditado em todo o site; **corrigido um bug real**: `/sobre` não tinha nenhum `<h1>` (o título de abertura estava em `<h2>`).
- ✅ Palavras-chave principais já naturalmente presentes nos títulos/descrições existentes (ex.: "comunicação estratégica", "eventos corporativos", "Moçambique").
- ✅ HTML semântico (`header`, `nav`, `main`, `section`, `article`, `footer`) — já estava correcto.
- ✅ `alt` em todas as imagens — auditado: as imagens com `alt=""` são intencionais (cartões de evento/notícia onde o título já aparece como texto ao lado, evitando duplicar a leitura para quem usa leitor de ecrã); logótipos sem nome visível ao lado (parceiros na home) já usam `alt` descritivo real.
- ✅ Links internos com texto âncora descritivo (nunca "clique aqui").
- ✅ Conteúdo traduzido de verdade nos três idiomas (não é tradução automática truncada) — confirmado ao escrever a Política de Privacidade/Termos de Uso desta fase, seguindo o mesmo padrão do resto do site.
- ⏳ Blog/notícias — já existe (`/novidades`), estrutura pronta para crescer.

## B5. Performance e Core Web Vitals

- ✅ `next/image` com `priority` na primeira imagem do hero; imagens do Pulse (capas de evento, galeria) ficam de propósito como `<img>` simples até o host de media da Pulse estar finalizado (decisão documentada no próprio `next.config.ts`).
- ✅ Fontes: sem `@font-face` real a carregar — cai directo em fontes do sistema (zero pedidos de rede, zero CLS/FOIT); a única fonte web usada (`Dancing_Script`) já vem via `next/font/google` (auto-hospedada).
- ✅ `prefers-reduced-motion` respeitado nas animações grandes (hero, scroll-thread da home, carrossel da equipa). ⚠️ Não aplicado em transições pequenas (modais, drawer, separador do evento) — baixo impacto (opacidade/deslocamento curtos, não o tipo de movimento que motiva a preferência), deixado como está.
- ✅ Lazy loading: o embed do YouTube ("Ao Vivo") só entra no DOM quando o separador fica activo — nunca carrega antes disso.
- ✅ Cache/revalidação (`next: { revalidate: 60 }`) em todas as chamadas à API Pulse.
- ✅ `@next/bundle-analyzer` instalado (`npm run analyze`), 49 dependências mortas removidas (`@react-three/fiber`, `@react-three/drei`, `three` — zero importações em todo o código).
- ⚠️ Vídeo de abertura do hero: `preload="auto"` adicionado nesta fase (tocava via `.play()` no carregamento mas só começava a transferir nesse momento).
- ⚠️ As abas de Galeria e Novidades de cada página de evento fazem a sua própria consulta ao Supabase no servidor sempre que a página carrega, mesmo que o visitante nunca abra essas abas (ao contrário de Perguntas/Bilhetes/Oradores, já convertidos para buscar do lado do cliente). Corrigir isso pede novas rotas de API e mexe na arquitectura do `EventShell` — não feito, fica como recomendação.
- ⏳ Medição real (LCP/CLS/INP em ms, pontuação 0-100) — só é possível correndo https://pagespeed.web.dev contra o domínio real. Ver acção manual.

## B6. Mobile-first

- ✅ Menu de navegação móvel (`MobileBottomNav`) com `aria-label`, `aria-current`, alvos de toque ≈47px (acima do mínimo de 44×44px).
- ✅ Tipografia do corpo ≥16px (padrão do Tailwind/`text-sm`+ usado no site).
- ✅ Sem scroll horizontal detectado nas páginas verificadas ao vivo (home, eventos, evento, novidades, sobre, contacto).
- ✅ `lang` correcto por locale (`<html lang={locale}>`).
- ⚠️ Testado nos ecrãs reais usados ao longo da sessão (Chrome desktop + capturas a 375px), não numa grelha sistemática de 360/390/414px + tablet; dado o volume de correcções mobile já feitas ao longo deste projecto (vídeo, cartões, rodapé, separador Programa, contadores), o risco residual aqui é baixo mas não zero.
- ⏳ Teste em ligação 3G simulada — não corrido nesta sessão.
- ⏳ Contraste AA do `#BF262E` sobre branco — não medido com uma ferramenta própria (ex. WebAIM Contrast Checker); o vermelho de marca é usado sobretudo em texto a negrito/grande e em fundos sólidos, onde o risco de falhar AA é menor, mas fica por confirmar.

## B7. Acções externas (documentadas, não executadas)

Ver a lista numerada completa em `docs/RELATORIO-FINAL-SEGURANCA-SEO.md` — inclui Google Search Console, Bing Webmaster Tools, Google Business Profile, escolha e configuração de uma ferramenta de analítica com consentimento, e verificação do domínio nas redes sociais.

---

**Resumo:** B1-B4 (fundações, metadados, dados estruturados, conteúdo) estão praticamente completos. B5-B6 (performance, mobile) têm o código já no estado correcto, mas faltam as medições reais (PageSpeed Insights, teste de contraste) que só uma ferramenta externa consegue dar. B7 é inteiramente acção do cliente.
