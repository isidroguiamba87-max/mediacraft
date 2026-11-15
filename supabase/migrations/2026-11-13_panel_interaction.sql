-- Espaço de interação dos painelistas (2026-11-13): substitui as perguntas
-- públicas. O admin gera um link privado por evento (panel_token); quem o
-- tem abre a página do evento com um campo para escrever, e as mensagens
-- ficam em panel_messages. Só o servidor (service role, depois de validar o
-- link) e o admin acedem às mensagens.
-- Correr uma vez no SQL Editor do Supabase.

alter table event_overrides add column if not exists panel_token text unique;

create table if not exists panel_messages (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  name text not null,
  message text not null,
  created_at timestamptz not null default now()
);

create index if not exists panel_messages_event_id_idx on panel_messages (event_id, created_at);

alter table panel_messages enable row level security;

drop policy if exists "admin full access" on panel_messages;
create policy "admin full access" on panel_messages for all using (is_admin()) with check (is_admin());
