-- Eventos vs Comunicação (2026-11-19): o admin define em "Visual do Evento"
-- se cada evento do Pulse aparece na secção "Eventos" ou "Comunicação" da
-- página inicial, e (para Comunicação) os canais onde passou
-- (ex.: "TVM, YouTube, Redes Sociais").
-- Correr uma vez no SQL Editor do Supabase.
alter table event_overrides add column if not exists category text not null default 'evento';
alter table event_overrides drop constraint if exists event_overrides_category_check;
alter table event_overrides add constraint event_overrides_category_check
  check (category in ('evento', 'comunicacao'));
alter table event_overrides add column if not exists channels text;
