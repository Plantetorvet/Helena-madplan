# Helenas Glutenfri Koekken

Madplan + ingrediens-scanner til familier med glutenallergi.

## Filer
```
index.html              Madplan-siden
scanner.html            Scanner + produktliste
api/
  generate-plan.js      Genererer madplan (Anthropic)
  scan.js               Scanner stregkode/ingredienser
  scan-billede.js       Foto-scanning via Claude Vision
  produkter.js          Gem produkter + reaktioner (Supabase)
```

## Deploy på Vercel (allerede opsat)
Vercel gendeploy automatisk når du pusher til GitHub.

## Miljøvariabler — tilføj i Vercel Dashboard
Gaa til: vercel.com → dit projekt → Settings → Environment Variables

### ANTHROPIC_API_KEY
Din Anthropic-noegle fra console.anthropic.com

### SUPABASE_URL og SUPABASE_ANON_KEY
Fra Supabase-projektet (se nedenfor)

---

## Supabase opsaetning (gratis, 5 min)

### 1. Opret konto
Gaa til supabase.com og opret gratis konto

### 2. Opret nyt projekt
Klik "New project" — vaelg et navn og en adgangskode

### 3. Opret tabeller
Gaa til "SQL Editor" og koer denne SQL:

```sql
create table produkter (
  id uuid default gen_random_uuid() primary key,
  familie_id text not null,
  barcode text,
  navn text,
  ingredienser text,
  analyse jsonb,
  har_reaktion boolean default false,
  sidst_scannet timestamptz default now(),
  created_at timestamptz default now(),
  unique(familie_id, barcode)
);

create table reaktioner (
  id uuid default gen_random_uuid() primary key,
  familie_id text not null,
  produkt_id uuid references produkter(id),
  dato timestamptz default now(),
  symptomer text,
  alvorlighed text,
  noter text
);

-- Aaben adgang (familiedeling uden login)
alter table produkter enable row level security;
alter table reaktioner enable row level security;
create policy "Familie adgang produkter" on produkter for all using (true);
create policy "Familie adgang reaktioner" on reaktioner for all using (true);
```

### 4. Hent dine nogler
Gaa til Settings → API og kopieer:
- Project URL → SUPABASE_URL
- anon public key → SUPABASE_ANON_KEY

### 5. Tilfoej i Vercel
Gaa til vercel.com → dit projekt → Settings → Environment Variables
Tilfoej SUPABASE_URL og SUPABASE_ANON_KEY

---

## Familiedeling
Siden genererer automatisk et familie-ID.
Kopieer linket fra "Mine produkter" og del med familien.
Alle med linket ser de samme produkter og reaktioner.
