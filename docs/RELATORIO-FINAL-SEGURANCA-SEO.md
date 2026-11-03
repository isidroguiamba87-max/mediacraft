# Relatório Final — Segurança + SEO/Indexação — MediaCraft

**Data:** 2026-11-03
**Âmbito:** execução completa (Fases 0-7) do prompt de endurecimento de segurança e SEO para o website institucional da MediaCraft (Next.js + Vercel), incluindo o painel de administração.

As checklists detalhadas, item a item, estão em `docs/CHECKLIST-SEGURANCA.md` e `docs/CHECKLIST-SEO.md`. Este documento resume o que foi encontrado, o que foi feito, o que não foi possível fazer a partir do repositório, e os riscos que ficam.

## 1. O que estava em falta (Fase 0 — auditoria inicial)

- Sem nenhum header de segurança (CSP, HSTS, X-Frame-Options, etc.).
- Login de admin feito no cliente, sem MFA, sem RLS a sério (a tabela `is_admin()` nem tinha `security definer`).
- Sem validação Zod nos formulários, sem rate limiting, sem protecção anti-bot.
- Uploads sem validação real de tipo/tamanho, sem remoção de EXIF, sem redimensionamento.
- `isomorphic-dompurify` a rebentar em produção com `ERR_REQUIRE_ESM`, mascarado por um *fallback* para dados fictícios — o site parecia funcionar mas mostrava sempre dados falsos.
- Sem CI, sem Dependabot/CodeQL, sem `SECURITY.md`.
- `hreflang` tecnicamente presente mas incorrecto em todas as páginas excepto a inicial.
- Sem `llms.txt`, sem dados estruturados (JSON-LD), sitemap básico sem páginas dinâmicas.
- Sem banner de cookies, sem Política de Privacidade nem Termos de Uso.
- Next.js numa versão com 2 RCEs críticas e 1 DoS conhecidas.

## 2. O que foi implementado

### Segurança (Fases 1-3)
Headers completos (CSP com nonce em Report-Only, HSTS, X-Frame-Options, etc.), login no servidor com MFA (TOTP), RLS em todas as tabelas próprias com `is_admin()` corrigido, validação Zod em todos os inputs, rate limiting + honeypot, uploads validados/reencodados/sem EXIF (com arquitectura de upload directo para contornar o limite de ~4.5MB da Vercel), `error.tsx`/`not-found.tsx` sem fuga de informação, log de auditoria (`admin_audit_log`), CI + Dependabot + CodeQL + `SECURITY.md`, Next.js actualizado para 16.4.4.

### SEO (Fases 4-6)
`sitemap.xml` dinâmico com eventos/notícias reais, `robots.txt`, `llms.txt`/`llms-full.txt`, canonical + hreflang corrigido em todas as páginas, metadados completos (Open Graph, Twitter Card, imagem OG dinâmica de marca, favicon/manifest/theme-color), dados estruturados JSON-LD (Organization, WebSite, BreadcrumbList, Event, Person, Service), correcção do `<h1>` em falta em `/sobre`, limpeza de 49 dependências mortas (three.js nunca usado), `@next/bundle-analyzer`, `preload` no vídeo do hero.

### Privacidade e conformidade (Fase 7)
`.env.example` (estava em falta), banner de consentimento de cookies, páginas de Política de Privacidade e Termos de Uso nos três idiomas, reflectindo com precisão o que o site realmente faz (formulário de contacto, bilhética processada pela Pulse, painel de administração).

Todas as fases foram validadas com `npm run build` + `npx tsc --noEmit` + `npm run lint` sem erros, e a maior parte foi também confirmada ao vivo em produção via Vercel Runtime Logs e navegação directa.

## 3. Achado crítico a resolver — formulário de contacto não entrega mensagens

Durante esta fase final, ao escrever a Política de Privacidade, confirmei no código (`app/api/contact/route.ts`) que **o formulário de contacto nunca foi ligado a um destino real** — valida os dados, regista-os com `console.log` (só visível nos Runtime Logs da Vercel, e só temporariamente) e devolve sucesso ao visitante. Ou seja: hoje, qualquer pessoa que preencha "Fale connosco" no site recebe a confirmação de envio, mas a MediaCraft **nunca chega a ver essa mensagem**.

Isto não é uma falha de segurança (nada é exposto ou mal usado), mas é uma falha funcional importante — não é algo que eu deva simplesmente ligar a um serviço de email sem a tua escolha, porque implica criar conta num provedor (Resend, Amazon SES, SendGrid, etc.) e gerar uma chave de API nova. **Ver acção manual #1 abaixo.**

## 4. Acções manuais (lista numerada)

1. **Ligar o formulário de contacto a um destino real.** Escolhe um provedor de email transaccional (Resend é o mais simples de configurar com Next.js/Vercel) ou pede-me para o fazer depois de criares a conta e me dares a chave de API, para eu terminar `app/api/contact/route.ts`.
2. **Testar o painel de administração por inteiro e depois activar a CSP a sério.** Faz login e percorre todas as páginas do painel (Dashboard, Novidades, Galeria, Avaliação, Perguntas, Networking, Visual do Evento, Dados do Pulse, Segurança) com a consola do browser aberta. Sem violações → avisa-me para mudar `Content-Security-Policy-Report-Only` para `Content-Security-Policy` em `proxy.ts` (uma linha).
3. **Confirmar que todas as contas de administrador têm o MFA (TOTP) activo.** Verifica em `/admin/seguranca` com cada conta, ou consulta a tabela `auth.mfa_factors` no painel do Supabase.
4. **Documentar um plano de rotação de chaves.** Pelo menos: `SUPABASE_SECRET_KEY` deve poder ser rodada a partir do painel do Supabase sem perda de serviço (gera uma nova, actualiza na Vercel, remove a antiga).
5. **(Opcional, mais robustez) Upstash Redis para rate limiting real.** Cria uma conta gratuita em upstash.com, cria uma base Redis, copia `UPSTASH_REDIS_REST_URL`/`UPSTASH_REDIS_REST_TOKEN` para a Vercel — depois pede-me para trocar `lib/rate-limit.ts` pelo `@upstash/ratelimit`.
6. **Confirmar os backups automáticos da base de dados no Supabase.** Painel do Supabase → Project Settings → Database → Backups. Confirma a frequência e a retenção do teu plano, e faz pelo menos um teste de restauro para uma base de testes — "backup não testado não é backup".
7. **Instalar monitorização de erros (Sentry) — opcional mas recomendado.** Cria conta em sentry.io, projecto Next.js, e dá-me o DSN para eu instalar o SDK (`@sentry/nextjs`) correctamente.
8. **Uptime monitoring do domínio.** Um serviço gratuito (UptimeRobot, Better Uptime) a verificar `https://mediacraft.co.mz` a cada 5 minutos, com alerta por email/SMS se cair, e aviso de expiração do certificado TLS/domínio.
9. **Google Search Console.** Verifica a propriedade do domínio (`mediacraft.co.mz`) via registo DNS TXT, submete `https://mediacraft.co.mz/sitemap.xml`, pede indexação manual das páginas principais nas três línguas.
10. **Bing Webmaster Tools.** Importa directamente a partir do Google Search Console (opção "Import from Google Search Console").
11. **Google Business Profile.** Cria/reclama o perfil da MediaCraft para aparecer em pesquisas locais em Maputo — essencial para pesquisa local em Moçambique.
12. **Escolher e configurar uma ferramenta de analítica com consentimento.** Vercel Web Analytics (mais simples, já estás na Vercel) ou Plausible/Umami (mais privado, auto-hospedado). O banner de cookies já está pronto para gatear o que vier a seguir.
13. **Verificar o domínio nas redes sociais** (LinkedIn, Instagram, Facebook) para os cartões Open Graph aparecerem com o selo de verificado/domínio associado, quando a rede social o permitir.
14. **Rich Results Test / Schema Markup Validator.** Corre `https://mediacraft.co.mz/pt`, `/pt/eventos/<id>` e `/pt/sobre` em `search.google.com/test/rich-results` e `validator.schema.org` para confirmar que o JSON-LD passa sem erros (já verifiquei que é JSON válido e com os campos certos, mas não corri estas ferramentas específicas).
15. **PageSpeed Insights.** Corre `https://mediacraft.co.mz` (mobile e desktop) em `pagespeed.web.dev` — o código já está optimizado (ver `CHECKLIST-SEO.md`, B5), mas só esta ferramenta dá a pontuação real.
16. **Revisão jurídica da Política de Privacidade e Termos de Uso.** Os textos foram escritos com precisão sobre o que o site faz, mas não substituem aconselhamento jurídico formal — recomenda-se revisão por um advogado antes de tratar como definitivos.
17. **Decidir o destino das fotos/vídeos da Pulse (`next/image`).** Quando o host de media da Pulse estiver finalizado, trocar os `<img>` simples por `next/image` nessas zonas (gallery, capas de evento, fotos de orador) — está documentado em `next.config.ts` mas depende da Pulse, não deste repositório.

## 5. Riscos residuais

- **Rate limiting em memória** — não resiste a um ataque distribuído por várias instâncias serverless da Vercel. Mitigação: acção manual #5.
- **Painel de administração não testado por inteiro com CSP aplicada** — risco de a CSP bloquear algo que ainda não foi visto. Mitigação: acção manual #2, antes de activar a CSP a sério.
- **Formulário de contacto não entrega mensagens** — risco funcional, não de segurança, mas significativo para o negócio. Ver secção 3.
- **Sem monitorização de erros nem alertas de disponibilidade** — um problema em produção só é descoberto se alguém o reportar ou se formos ver os Runtime Logs manualmente. Mitigação: acções manuais #6-8.
- **16 vulnerabilidades moderadas no `npm audit`**, todas em ferramentas de desenvolvimento (ESLint), nunca em código que corre em produção — baixo risco real, documentado em `CHECKLIST-SEGURANCA.md` A9.
- **Abas de Galeria/Novidades de cada evento consultam sempre o Supabase no servidor**, mesmo quando o visitante nunca as abre — custo de desempenho pequeno mas real em cada carregamento de página de evento. Corrigir implica novas rotas de API.
- **Testes mobile não exaustivos** (sem grelha sistemática 360/390/414px + 3G simulado + contraste AA medido) — risco residual baixo dado o volume de correcções mobile já feitas ao longo do projecto, mas não verificado formalmente.

## 6. Plano mínimo de resposta a incidentes

- **Suspeita de chave/segredo comprometido** (`SUPABASE_SECRET_KEY`, token de admin): gera uma nova chave no painel do Supabase (Project Settings → API), actualiza na Vercel (Environment Variables), faz redeploy, e só depois remove a antiga.
- **Conta de admin comprometida**: no Supabase Auth, revoga todas as sessões dessa conta (`supabase.auth.admin.signOut` com `scope: "global"`, ou via o painel) e força reset de password. O `admin_audit_log` mostra tudo o que essa conta fez enquanto esteve comprometida.
- **Dados corrompidos/apagados por engano**: restaura a partir do backup automático do Supabase (ver acção manual #6) — por isso é crítico confirmar que os backups existem e funcionam antes de precisares deles.
- **Quem avisar**: internamente, quem gere a conta Vercel/Supabase/GitHub da organização (`Isidro Helder Guiamba` / `isidroguiamba87-max`, conforme os commits desta sessão).
- **Vulnerabilidade de segurança reportada por terceiros**: canal definido em `SECURITY.md`.

---

Este relatório, mais `docs/CHECKLIST-SEGURANCA.md` e `docs/CHECKLIST-SEO.md`, fecham as 8 fases (0-7) do prompt original.
