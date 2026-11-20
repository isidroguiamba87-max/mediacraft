-- Álbuns da galeria (2026-11-20): o admin marca uma foto de cada evento como
-- capa do álbum; a Galeria do site mostra um álbum por evento com essa capa.
-- No máximo uma capa por evento.
-- Correr uma vez no SQL Editor do Supabase.
alter table gallery_media add column if not exists is_cover boolean not null default false;
create unique index if not exists gallery_media_one_cover_per_event
  on gallery_media (event_id) where is_cover;
