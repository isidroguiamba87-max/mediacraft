# Política de Segurança

## Reportar uma vulnerabilidade

Se encontrares uma vulnerabilidade de segurança neste site, por favor
**não** abras uma issue pública. Contacta-nos diretamente:

- Email: [info@mediacraft.co.mz](mailto:info@mediacraft.co.mz)

Inclui, se possível:

- Descrição do problema e o impacto potencial.
- Passos para reproduzir (URL, pedido, payload).
- Versão/commit onde foi encontrado.

Confirmamos a receção dentro de alguns dias úteis e mantemos-te
informado até o problema estar corrigido.

## Âmbito

Este repositório cobre o site institucional e o painel de administração
da MediaCraft (Next.js, hospedado na Vercel). **Não** cobre:

- A plataforma Pulse (backend de eventos/bilhetes) — é um sistema
  externo, separado, gerido por outra equipa.
- A infraestrutura da Vercel/Supabase em si (reporta a essas empresas
  diretamente para vulnerabilidades da própria plataforma).

## Dependências

As dependências são mantidas atualizadas via Dependabot
(`.github/dependabot.yml`) e analisadas em cada alteração via CodeQL
(`.github/workflows/codeql.yml`) e `npm audit` no CI
(`.github/workflows/ci.yml`, falha em vulnerabilidades altas/críticas).
