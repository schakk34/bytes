create extension if not exists pgcrypto;
create extension if not exists postgis;

create type public.trust_level as enum ('verified', 'likely', 'unverified');
create type public.travel_mode as enum ('walking', 'driving');
create type public.event_style as enum ('seated', 'reception', 'either');

create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  address_line_1 text not null,
  city text not null,
  region text not null,
  postal_code text,
  country_code text not null default 'US',
  location geography(point, 4326),
  website_url text,
  events_url text,
  contact_email text,
  contact_phone text,
  description text,
  cuisine text[],
  dietary_accommodations text[],
  image_url text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.spaces (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  name text not null,
  privacy text check (privacy in ('private', 'semi_private', 'buyout')),
  seated_capacity integer check (seated_capacity > 0),
  reception_capacity integer check (reception_capacity > 0),
  notes text,
  unique (venue_id, name)
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  url text not null unique,
  title text not null,
  publisher text,
  source_kind text not null check (source_kind in ('venue', 'hotel', 'menu', 'event_kit', 'directory', 'manual_call')),
  published_at timestamptz,
  checked_at timestamptz not null default now(),
  excerpt text
);

create table public.facts (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  space_id uuid references public.spaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  field_name text not null,
  value jsonb not null,
  trust public.trust_level not null,
  verified_at timestamptz,
  expires_at timestamptz,
  notes text,
  created_at timestamptz not null default now()
);

create table public.price_signals (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  space_id uuid references public.spaces(id) on delete cascade,
  source_id uuid not null references public.sources(id) on delete restrict,
  minimum_spend_cents integer,
  per_person_cents integer,
  currency char(3) not null default 'USD',
  price_tier smallint check (price_tier between 1 and 4),
  conditions text,
  trust public.trust_level not null,
  checked_at timestamptz not null default now()
);

create table public.travel_times (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete cascade,
  origin_normalized text not null,
  origin_location geography(point, 4326),
  mode public.travel_mode not null,
  duration_seconds integer not null,
  distance_meters integer not null,
  provider text not null,
  calculated_at timestamptz not null default now(),
  unique (venue_id, origin_normalized, mode)
);

create table public.searches (
  id uuid primary key default gen_random_uuid(),
  address text not null,
  headcount integer not null check (headcount > 0),
  max_commute_minutes integer not null check (max_commute_minutes > 0),
  mode public.travel_mode not null,
  event_style public.event_style not null default 'either',
  brief text,
  created_at timestamptz not null default now()
);

create index venues_location_idx on public.venues using gist(location);
create index spaces_venue_capacity_idx on public.spaces(venue_id, seated_capacity, reception_capacity);
create index facts_venue_field_idx on public.facts(venue_id, field_name, trust);
create index travel_lookup_idx on public.travel_times(origin_normalized, mode, duration_seconds);

alter table public.venues enable row level security;
alter table public.spaces enable row level security;
alter table public.sources enable row level security;
alter table public.facts enable row level security;
alter table public.price_signals enable row level security;
alter table public.travel_times enable row level security;

create policy "public venue research is readable" on public.venues for select using (active);
create policy "public spaces are readable" on public.spaces for select using (true);
create policy "public sources are readable" on public.sources for select using (true);
create policy "public facts are readable" on public.facts for select using (true);
create policy "public price signals are readable" on public.price_signals for select using (true);
create policy "public travel times are readable" on public.travel_times for select using (true);

comment on table public.facts is 'Field-level evidence. Trust belongs to each claim, not the venue as a whole.';
comment on table public.travel_times is 'Cached route results; never infer commute from straight-line distance.';
