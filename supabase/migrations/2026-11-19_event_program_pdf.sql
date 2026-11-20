-- Programa do evento em PDF (2026-11-19): o admin carrega o PDF em "Visual do
-- Evento" a cada actualização; o site mostra-o no topo da secção Programa.
-- Correr uma vez no SQL Editor do Supabase.
alter table event_overrides add column if not exists program_pdf_url text;
alter table event_overrides add column if not exists program_pdf_updated_at timestamptz;
