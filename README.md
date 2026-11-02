# MediaCraft — Website Institucional

Site institucional da MediaCraft Moçambique: Next.js (App Router) +
TypeScript + Tailwind CSS, trilingue (PT/EN/FR), ligado à plataforma de
eventos **Pulse** via API REST.

## Como correr

```bash
npm install
cp .env.local.example .env.local   # e preenche os valores (ver secção Pulse)
npm run dev
```

Abre `http://localhost:3000` — és redireccionado para `/pt`. `/en` e `/fr`
também funcionam. Sem uma instância do Pulse a correr, as páginas de
eventos mostram automaticamente conteúdo de demonstração (ver secção Pulse).

Outros scripts: `npm run build`, `npm run start`, `npm run lint`.

## Onde mudar cada coisa

| Queres mudar…                          | Ficheiro(s)                                                   |
| --------------------------------------- | -------------------------------------------------------------- |
| **Cores, raio, sombra da marca**        | `styles/tokens.css`                                             |
| **Fontes / mapeamento de cores Tailwind** | `tailwind.config.ts`                                          |
| **Textos visíveis (PT/EN/FR)**          | `messages/pt.json`, `messages/en.json`, `messages/fr.json`      |
| **Equipa** (fotos, e-mail, LinkedIn…)   | `content/team.ts` (cargo/título traduzido fica em `messages/*.json` → `team.members.<id>.role`) |
| **Parceiros** (logótipos)               | `content/partners.ts` + ficheiros em `public/images/partners/`  |
| **Serviços** (os 5 pilares)             | `content/services.ts` (ícone/ordem) + `messages/*.json` → `services.items.<id>` |
| **Contactos, redes sociais, navegação** | `config/site.config.ts`                                         |
| **Logótipo**                            | `public/logo/logo-dark.svg` (fundo claro) e `logo-light.svg` (fundo escuro) |
| **Fontes de marca (Noe Display / Avenir)** | Ainda não incluídas — ver "Tipografia" abaixo                |

Nenhum destes ficheiros contém JSX/lógica de componentes — é seguro editá-los
sem tocar em `components/`.

### Tipografia

`styles/tokens.css` já define `--font-display` (Noe Display) e `--font-body`
(Avenir) com *fallbacks* de sistema, por isso o site funciona sem os
ficheiros de fonte. Quando os tiveres:

1. Coloca os ficheiros `.woff2` em `public/fonts/`.
2. Adiciona os `@font-face` correspondentes no topo de `app/globals.css`.

Nada mais precisa de mudar — todos os componentes já usam `font-display` /
`font-body` via Tailwind.

## Estrutura

```
app/[locale]/       páginas (home, eventos, sobre, contacto) — uma pasta por rota
components/         UI, organizada por secção (layout, home, events, about, contact, ui)
content/             dados estruturais não-texto (equipa, parceiros, serviços)
messages/            textos traduzidos, um ficheiro por idioma
lib/pulse/           cliente da API Pulse (eventos, bilhetes, autenticação)
lib/bff/              serviço interino para Novidades, Perguntas e Avaliações
config/               marca, navegação, configuração de i18n e do Pulse
styles/tokens.css     tokens de design (cores/raio/sombra) — fonte única da verdade
```

## Ligação ao Pulse

1. Copia `.env.local.example` para `.env.local`.
2. Define `NEXT_PUBLIC_API_URL` (por omissão `http://localhost:3000/api/v1`).
3. Define `NEXT_PUBLIC_MEDIACRAFT_ORGANIZER_ID` com o id do organizador
   MediaCraft no Pulse — o site só mostra eventos deste organizador.

O wrapper `lib/pulse/client.ts` trata do envelope `{code, success, payload}`,
do cabeçalho `Authorization: Bearer` e faz *refresh* automático do token em
caso de 401. Os erros lançados (`PulseApiError`) devem ser tratados pelo
`code`, nunca pela `message`.

**Sem backend do Pulse a correr**, `lib/pulse/endpoints.ts` cai
automaticamente num conjunto de eventos de demonstração (`MOCK_EVENTS`),
para que `/eventos` e o micro-site de cada evento continuem navegáveis
durante o desenvolvimento. Assim que `NEXT_PUBLIC_API_URL` responder com
sucesso, os dados reais tomam o lugar automaticamente — não há nenhuma
flag para desligar.

### Novidades, Perguntas e Avaliações (interino)

Pulse ainda não expõe estas funcionalidades. `lib/bff/index.ts` implementa-as
como um serviço interino em memória (reinicia com o servidor), exposto via
`app/api/bff/**` para permitir *polling* a partir dos separadores "Ao Vivo" e
"Perguntas" do micro-site do evento (não há WebSocket/tempo real). Quando o
Pulse passar a suportar isto nativamente, basta substituir o corpo destas
funções por chamadas a `lib/pulse/endpoints.ts` — as assinaturas mantêm-se.

## Notas sobre o Next.js 16

Este projecto foi gerado com Next.js 16, que introduziu algumas mudanças
relevantes:

- `params` e `searchParams` são sempre `Promise` — todas as páginas fazem
  `await params`.
- Como o layout raiz vive em `app/[locale]/layout.tsx` (um segmento
  dinâmico), o 404 verdadeiramente global usa a nova convenção
  `app/global-not-found.tsx` (com `experimental.globalNotFound` activo em
  `next.config.ts`), em vez de um `app/not-found.tsx` simples. Os 404
  dentro de um idioma (ex.: um `eventId` inexistente) continuam a usar
  `app/[locale]/not-found.tsx`, já traduzido.

## Desenvolvido por

Smart Business Partner Technology.
