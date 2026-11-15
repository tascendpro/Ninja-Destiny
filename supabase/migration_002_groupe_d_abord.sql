-- Migration 2 : le groupe d'abord, puis le lien, puis chacun son ninja, en même temps.
--   1. L'hôte crée le groupe et reçoit un code.      (etat 'attente')
--   2. L'autre rejoint avec le code.                 (etat 'lien')     l'hôte choisit ce qui vous lie
--   3. Chacun crée son ninja sur son téléphone.      (etat 'creation') le lien et les choix de l'autre s'imposent en direct
--   4. Les deux sont prêts : l'hôte lance.           (etat 'en_cours')
-- À exécuter une fois dans l'éditeur SQL de Supabase, après schema.sql. Peut être relancée sans risque.

alter table public.parties alter column creation_hote drop not null;
alter table public.parties add column if not exists pret_hote boolean not null default false;
alter table public.parties add column if not exists pret_invite boolean not null default false;
alter table public.parties drop constraint if exists parties_etat_check;
alter table public.parties add constraint parties_etat_check check (etat in ('attente', 'lien', 'creation', 'en_cours'));

-- Rejoindre par code, sans personnage : le lien d'abord, le ninja ensuite.
drop function if exists public.rejoindre(text, jsonb);
create or replace function public.rejoindre(p_code text) returns uuid
language plpgsql security definer set search_path = public as $$
declare p parties;
begin
  select * into p from parties where code = upper(p_code) for update;
  if p.id is null then raise exception 'code_inconnu'; end if;
  if p.hote = auth.uid() then raise exception 'deja_hote'; end if;
  if p.invite is not null and p.invite <> auth.uid() then raise exception 'partie_complete'; end if;
  update parties set invite = auth.uid(), etat = case when etat = 'attente' then 'lien' else etat end where id = p.id;
  return p.id;
end $$;

-- Déposer son ninja (brouillon pendant qu'on le crée, puis « prêt »). Chacun ne touche que le sien.
drop function if exists public.deposer(uuid, jsonb);
create or replace function public.deposer(p_partie uuid, p_creation jsonb, p_pret boolean) returns void
language plpgsql security definer set search_path = public as $$
declare p parties;
begin
  select * into p from parties where id = p_partie for update;
  if p.id is null then raise exception 'code_inconnu'; end if;
  if p.etat <> 'creation' then raise exception 'pas_le_moment'; end if;
  if auth.uid() = p.hote then
    update parties set creation_hote = p_creation, pret_hote = p_pret where id = p.id;
  elsif auth.uid() = p.invite then
    update parties set creation_invite = p_creation, pret_invite = p_pret where id = p.id;
  else
    raise exception 'pas_dans_la_partie';
  end if;
end $$;

grant execute on function public.rejoindre(text) to authenticated;
grant execute on function public.deposer(uuid, jsonb, boolean) to authenticated;
