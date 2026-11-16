// La cohérence du récit : la famille qu'on a vraiment, le genre de ceux qui nous entourent, ce qui s'est déjà passé.
import { describe, expect, it } from 'vitest';
import type { ChoiceDef, GameState, Outcome, Texte } from '../src/engine/types';
import { nouvellePartie } from '../src/engine/moteur';
import { R } from '../src/engine/registre';
import { resoudreTexte } from '../src/engine/texte';
import { SCENES } from '../src/engine/campagne/moteur';
import { creation } from './aide';

const partie = (village: GameState['creation']['village'], clan: string, element: GameState['creation']['element'] = 'katon') => nouvellePartie(creation({ village, clan, element }), 5);
const texte = (t: Texte | undefined, s: GameState) => resoudreTexte(t, s);
const choix = (ev: string, id: string): ChoiceDef => R.evenements[ev].choix.find((c) => c.id === id)!;
const issue = (ev: string, id: string, cle: 'succes' | 'echec' | 'direct' = 'direct'): Texte | undefined => {
  const c = choix(ev, id);
  return cle === 'direct' ? c.resultat : (c.test?.[cle] as Outcome | undefined)?.texte;
};

describe('La famille qu’on a vraiment', () => {
  it('la leçon du clan est donnée par le parent tiré, avec son genre', () => {
    const s = partie('konoha', 'uchiha');
    s.pnjGeneres['famille_parent'].genre = 'f';
    expect(texte(R.evenements['ap_lecon_clan'].texte, s)).toMatch(/^Ta mère t’emmène sur le ponton/);
    s.pnjGeneres['famille_parent'].genre = 'm';
    expect(texte(R.evenements['ap_lecon_clan'].texte, s)).toMatch(/^Ton père t’emmène sur le ponton/);
    expect(texte(R.evenements['ap_lecon_clan'].texte, s)).toMatch(/Il compose les signes/);
  });

  it('si le parent n’est plus là, c’est un ancien du clan qui enseigne : personne n’enseigne d’outre-tombe', () => {
    const s = partie('konoha', 'yamanaka');
    s.pnj['famille_parent'].etat = 'mort';
    const t = texte(R.evenements['ap_lecon_clan'].texte, s);
    expect(t).toMatch(/^L’ancien du clan ferme la boutique/);
    expect(t).not.toMatch(/Ta mère|Ton père/);
  });

  it('chez les Hōzuki, c’est l’aîné·e qui enseigne, avec son genre et son nom', () => {
    const s = partie('kiri', 'hozuki', 'suiton');
    s.pnjGeneres['famille_aine'].genre = 'f';
    expect(texte(R.evenements['ap_lecon_clan'].texte, s)).toMatch(/^Ta grande sœur te pousse dans la baie/);
  });

  it('au tournoi des chūnin, la place d’un parent mort reste vide, au lieu de l’y faire crier', () => {
    const s = partie('konoha', 'inuzuka');
    expect(texte(R.evenements['c2_tournoi'].texte, s)).toMatch(/(ta mère|ton père) hurle/);
    s.pnj['famille_parent'].etat = 'mort';
    const t = texte(R.evenements['c2_tournoi'].texte, s);
    expect(t).not.toMatch(/hurle plus fort que tous les chiens/);
    expect(t).toMatch(/une voix qui manque/);
  });
});

describe('Le genre de ceux qui nous entourent', () => {
  it('à Kumo, la rivale est une fille : le texte le sait', () => {
    const s = partie('kumo', 'raiko', 'raiton');
    expect(R.pnj[s.roles['rival']].genre).toBe('f');
    const t = texte(R.evenements['g_rival_retour'].texte, s);
    expect(t).toMatch(/seule\. Elle a changé/);
    expect(t).not.toMatch(/\bIl a changé/);
    expect(texte(issue('a_rival_defi', 'accepter', 'echec'), s)).toMatch(/^Elle te met à terre/);
  });

  it('à Konoha, la sensei est une femme ; ailleurs, un homme : les mêmes phrases s’accordent', () => {
    const konoha = partie('konoha', 'uchiha');
    const suna = partie('suna', 'shirakaze', 'fuuton');
    const t = (s: GameState) => texte(issue('c2_elimine', 'travailler'), s);
    expect(t(konoha)).toMatch(/Elle ne dit rien, enlève sa veste/);
    expect(t(suna)).toMatch(/Il ne dit rien, enlève sa veste/);
  });

  it('le déserteur est la rivale à Kumo, un ancien camarade quand le rival est mort', () => {
    const s = partie('kumo', 'raiko', 'raiton');
    expect(texte(issue('m4_deserteur', 'combattre', 'echec'), s)).toMatch(/Elle emporte le rouleau/);
    s.pnj[s.roles['rival']] = { ...(s.pnj[s.roles['rival']] ?? {}), etat: 'mort' } as GameState['pnj'][string];
    expect(texte(issue('m4_deserteur', 'combattre', 'echec'), s)).toMatch(/^Il te laisse en vie/);
  });
});

describe('Ce qui s’est déjà passé', () => {
  it('trente ans d’amitié ne se racontent pas comme trente ans de rivalité', () => {
    const s = partie('konoha', 'uchiha');
    const r = s.roles['rival'];
    s.relations[r] = { ...s.relations[r], amitie: 10 };
    expect(texte(issue('c5_rival', 'paix'), s)).toMatch(/il y a trente ans/);
    s.relations[r] = { ...s.relations[r], amitie: 70 };
    expect(texte(issue('c5_rival', 'paix'), s)).not.toMatch(/il y a trente ans/);
  });

  it('le premier fou rire avec le rival n’a lieu qu’une fois', () => {
    const s = partie('konoha', 'uchiha');
    const r = s.roles['rival'];
    const t = () => texte((choix('ap_rival_defi', 'proposer').test!.succes as Outcome).texte, s);
    s.relations[r] = { ...s.relations[r], amitie: 0 };
    expect(t()).toMatch(/pour la première fois, vous riez ensemble/);
    s.relations[r] = { ...s.relations[r], amitie: 45 };
    expect(t()).not.toMatch(/pour la première fois/);
  });

  it('chaque rencontre de l’Akatsuki a sa propre retraite, et « repéré·e » se tire à chaque fois', () => {
    const fuites = ['akc_paille', 'akc_desert', 'akc_bureau', 'akc_pluie'].map((id) => choix(id, 'fuir'));
    const textes = fuites.map((c) => JSON.stringify(c.resultat));
    expect(new Set(textes).size).toBe(4);
    // Konan est seule sur son toit : pas de « deux taches », pas de « l'un d'eux ».
    expect(textes[3]).not.toMatch(/deux taches|l’un d’eux/);
    for (const c of fuites) expect(c.effets?.[0]).toEqual({ drapeau: 'akc_repere', retirer: true });
  });

  it('une lame légendaire du désert ne vous attend pas sur une grève', () => {
    const sc = SCENES['mc_lame_yunagi'];
    const t = sc.issues.map((i) => i.texte).join(' ');
    expect(t).toMatch(/Shōsa/);
    expect(t).not.toMatch(/grève|pêcheurs/);
  });
});
