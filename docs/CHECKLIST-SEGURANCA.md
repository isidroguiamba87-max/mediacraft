# Checklist de Segurança — MediaCraft

Estado em 2026-11-03, no fim das Fases 0-7 do prompt de segurança/SEO.
✅ implementado · ⚠️ parcial / precisa de confirmação · ⏳ depende de acção externa (não implementável só no repositório)

## A1. Transporte e cabeçalhos

- ✅ HTTPS forçado (Vercel) + HSTS (`Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`, `next.config.ts`).
- ⚠️ CSP com nonce em `proxy.ts`, mas **ainda em `Content-Security-Policy-Report-Only`**, não aplicada a sério. Testada ao vivo (home, eventos, evento individual, novidades, sobre, contacto, `/admin/login`, `/responder`) sem nenhuma violação na consola — mas as páginas internas do painel de administração (`/admin/galeria`, `/novidades`, `/eventos`, `/perguntas`, `/networking`, `/pulse`, `/seguranca`, `/avaliacao`) nunca foram verificadas (sem credenciais de admin). **Ver acção manual #1.**
- ✅ `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` (câmara/microfone/geolocalização/pagamentos/USB desligados), `Cross-Origin-Opener-Policy`/`Cross-Origin-Resource-Policy: same-origin`.
- ✅ `X-Powered-By` removido (`poweredByHeader: false`).
- ⏳ CORS restritivo — não há API própria exposta a terceiros além dos endpoints `/api/bff/*` e `/api/contact`, usados só pelo próprio site; nada a bloquear hoje. Reavaliar se um dia existir uma API pública.
- ⏳ SRI — não há scripts/CSS de CDN externo carregados (fontes via `next/font`, auto-hospedadas); não aplicável.

## A2. Autenticação, palavras-passe e sessões

- ✅ Login de admin corre no servidor (Server Action), nunca no cliente.
- ✅ Hash de password gerido pelo Supabase Auth (bcrypt).
- ✅ MFA (TOTP) implementado — aplicado automaticamente a qualquer conta que já tenha um factor inscrito (`aal.nextLevel === "aal2"` força `/admin/mfa`). ⚠️ Não verificado se **todas** as contas de admin actuais já têm o MFA inscrito — ver acção manual #2.
- ✅ Sessões via cookies `HttpOnly`/`Secure`/`SameSite` (padrão do `@supabase/ssr`), nunca em `localStorage`.
- ✅ Limitação de tentativas de login (8/15min por IP) e de código MFA (10/15min por IP) — ver limitação em A8.
- ✅ Mensagens de erro genéricas no login (não revelam se o email existe).
- ⏳ Fluxo de recuperação de password — gerido directamente pelo Supabase Auth (não há UI própria no site para isso); confirmar que o reset de password está configurado no painel do Supabase.

## A3. Autorização e acesso a recursos

- ✅ Toda a lógica de permissões corre no servidor (Server Actions + RLS), nunca confiando no cliente.
- ✅ RLS activado em todas as tabelas próprias (`news`, `news_media`, `event_overrides`, `admin_audit_log`, etc.), com `is_admin()` como `security definer` (corrigido nesta fase — sem isto, **todas** as acções de admin estavam bloqueadas com "permission denied for table mfa_factors").
- ✅ Rotas `/admin/*` fora do sitemap e com `noindex` próprio (`app/admin/layout.tsx`), independente do ambiente.
- ✅ IDOR: cada acção de admin volta a verificar `is_admin()` do lado do Supabase, não só no middleware.

## A4. Validação de entrada e injecções

- ✅ Zod em todos os formulários/Server Actions (`lib/validation/*`).
- ✅ Sem SQL — tudo via cliente Supabase (queries parametrizadas pela própria lib, nunca concatenação de strings).
- ✅ XSS: `sanitize-html` em todo o conteúdo HTML vindo do admin (substituiu `isomorphic-dompurify`, que rebentava em produção — `ERR_REQUIRE_ESM`); CSP como segunda barreira (ver A1).
- ✅ CSRF: Server Actions do Next.js já verificam a origem do pedido por omissão.
- ✅ Honeypot anti-bot no formulário de contacto.
- ⏳ Open redirect / SSRF — não há nenhum fetch que use uma URL fornecida pelo utilizador; não aplicável hoje.

## A5. Uploads de ficheiros

- ✅ Lista branca de extensões/MIME (imagens via `sharp`, decodificação real dos bytes, não a extensão), vídeo validado client-side (extensão + MIME + tamanho).
- ✅ Nomes de ficheiro sempre `crypto.randomUUID()`, nunca o nome original.
- ✅ Metadados EXIF removidos (nunca se chama `.withMetadata()` no `sharp`).
- ✅ Imagens sempre reencodadas para WebP e redimensionadas (máx. 2400px).
- ✅ Upload directo do browser para o Supabase Storage (`tmp/`) e só depois finalizado no servidor — contorna o limite real de ~4.5MB do corpo de uma Function da Vercel (um upload real dava 413 antes desta correcção).

## A6. Erros, logs e exposição de informação

- ✅ `error.tsx`/`not-found.tsx` por locale, sem stack traces nem detalhes internos visíveis ao utilizador.
- ✅ Source maps não publicados por omissão (comportamento padrão do Next.js em produção).
- ✅ Auditoria: `admin_audit_log` (quem, o quê, quando) nas acções que afectam o site público — tabela append-only (sem política de update/delete, nem para admins).
- ⚠️ Não há alerta automático quando o log de auditoria regista algo anómalo (picos de eliminações, por exemplo) — ver A10.

## A7. Dados sensíveis e segredos

- ✅ `.env.example` criado nesta fase (estava em falta) — lista as variáveis necessárias sem valores reais.
- ✅ `.gitignore` já cobre `.env*`, `node_modules`, `.vercel`.
- ✅ Auditados os `NEXT_PUBLIC_*` existentes — só `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_MEDIACRAFT_DOMAIN`, todas genuinamente públicas (chave anónima do Supabase é suposta ser pública — a segurança vem da RLS, não do segredo da chave).
- ⏳ Rotação de chaves — sem plano formal documentado; ver acção manual #3.
- ⏳ Minimização/retenção de dados do formulário de contacto — **o formulário de contacto não entrega as mensagens a lado nenhum ainda** (ver secção "Achado crítico" no relatório final) — por agora não há dados a reter, mas também a funcionalidade não funciona de verdade.

## A8. Abuso e disponibilidade

- ⚠️ Rate limiting implementado (`lib/rate-limit.ts`) em login, MFA e contacto, mas é **em memória, por instância serverless** — não garante um limite real sob carga distribuída pela Vercel entre várias instâncias. Documentado no próprio código. Upgrade sugerido: Upstash Redis + `@upstash/ratelimit` (variáveis já previstas em `.env.example`, comentadas). Ver acção manual #4.
- ✅ Honeypot no formulário de contacto.
- ✅ Corpo dos pedidos limitado (`serverActions.bodySizeLimit: "50mb"`, e uploads reais já não passam pelo corpo da Function — ver A5).
- ⏳ Protecção DDoS/WAF da Vercel — activada por omissão no plano Vercel, nada a configurar no repositório.

## A9. Dependências e cadeia de fornecimento

- ✅ Next.js actualizado de 16.3.8 → 16.4.4 (corrigiu 2 RCEs críticas + 1 DoS).
- ✅ Dependabot + CodeQL + workflow de CI (`.github/workflows/ci.yml`, `codeql.yml`) a correr build/typecheck/lint/audit.
- ✅ `SECURITY.md` com canal de reporte.
- ✅ Removidas 49 dependências mortas (`@react-three/fiber`, `@react-three/drei`, `three`) — zero importações em todo o código.
- ⚠️ `npm audit`: 16 vulnerabilidades moderadas, todas na cadeia `eslint-config-next` → `typescript-eslint` → `minimatch` (ReDoS em parsing de glob). É dependência **só de desenvolvimento** (ESLint não corre em produção) — corrigir exige um bump major do ESLint com possíveis breaking changes; deixado como está por ora, sinalizado aqui.

## A10. Backups, monitorização e alertas

- ⏳ **Backups automáticos da base de dados** — geridos pelo próprio Supabase (incluído no plano, com retenção que varia por plano). Não implementável a partir do repositório. Ver acção manual #5.
- ⏳ **Sentry** (ou equivalente) — não instalado; precisa de conta própria e de uma `SENTRY_DSN`. Ver acção manual #6.
- ⏳ **Vercel Analytics/Logs** — já disponíveis no dashboard da Vercel sem alterações ao código; os Runtime Logs já foram usados várias vezes nesta sessão para diagnosticar bugs ao vivo.
- ⏳ **Uptime monitoring + expiração de certificado/domínio** — serviço externo (UptimeRobot, Better Uptime, etc.), não implementável aqui. Ver acção manual #7.
- ✅ Plano mínimo de resposta a incidentes documentado — ver `docs/RELATORIO-FINAL-SEGURANCA-SEO.md`.

## A11. Privacidade e conformidade

- ✅ Banner de consentimento de cookies (`components/layout/CookieConsent.tsx`) — "Aceitar" / "Apenas essenciais", nada de analítica antes da escolha (e, por agora, não há analítica nenhuma instalada).
- ✅ Páginas de **Política de Privacidade** e **Termos de Uso**, nos três idiomas (`/politica-privacidade`, `/termos-de-uso`), reflectindo o que o site realmente faz: formulário de contacto, bilhética via Pulse, painel de administração.
- ✅ Cookies de sessão do Supabase já são `Secure`/`SameSite` por omissão do `@supabase/ssr`.
- ✅ Referência à Lei de Protecção de Dados Pessoais de Moçambique e, para visitantes europeus, ao RGPD — direitos de acesso/rectificação/eliminação/portabilidade/oposição.
- ⏳ Revisão jurídica formal destes textos — foram escritos com base no que o site efectivamente faz, mas não substituem aconselhamento jurídico. Ver acção manual #8.

---

**Resumo:** 9 das 11 secções (A1-A9) estão maioritariamente ✅, com itens pontuais sinalizados. A10 (backups/monitorização) e grande parte de A11 dependem de contas/serviços externos que só o cliente pode criar — documentados no relatório final com os passos exactos.
