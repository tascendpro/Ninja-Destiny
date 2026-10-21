import { afterEach, describe, expect, it } from 'vitest';
import { creation, simuler } from './aide';
import { nouvellePartie, validerCreation, choisir, continuer, rejouer } from '../src/engine/moteur';
import { defPnj, nouveauCtx } from '../src/engine/etat';
import { appliquerEffet, appliquerEffets } from '../src/engine/effets';
import { applyTraining, applyCombatExperience, copierTechnique, maxTierForAge, resolveAwakening, porteurPnj } from '../src/engine/maitrise';
import { estUtilisable, getWeaponModifiers, instanceArme, lierArme, obtenirArme } from '../src/engine/armes';
import { checkCareerEligibility } from '../src/engine/metiers';
import { evenementDisponible, entrerEvenement } from '../src/engine/selection';
import { verifierFin } from '../src/engine/fins';
import { avancerTemps } from '../src/engine/temps';
import { verifierInvariants } from '../src/engine/invariants';
import { charger, enregistrer, restaurer, stockageMemoire, stockageSession } from '../src/engine/sauvegarde';
import { R } from '../src/engine/registre';
import type { GameState, Tirages } from '../src/engine/types';
import { age } from '../src/engine/calendrier';

const partie = (p = {}, graine = 42, imposes?: Partial<Tirages>): GameState => nouvellePartie(creation(p), graine, imposes);
const vieillir = (s: GameState, ans: number) => {
  s.jour += ans * 360;
};

describe('Création et clans', () => {
  it('refuse un clan hors de son village', () => {
    expect(validerCreation(creation({ village: 'kiri', clan: 'uchiha' }))).not.toEqual([]);
  });
  it('refuse une affinité incompatible avec la lignée', () => {
    expect(validerCreation(creation({ village: 'kiri', clan: 'yuki', element: 'katon', nom: 'Yuki' }))).not.toEqual([]);
    expect(validerCreation(creation({ village: 'kiri', clan: 'yuki', element: 'suiton', nom: 'Yuki' }))).toEqual([]);
  });
  it('n’accorde pas automatiquement les capacités du clan : le Sharingan est latent à 6 ans', () => {
    const s = partie();
    expect(s.maitrises['sharingan'].awakened).toBe(false);
    expect(s.maitrises['sharingan'].tier).toBe(0);
  });
  it('le Byakugan s’éveille par l’éducation du clan, et seulement au palier 1', () => {
    const s = partie({ clan: 'hyuga', nom: 'Hyūga' });
    expect(s.maitrises['byakugan'].awakened).toBe(true);
    expect(s.maitrises['byakugan'].tier).toBe(1);
  });
});

describe('Événements', () => {
  it('les événements exclusifs respectent leurs conditions', () => {
    const konoha = partie();
    const kiri = partie({ village: 'kiri', clan: 'hozuki', nom: 'Hōzuki', element: 'suiton' });
    expect(evenementDisponible(konoha, R.evenements['o_village_kiri'])).toBe(false);
    expect(evenementDisponible(kiri, R.evenements['o_village_konoha'])).toBe(false);
    expect(evenementDisponible(konoha, R.evenements['o_clan_hyuga'])).toBe(false);
  });
  it('un événement unique ne se répète pas', () => {
    const s = partie();
    expect(s.scene).toEqual({ type: 'evenement', id: 'o_village_konoha' });
    expect(evenementDisponible(s, R.evenements['o_village_konoha'])).toBe(false);
  });
  it('une décision majeure modifie les variables attendues (refus à l’examen de Kiri)', () => {
    let s = partie({ village: 'kiri', clan: 'hozuki', nom: 'Hōzuki', element: 'suiton' });
    vieillir(s, 6);
    entrerEvenement(s, 'a_examen_kiri');
    const suspicionAvant = s.social.suspicion;
    const loyauteAvant = s.social.loyaute;
    s = choisir(s, 'refuser');
    s = continuer(s);
    expect(s.scene).toEqual({ type: 'evenement', id: 'a_kiri_refus' });
    s = choisir(s, 'silence');
    expect(s.rang).toBe('genin');
    expect(s.social.suspicion).toBeGreaterThanOrEqual(suspicionAvant + 15);
    expect(s.social.loyaute).toBeLessThan(loyauteAvant);
    expect(s.drapeaux['refus_examen_sanglant']).toBe(true);
    expect(s.succes).toContain('kiri_refus');
  });
  it('les événements aléatoires restent compatibles avec l’état (blessure grave)', () => {
    const s = partie();
    vieillir(s, 6);
    s.jauges.fatigue = 90;
    appliquerEffet(s, { blessure: { id: 'grave', nom: 'Grave', gravite: 3, jours: 90 } }, nouveauCtx());
    for (const id of ['r_surmenage', 'r_orage', 'r_entrainement_pouvoir']) {
      expect(evenementDisponible(s, R.evenements[id])).toBe(false);
    }
  });
});

describe('Personnages, relations, missions', () => {
  it('un personnage mort ne revient pas sans explication', () => {
    const s = partie();
    const ctx = nouveauCtx();
    appliquerEffet(s, { pnjEtat: '@coequipierA', etat: 'mort' }, ctx);
    appliquerEffet(s, { pnjEtat: '@coequipierA', etat: 'vivant' }, ctx);
    expect(s.pnj['konoha_ami'].etat).toBe('mort');
    appliquerEffet(s, { pnjEtat: '@coequipierA', etat: 'vivant', explication: true }, ctx);
    expect(s.pnj['konoha_ami'].etat).toBe('vivant');
  });
  it('un personnage mort n’apparaît plus dans les scènes', () => {
    const s = partie();
    appliquerEffet(s, { pnjEtat: '@aine', etat: 'mort' }, nouveauCtx());
    vieillir(s, 4);
    expect(evenementDisponible(s, R.evenements['a_aine_mission'])).toBe(false);
  });
  it('une mission échouée ne peut pas être validée ensuite', () => {
    const s = partie();
    const ctx = nouveauCtx();
    appliquerEffets(s, [{ mission: 'd_jardin', statut: 'en_cours' }, { mission: 'd_jardin', statut: 'echouee' }, { mission: 'd_jardin', statut: 'reussie' }], ctx);
    expect(s.missions['d_jardin']).toBe('echouee');
  });
  it('une relation rompue reste rompue jusqu’à une vraie réconciliation', () => {
    const s = partie();
    const ctx = nouveauCtx();
    appliquerEffet(s, { relation: '@coequipierA', delta: { amitie: 60 } }, ctx);
    appliquerEffet(s, { rompre: '@coequipierA' }, ctx);
    appliquerEffet(s, { relation: '@coequipierA', delta: { amitie: 30, confiance: 30 } }, ctx);
    expect(s.relations['konoha_ami'].amitie).toBeLessThanOrEqual(10);
    expect(s.relations['konoha_ami'].rompue).toBe(true);
    appliquerEffet(s, { reconcilier: '@coequipierA' }, ctx);
    appliquerEffet(s, { relation: '@coequipierA', delta: { amitie: 30 } }, ctx);
    expect(s.relations['konoha_ami'].amitie).toBeGreaterThan(30);
  });
  it('les PNJ progressent selon le même modèle, plafonnés par leur âge', () => {
    const s = partie();
    for (let i = 0; i < 40; i++) avancerTemps(s, 90, nouveauCtx());
    const p = porteurPnj(s, 'konoha_rival')!;
    for (const ms of Object.values(p.maitrises)) expect(ms.tier).toBeLessThanOrEqual(maxTierForAge(p.age, true));
    expect(verifierInvariants(s)).toEqual([]);
  });
});

describe('Éveil et maîtrise', () => {
  it('aucun palier ne dépasse le plafond lié à l’âge', () => {
    const s = partie({ ageDepart: 10 });
    const ctx = nouveauCtx();
    s.maitrises['sharingan'].potential = 100;
    s.drapeaux['x'] = 1;
    resolveAwakening(s, 'sharingan', 100, ctx);
    expect(s.maitrises['sharingan'].tier).toBe(1);
    for (let i = 0; i < 20; i++) applyCombatExperience(s, ['sharingan', 'ninjutsu'], ctx);
    applyTraining(s, 'ninjutsu', 5000, true, ctx);
    applyTraining(s, 'sharingan', 5000, true, ctx);
    expect(s.maitrises['ninjutsu'].tier).toBeLessThanOrEqual(maxTierForAge(age(s)));
    expect(s.maitrises['sharingan'].tier).toBeLessThanOrEqual(maxTierForAge(age(s)));
  });
  it('armes et taijutsu n’ont pas de plafond d’âge, mais exigent toujours l’expérience réelle', () => {
    const s = partie({ ageDepart: 10 });
    const ctx = nouveauCtx();
    applyTraining(s, 'taijutsu', 5000, true, ctx);
    applyTraining(s, 'famille_kunai', 5000, true, ctx);
    expect(s.maitrises['taijutsu'].tier).toBe(2);
    expect(s.maitrises['famille_kunai'].tier).toBe(2);
    for (let i = 0; i < 30; i++) applyCombatExperience(s, ['taijutsu', 'famille_kunai'], ctx);
    expect(s.maitrises['taijutsu'].tier).toBeGreaterThan(maxTierForAge(age(s)));
    expect(s.maitrises['famille_kunai'].tier).toBeGreaterThan(maxTierForAge(age(s)));
  });
  it('le trait Prodige ajoute un palier, jamais plus', () => {
    expect(maxTierForAge(10, false)).toBe(2);
    expect(maxTierForAge(10, true)).toBe(3);
    expect(maxTierForAge(30, true)).toBe(5);
  });
  it('un éveil donne toujours le palier 1', () => {
    const s = partie({ ageDepart: 10 });
    s.maitrises['sharingan'].potential = 100;
    s.maitrises['sharingan'].trainingDays = 99999;
    s.maitrises['sharingan'].combatUses = 999;
    const r = resolveAwakening(s, 'sharingan', 100, nouveauCtx());
    expect(r.reussi).toBe(true);
    expect(s.maitrises['sharingan'].tier).toBe(1);
  });
  it('le palier 3 est inaccessible sans expérience réelle', () => {
    const s = partie({ ageDepart: 10 });
    vieillir(s, 6);
    const ctx = nouveauCtx();
    applyTraining(s, 'taijutsu', 5000, true, ctx);
    expect(s.maitrises['taijutsu'].tier).toBe(2);
    for (let i = 0; i < 3; i++) applyCombatExperience(s, ['taijutsu'], ctx);
    expect(s.maitrises['taijutsu'].tier).toBe(3);
  });
  it('le Sharingan de 10 ans ne se maîtrise vraiment que vers 18–20 ans', () => {
    const s = partie({ ageDepart: 10 });
    const ctx = nouveauCtx();
    s.maitrises['sharingan'].potential = 100;
    resolveAwakening(s, 'sharingan', 100, ctx);
    for (let annee = 10; annee <= 21; annee++) {
      avancerTemps(s, 360, ctx);
      applyTraining(s, 'sharingan', 200, true, ctx);
      for (let i = 0; i < 4; i++) applyCombatExperience(s, ['sharingan'], ctx);
      const t = s.maitrises['sharingan'].tier;
      if (age(s) < 14) expect(t).toBeLessThanOrEqual(2);
      if (age(s) < 18) expect(t).toBeLessThanOrEqual(3);
    }
    expect(s.maitrises['sharingan'].tier).toBe(4);
  });
  it('copier n’est pas maîtriser : palier 1, et aucun kekkei genkai copiable', () => {
    const s = partie({ ageDepart: 10 });
    vieillir(s, 3);
    const ms = s.maitrises['sharingan'];
    ms.awakened = true;
    ms.tier = 2;
    const ctx = nouveauCtx();
    expect(copierTechnique(s, 'raiton_decharge', ctx)).toBe(true);
    expect(s.maitrises['raiton_decharge'].tier).toBe(1);
    // Le Sharingan d'un Uchiha copie jusqu'à la nature : Raiton s'éveille, la technique est exécutable.
    expect(s.maitrises['nature_raiton']?.tier).toBe(1);
    expect(s.maitrises['raiton_decharge'].bloquee).toBe(false);
    expect(copierTechnique(s, 'hyoton_miroirs', ctx)).toBe(false);
    expect(copierTechnique(s, 'raiton_lance', ctx)).toBe(false); // rang B, Sharingan palier 2
  });
  it('le Mangekyō ne s’éveille que par une perte tragique ; une nouvelle perte peut retenter l’éveil', () => {
    const s = partie({ ageDepart: 10 });
    vieillir(s, 3);
    const ctx = nouveauCtx();
    s.maitrises['mangekyo'].potential = 100;
    expect(resolveAwakening(s, 'mangekyo', 100, ctx).tente).toBe(false); // pas de déclencheur
    s.drapeaux['perte_tragique'] = true;
    expect(resolveAwakening(s, 'mangekyo', 100, ctx).tente).toBe(false); // Sharingan insuffisant
    expect(s.drapeaux['eveil_tente:mangekyo']).toBeUndefined();
    s.maitrises['sharingan'].awakened = true;
    s.maitrises['sharingan'].tier = 2;
    s.maitrises['mangekyo'].potential = 0;
    expect(resolveAwakening(s, 'mangekyo', 100, ctx)).toEqual({ tente: true, reussi: false });
    s.maitrises['mangekyo'].potential = 100;
    expect(resolveAwakening(s, 'mangekyo', 100, ctx).reussi).toBe(true); // une autre perte, une autre chance
  });
});

describe('Armes et registre', () => {
  it('une arme unique n’a jamais deux détenteurs', () => {
    const s = partie({ village: 'suna', clan: 'sans_clan', nom: 'Sora', element: 'fuuton' });
    const ctx = nouveauCtx();
    expect(s.registre['yunagi'].detenteur).toBe('npc:sabure');
    obtenirArme(s, 'yunagi', 'possedee', ctx);
    expect(s.registre['yunagi'].detenteur).toBe('joueur');
    expect(obtenirArme(s, 'yunagi', 'possedee', ctx)).toBe(false);
    expect(s.arsenal.filter((a) => a.defId === 'yunagi').length).toBe(1);
    appliquerEffet(s, { perdreArme: 'yunagi', statut: 'vendue', vers: 'npc:fukaji' }, ctx);
    expect(s.registre['yunagi'].detenteur).toBe('npc:fukaji');
    expect(estUtilisable(instanceArme(s, 'yunagi'))).toBe(false);
    expect(verifierInvariants(s)).toEqual([]);
  });
  it('une arme confisquée est inutilisable jusqu’à sa récupération', () => {
    const s = partie({ village: 'suna', clan: 'sans_clan', nom: 'Sora', element: 'fuuton' });
    const ctx = nouveauCtx();
    obtenirArme(s, 'yunagi', 'possedee', ctx);
    appliquerEffet(s, { equiper: 'yunagi' }, ctx);
    appliquerEffet(s, { perdreArme: 'yunagi', statut: 'confisquee' }, ctx);
    expect(estUtilisable(instanceArme(s, 'yunagi'))).toBe(false);
    expect(s.armeEquipee).not.toBe('yunagi');
    expect(getWeaponModifiers(s, 'yunagi').notes).toContain('Arme indisponible');
    appliquerEffet(s, { recupererArme: 'yunagi' }, ctx);
    expect(estUtilisable(instanceArme(s, 'yunagi'))).toBe(true);
    expect(verifierInvariants(s)).toEqual([]);
  });
  it('une arme maniée sans ses prérequis impose des malus', () => {
    const s = partie({ village: 'kumo', clan: 'sans_clan', nom: 'Dan', element: 'raiton' });
    obtenirArme(s, 'nodachi_kumo', 'possedee', nouveauCtx());
    const m = getWeaponModifiers(s, 'nodachi_kumo');
    expect(m.malus).toBeGreaterThan(0);
    expect(m.notes).toContain('Trop lourde pour toi');
  });
  it('les capacités de Yūnagi restent scellées sans Fūton', () => {
    const s = partie({ village: 'suna', clan: 'sans_clan', nom: 'Sora', element: 'doton' });
    obtenirArme(s, 'yunagi', 'possedee', nouveauCtx());
    const inst = instanceArme(s, 'yunagi')!;
    inst.lien = 100;
    s.maitrises['famille_kenjutsu'].tier = 3;
    expect(getWeaponModifiers(s, 'yunagi').capacites).toEqual([]);
  });
  it('une seule arme légendaire liée à la fois', () => {
    const s = partie({ village: 'suna', clan: 'sans_clan', nom: 'Sora', element: 'fuuton' });
    const ctx = nouveauCtx();
    obtenirArme(s, 'yunagi', 'possedee', ctx);
    lierArme(s, 'yunagi', 60, ctx);
    s.attributs.force = 90;
    s.jauges.chakraMax = 200;
    obtenirArme(s, 'kagero', 'possedee', ctx);
    lierArme(s, 'kagero', 80, ctx);
    expect(instanceArme(s, 'yunagi')!.lie).toBe(true);
    expect(instanceArme(s, 'kagero')!.lie).toBe(false);
    expect(instanceArme(s, 'kagero')!.lien).toBeLessThan(50);
  });
});

describe('Métiers', () => {
  it('un métier incompatible ou inaccessible ne peut pas être attribué', () => {
    const s = partie({}, 42, { prodige: true });
    vieillir(s, 8);
    s.rang = 'chunin';
    s.attributs.agilite = 60;
    s.attributs.discretion = 60;
    s.attributs.charisme = 70;
    const ctx = nouveauCtx();
    appliquerEffet(s, { metier: 'assassin' }, ctx);
    expect(s.metier.principal).toBe('assassin');
    expect(checkCareerEligibility(s, 'diplomate').ok).toBe(false);
    appliquerEffet(s, { metier: 'diplomate', secondaire: true }, ctx);
    expect(s.metier.secondaire).toBeUndefined();
  });
  it('l’âge minimal d’un métier est respecté (assassin : 15 ans, 13 pour un prodige)', () => {
    const s = partie();
    vieillir(s, 7);
    s.rang = 'genin';
    s.attributs.agilite = 60;
    s.attributs.discretion = 60;
    expect(checkCareerEligibility(s, 'assassin').ok).toBe(false);
    s.tirages.prodige = true;
    expect(checkCareerEligibility(s, 'assassin').ok).toBe(true);
  });
  it('un métier de l’ombre n’augmente pas la réputation publique', () => {
    const s = partie({}, 42, { prodige: true });
    vieillir(s, 8);
    s.rang = 'genin';
    s.attributs.agilite = 60;
    s.attributs.discretion = 60;
    const ctx = nouveauCtx();
    appliquerEffet(s, { metier: 'assassin' }, ctx);
    const pub = s.social.reputation;
    const ombre = s.social.reputationOmbre;
    appliquerEffet(s, { reputationMetier: 10 }, ctx);
    expect(s.social.reputation).toBe(pub);
    expect(s.social.reputationOmbre).toBe(ombre + 10);
  });
});

describe('Fins et sauvegardes', () => {
  it('la mort découle de l’état du personnage', () => {
    const s = partie();
    appliquerEffet(s, { stat: 'jauges.sante', valeur: 0 }, nouveauCtx());
    verifierFin(s);
    expect(s.fin?.id).toBe('mort');
    expect(s.statut).toBe('mort');
  });
  it('une partie fin de chapitre ne propose plus d’événement', () => {
    const r = simuler(creation(), 7);
    expect(r.fin).toBeDefined();
    expect(r.etat.scene.type).toBe('fin');
  });
  it('les sauvegardes conservent toutes les variables et se rejouent à l’identique', () => {
    const r = simuler(creation({ village: 'suna', clan: 'shirakaze', nom: 'Shirakaze', element: 'fuuton' }), 11, 120);
    const st = stockageMemoire();
    enregistrer(st, 'manuel1', r.etat);
    const sv = charger(st, 'manuel1')!;
    const res = restaurer(sv);
    expect(res.verifiee).toBe(true);
    expect(res.etat).toEqual(r.etat);
  });
  it('une sauvegarde falsifiée est reconstruite à partir des décisions', () => {
    const r = simuler(creation(), 13, 80);
    const st = stockageMemoire();
    const sv = enregistrer(st, 'manuel2', r.etat);
    const falsifiee = { ...sv, etat: { ...sv.etat, jauges: { ...sv.etat.jauges, ryo: 999999 } } };
    falsifiee.empreinte = 'deadbeef';
    const res = restaurer(falsifiee);
    expect(res.verifiee).toBe(false);
    expect(res.etat.jauges.ryo).toBe(r.etat.jauges.ryo);
  });
  it('rejouer une partie donne exactement le même état', () => {
    const r = simuler(creation({ village: 'iwa', clan: 'ishikawa', nom: 'Ishikawa', element: 'doton' }), 99, 200);
    const rejoue = rejouer(r.etat.creation, r.etat.seed, r.etat.actions);
    expect(rejoue).toEqual(r.etat);
  });
});

describe('Stockage de session', () => {
  const faux = (casse = false) => {
    const m = new Map<string, string>();
    return {
      m,
      getItem: (k: string) => {
        if (casse) throw new Error('bloqué');
        return m.get(k) ?? null;
      },
      setItem: (k: string, v: string) => {
        if (casse) throw new Error('bloqué');
        m.set(k, v);
      },
      removeItem: (k: string) => void m.delete(k),
    };
  };
  const g = globalThis as unknown as { window?: unknown };
  const avant = g.window;
  afterEach(() => {
    g.window = avant;
  });

  it('la partie va dans sessionStorage et jamais dans localStorage', () => {
    const session = faux();
    const local = faux();
    g.window = { sessionStorage: session, localStorage: local };
    const st = stockageSession();
    const r = simuler(creation(), 5, 40);
    enregistrer(st, 'auto', r.etat);
    expect(session.m.has('ninja-destiny:auto')).toBe(true);
    expect(local.m.size).toBe(0);
    expect(restaurer(charger(st, 'auto')!).verifiee).toBe(true);
  });

  it('bascule en mémoire si sessionStorage est bloqué', () => {
    g.window = { sessionStorage: faux(true) };
    const st = stockageSession();
    const r = simuler(creation(), 6, 30);
    enregistrer(st, 'auto', r.etat);
    expect(charger(st, 'auto')?.empreinte).toBeDefined();
  });
});

describe('Accord du texte', () => {
  it('accorde les formes inclusives selon la présentation du joueur', async () => {
    const { accorder, interpoler } = await import('../src/engine/texte');
    expect(accorder('Tu es seul·e, fier·ère, un·e ninja fou·folle et malin·e.', 'masculin')).toBe('Tu es seul, fier, un ninja fou et malin.');
    expect(accorder('Tu es seul·e, fier·ère, un·e ninja fou·folle et malin·e.', 'feminin')).toBe('Tu es seule, fière, une ninja folle et maligne.');
    expect(accorder('Tu es seul·e.', 'neutre')).toBe('Tu es seul·e.');
    expect(accorder('Impulsif·ve, Discret·e, Rieur·se, Captif·ve, Éclaireur·se, Protecteur·rice, Compagnon·ne', 'feminin')).toBe(
      'Impulsive, Discrète, Rieuse, Captive, Éclaireuse, Protectrice, Compagne',
    );
    const s = partie({ presentation: 'masculin' });
    const ami = defPnj(s, s.roles['coequipierA'])!;
    expect(interpoler('{@coequipierA} est seul{e:@coequipierA} et toi seul·e.', s)).toBe(`${ami.nom} est seul${ami.genre === 'f' ? 'e' : ''} et toi seul.`);
  });
});
