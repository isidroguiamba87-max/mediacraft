-- MediaCraft admin panel — Supabase schema (reconstructed 2026-11-01)
--
-- The original Supabase project (bxhkxtkgntxbytinjgpz) was deleted with no
-- migration files saved anywhere in this repo. This script was rebuilt by
-- reading every query in lib/supabase/*.ts and lib/bff/index.ts (table
-- names, column names, RLS assumptions documented in their own comments)
-- — it is a best-effort reconstruction, not a recovered original. Review
-- before running against a fresh project, especially the `is_admin()`
-- definition and the exact RLS policies (their precise original wording is
-- lost; only their *behavior*, inferred from the app code, is captured
-- here).
--
-- Scope: ONLY tables that belong to this app's own database. Event/ticket/
-- session/speaker/registration data all lives in Pulse (a separate,
-- external backend — see lib/pulse/*) and is never stored here. Columns
-- like `event_id`, `speaker_id`, `session_id` below are opaque text
-- references into Pulse's own ids (e.g. "cmu6uw59d0055mo1pgfb1jg8t"),
-- never foreign keys into a local table — Pulse is not part of this
-- database and must not be modeled here.

-- ============================================================================
-- Admin check used by every RLS policy below.
--
-- This app has no self-serve signup and no custom admin_users/profiles
-- table anywhere in the code — admin accounts are created by hand in the
-- Supabase Auth dashboard. The simplest definition consistent with that is
-- "any authenticated user is an admin". Tighten this (e.g. check email
-- domain against @mediacraft.co.mz) if the real project enforced more.
-- ============================================================================
create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select auth.uid() is not null;
$$;

-- ============================================================================
-- news / news_media
-- Site-wide "Novidades" posts, optionally linked to one Pulse event.
-- ============================================================================
create table news (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  title text not null,
  summary text,
  body text,
  cover_url text,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  featured boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index news_event_id_idx on news (event_id);
create index news_status_published_at_idx on news (status, published_at desc);

create table news_media (
  id uuid primary key default gen_random_uuid(),
  news_id uuid not null references news (id) on delete cascade,
  type text not null check (type in ('image', 'video')),
  storage_url text,
  external_video_url text,
  caption text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create index news_media_news_id_idx on news_media (news_id);

alter table news enable row level security;
alter table news_media enable row level security;

create policy "admin full access" on news for all using (is_admin()) with check (is_admin());
create policy "public read published" on news for select using (status = 'published');

create policy "admin full access" on news_media for all using (is_admin()) with check (is_admin());
create policy "public read via published news" on news_media for select using (
  exists (select 1 from news where news.id = news_media.news_id and news.status = 'published')
);

-- ============================================================================
-- event_overrides
-- One row per Pulse event, created on first admin edit. event_id IS the
-- primary key (confirmed by the app's `onConflict: "event_id"` upserts —
-- there's no separate id column anywhere in the code).
-- ============================================================================
create table event_overrides (
  event_id text primary key,
  cover_image_url text,
  accent_color text,
  qa_enabled boolean not null default false,
  updated_at timestamptz not null default now()
);

alter table event_overrides enable row level security;

create policy "admin full access" on event_overrides for all using (is_admin()) with check (is_admin());
create policy "public read" on event_overrides for select using (true);

-- ============================================================================
-- gallery_media
-- Per-event photo/video gallery, admin-curated.
-- ============================================================================
create table gallery_media (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  type text not null check (type in ('image', 'video')),
  storage_url text,
  external_video_url text,
  caption text,
  day_or_session text,
  sort_order integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now()
);

create index gallery_media_event_id_idx on gallery_media (event_id);

alter table gallery_media enable row level security;

create policy "admin full access" on gallery_media for all using (is_admin()) with check (is_admin());
create policy "public read published" on gallery_media for select using (published = true);

-- ============================================================================
-- questions
-- Public Q&A submissions, moderated by the admin before they go live.
-- helpful_count/unhelpful_count are updated via the service-role client
-- (app-level race tolerated, see lib/bff/index.ts voteQuestionFeedback) —
-- no public UPDATE policy needed for that.
-- ============================================================================
create table questions (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  name text not null,
  question text not null,
  status text not null default 'new' check (status in ('new', 'reviewed', 'archived')),
  is_relevant boolean not null default false,
  answer text,
  panel_title text,
  speaker_name text,
  helpful_count integer not null default 0,
  unhelpful_count integer not null default 0,
  created_at timestamptz not null default now()
);

create index questions_event_id_idx on questions (event_id);

alter table questions enable row level security;

create policy "admin full access" on questions for all using (is_admin()) with check (is_admin());
create policy "public read relevant" on questions for select using (is_relevant = true);
create policy "public insert" on questions for insert with check (true);

-- ============================================================================
-- question_speaker_links
-- Admin-generated per-speaker tokens for the unauthenticated /responder/
-- answer link. Resolved publicly only via the service-role client
-- (resolveSpeakerToken), so this stays admin-only under RLS.
-- ============================================================================
create table question_speaker_links (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  speaker_name text not null,
  token text not null unique,
  created_at timestamptz not null default now()
);

create index question_speaker_links_event_speaker_idx on question_speaker_links (event_id, speaker_name);

alter table question_speaker_links enable row level security;

create policy "admin full access" on question_speaker_links for all using (is_admin()) with check (is_admin());

-- ============================================================================
-- networking_intents
-- Append-only log of "Connect" clicks from the public Networking feature.
-- Public can insert, only the admin can read/aggregate.
-- ============================================================================
create table networking_intents (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  speaker_id text not null,
  session_id text,
  source text not null check (source in ('session', 'speakers_directory')),
  connection_reason text not null check (connection_reason in ('negocio', 'parceria', 'tema', 'carreira', 'investimento', 'outro')),
  channel text not null check (channel in ('linkedin', 'whatsapp', 'other')),
  attendee_id text not null,
  created_at timestamptz not null default now()
);

create index networking_intents_event_id_idx on networking_intents (event_id);

alter table networking_intents enable row level security;

create policy "admin read" on networking_intents for select using (is_admin());
create policy "public insert" on networking_intents for insert with check (true);

-- ============================================================================
-- rating_forms / rating_form_questions
-- One form per event (auto-provisioned on first read, by either an admin
-- or an anonymous visitor — see getOrCreateRatingFormRow in lib/bff), with
-- an admin-editable list of extra questions beyond the base star rating.
-- ============================================================================
create table rating_forms (
  id uuid primary key default gen_random_uuid(),
  event_id text not null unique,
  is_active boolean not null default true,
  window_start timestamptz,
  window_end timestamptz
);

create table rating_form_questions (
  id uuid primary key default gen_random_uuid(),
  form_id uuid not null references rating_forms (id) on delete cascade,
  type text not null check (type in ('single_choice', 'multi_choice', 'text', 'scale')),
  label text not null,
  options jsonb,
  required boolean not null default false,
  sort_order integer not null default 0
);

create index rating_form_questions_form_id_idx on rating_form_questions (form_id);

alter table rating_forms enable row level security;
alter table rating_form_questions enable row level security;

create policy "admin full access" on rating_forms for all using (is_admin()) with check (is_admin());
create policy "public read" on rating_forms for select using (true);
-- Needed because an anonymous visitor's first page view of the day may be
-- what auto-provisions this event's row (see lib/bff/index.ts).
create policy "public insert" on rating_forms for insert with check (true);

create policy "admin full access" on rating_form_questions for all using (is_admin()) with check (is_admin());
create policy "public read" on rating_form_questions for select using (true);

-- ============================================================================
-- ratings / rating_answers
-- Public submissions against a rating_forms row. `ratings.id` is supplied
-- client-side by the app (crypto.randomUUID()) rather than read back after
-- insert, because there's deliberately no public SELECT policy — see the
-- comment in lib/bff/index.ts submitRating.
-- ============================================================================
create table ratings (
  id uuid primary key default gen_random_uuid(),
  event_id text not null,
  form_id uuid not null references rating_forms (id),
  session_id text,
  stars integer not null check (stars between 1 and 5),
  comment text,
  created_at timestamptz not null default now()
);

create index ratings_event_id_idx on ratings (event_id);
create index ratings_session_id_idx on ratings (session_id);

create table rating_answers (
  id uuid primary key default gen_random_uuid(),
  rating_id uuid not null references ratings (id) on delete cascade,
  question_id uuid not null references rating_form_questions (id),
  value jsonb
);

create index rating_answers_rating_id_idx on rating_answers (rating_id);

alter table ratings enable row level security;
alter table rating_answers enable row level security;

create policy "admin read" on ratings for select using (is_admin());
create policy "public insert" on ratings for insert with check (true);

create policy "admin read" on rating_answers for select using (is_admin());
create policy "public insert" on rating_answers for insert with check (true);

-- ============================================================================
-- Storage
-- Single public bucket for every uploaded image/video (event covers,
-- gallery items, news covers/media) — see sanitizeFileName() call sites in
-- lib/supabase/*.ts for the `events/`, `gallery/`, `news/` path prefixes
-- used within it.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('media', 'media', true)
on conflict (id) do nothing;

create policy "public read media" on storage.objects for select using (bucket_id = 'media');
create policy "admin write media" on storage.objects for insert with check (bucket_id = 'media' and is_admin());
create policy "admin update media" on storage.objects for update using (bucket_id = 'media' and is_admin());
create policy "admin delete media" on storage.objects for delete using (bucket_id = 'media' and is_admin());
