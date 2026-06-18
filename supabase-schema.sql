-- ============================================================================
-- FORMULARIUM — schema Supabase
-- ----------------------------------------------------------------------------
-- Copia tutto questo file e incollalo nel SQL Editor di Supabase
-- (Dashboard del progetto → "SQL Editor" → "New query" → incolla → "Run").
-- Crea la tabella dei codici e le due funzioni usate dal sito.
--
-- SICUREZZA: la tabella "access_codes" ha RLS attivo SENZA policy, quindi NON è
-- leggibile né scrivibile direttamente con la chiave pubblica (anon). Si accede
-- solo tramite le due funzioni qui sotto (SECURITY DEFINER), così le email degli
-- iscritti NON sono mai esposte al pubblico.
-- ============================================================================

create table if not exists public.access_codes (
  code        text primary key,
  nome        text not null,
  cognome     text not null,
  ruolo       text not null,
  email       text not null,
  created_at  timestamptz not null default now()
);

alter table public.access_codes enable row level security;
-- (nessuna policy = nessun accesso diretto con la chiave anon)

-- Una sola registrazione per email: elimina eventuali duplicati già presenti
-- (tiene il più vecchio) e impedisce duplicati futuri.
delete from public.access_codes a
  using public.access_codes b
  where a.email = b.email and a.created_at > b.created_at;
create unique index if not exists access_codes_email_key on public.access_codes (email);

-- ---------------------------------------------------------------------------
-- fh_register: valida i dati; se l'email è GIÀ registrata restituisce il suo
-- codice esistente (così vale anche da "recupero codice"), altrimenti genera
-- un codice univoco di 6 caratteri (senza lettere/numeri ambigui), lo salva
-- e lo restituisce.
-- ---------------------------------------------------------------------------
create or replace function public.fh_register(
  p_nome text, p_cognome text, p_ruolo text, p_email text
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  v_code   text;
  v_email  text;
  i        int;
begin
  if coalesce(trim(p_nome), '') = '' or coalesce(trim(p_cognome), '') = ''
     or coalesce(trim(p_ruolo), '') = ''
     or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' then
    raise exception 'dati non validi';
  end if;

  v_email := lower(trim(p_email));

  -- email già registrata? restituisci il codice esistente
  select code into v_code from public.access_codes where email = v_email limit 1;
  if v_code is not null then
    return v_code;
  end if;

  loop
    v_code := '';
    for i in 1..6 loop
      v_code := v_code || substr(alphabet, 1 + floor(random() * length(alphabet))::int, 1);
    end loop;
    exit when not exists (select 1 from public.access_codes where code = v_code);
  end loop;

  insert into public.access_codes (code, nome, cognome, ruolo, email)
  values (v_code, trim(p_nome), trim(p_cognome), trim(p_ruolo), v_email);

  return v_code;
end;
$$;

-- ---------------------------------------------------------------------------
-- fh_check_code: restituisce true se il codice esiste (login).
-- ---------------------------------------------------------------------------
create or replace function public.fh_check_code(p_code text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (select 1 from public.access_codes where code = upper(trim(p_code)));
$$;

-- ---------------------------------------------------------------------------
-- Permessi: la chiave pubblica può eseguire SOLO queste due funzioni.
-- ---------------------------------------------------------------------------
revoke all on function public.fh_register(text, text, text, text) from public;
revoke all on function public.fh_check_code(text) from public;
grant execute on function public.fh_register(text, text, text, text) to anon, authenticated;
grant execute on function public.fh_check_code(text) to anon, authenticated;

-- Fatto. Per vedere gli iscritti: Dashboard → "Table Editor" → access_codes
-- (visibile solo a te, loggato nella dashboard).
