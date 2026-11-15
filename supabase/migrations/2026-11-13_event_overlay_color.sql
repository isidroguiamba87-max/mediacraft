-- Cor da sombra (overlay) por cima da capa do evento, editável no admin
-- ("Visual do Evento"). Guardada como hex de 8 dígitos (#rrggbbaa): cor +
-- intensidade. NULL = a sombra padrão (azul-escuro a 60%).
-- Correr uma vez no SQL Editor do Supabase.
alter table event_overrides add column if not exists overlay_color text;
