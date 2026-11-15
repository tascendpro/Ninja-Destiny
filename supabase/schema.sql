-- Ninja Destiny : la campagne à deux sur deux téléphones.
-- À exécuter une fois dans l'éditeur SQL du projet Supabase. Activer aussi : Authentication › Sign In / Providers ›
-- « Allow anonymous sign-ins », et Database › Replication : la table public.actions_campagne et public.parties en temps réel.
--
-- Principe : la campagne se rejoue entièrement depuis les deux fiches, le lien, la graine et le journal des actions.
-- Les deux téléphones partagent ce journal. Chacun ajoute ses actions à la suite (numéro suivant) ; si l'autre est passé
-- avant, l'insertion échoue (clé primaire), le téléphone relit le journal, revalide son action, et réessaie.

create table if not exists public.parties (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  graine bigint not null,
  hote uuid not null default auth.uid(),
  invite uuid,
  creation_hote jsonb not null,
  creation_invite jsonb,
  lien jsonb,
  -- 'attente' (l'invité n'est pas là), 'lien' (les deux fiches sont là, l'hôte choisit le lien), 'en_cours'
  etat text not null default 'attente' check (etat in ('attente', 'lien', 'en_cours')),
  cree_le timestamptz not null default now()
);

create table if not exists public.actions_campagne (
  partie_id uuid not null references public.parties on delete cascade,
  seq int not null check (seq > 0),
  joueur smallint not null check (joueur in (0, 1)),
  action jsonb not null,
  le timestamptz not null default now(),
  primary key (partie_id, seq)
);

alter table public.parties enable row level security;
alter table public.actions_campagne enable row level security;

-- Le siège d'un joueur dans une partie : 0 pour l'hôte, 1 pour l'invité, null s'il n'en fait pas partie.
create or replace function public.siege(p uuid) returns smallint
language sql stable security definer set search_path = public as $$
  select case when auth.uid() = hote then 0 when auth.uid() = invite then 1 end::smallint from parties where id = p
$$;

drop policy if exists parties_lire on public.parties;
create policy parties_lire on public.parties for select using (auth.uid() in (hote, invite));
drop policy if exists parties_creer on public.parties;
create policy parties_creer on public.parties for insert with check (hote = auth.uid() and invite is null and etat = 'attente');
-- Seul l'hôte fixe le lien et lance la partie, une fois l'invité arrivé.
drop policy if exists parties_lancer on public.parties;
create policy parties_lancer on public.parties for update using (hote = auth.uid()) with check (hote = auth.uid());

drop policy if exists actions_lire on public.actions_campagne;
create policy actions_lire on public.actions_campagne for select using (public.siege(partie_id) is not null);
-- On n'écrit que pour son propre siège, dans une partie lancée. Personne ne modifie ni ne supprime le journal.
drop policy if exists actions_ecrire on public.actions_campagne;
create policy actions_ecrire on public.actions_campagne for insert with check (
  joueur = public.siege(partie_id) and exists (select 1 from parties where id = partie_id and etat = 'en_cours')
);

-- Rejoindre par code : l'invité ne voit pas la partie avant d'en faire partie, d'où cette fonction.
create or replace function public.rejoindre(p_code text, p_creation jsonb) returns uuid
language plpgsql security definer set search_path = public as $$
declare p parties;
begin
  select * into p from parties where code = upper(p_code) for update;
  if p.id is null then raise exception 'code_inconnu'; end if;
  if p.hote = auth.uid() then raise exception 'deja_hote'; end if;
  if p.invite is not null and p.invite <> auth.uid() then raise exception 'partie_complete'; end if;
  update parties set invite = auth.uid(), creation_invite = p_creation, etat = case when etat = 'attente' then 'lien' else etat end where id = p.id;
  return p.id;
end $$;

grant execute on function public.rejoindre(text, jsonb) to authenticated;
grant execute on function public.siege(uuid) to authenticated;
