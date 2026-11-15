-- Primeira tela do evento (design de 2026-11-13): o logótipo do próprio
-- evento (barra de cima) e o tema/subtítulo por baixo do nome. Os dois são
-- só de apresentação, editados no admin em "Visual do Evento".
-- Correr uma vez no SQL Editor do Supabase.
alter table event_overrides add column if not exists logo_url text;
alter table event_overrides add column if not exists tagline text;
