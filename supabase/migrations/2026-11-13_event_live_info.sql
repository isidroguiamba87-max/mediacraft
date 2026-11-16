-- Dados do "Ao Vivo" (Zoom) por evento, editados no admin em "Visual do
-- Evento": link de entrada (se não vier do Pulse), ID da reunião, senha,
-- link do chat e instruções de acesso. JSON, ex.:
-- {"joinUrl":"https://zoom.us/j/84275122896","meetingId":"84275122896",
--  "passcode":"751947","chatUrl":"https://…","instructions":"…"}
-- Correr uma vez no SQL Editor do Supabase.
alter table event_overrides add column if not exists live_info jsonb;
