// Ce qu'un joueur peut faire envers l'autre, hors des scènes : donner, prêter, enseigner, proposer un duel ou une technique
// de duo, et aussi dénoncer, répandre une rumeur, s'en prendre à ses proches, enquêter. Tout est permis ; tout a des suites.
// Celui qui subit ne voit que les effets, jamais la source, tant qu'il ne l'a pas découverte.

import type { GameState } from '../types';
import { R } from '../registre';
import { appliquerEffets } from '../effets';
import { ajouterJournal, defPnj, nouveauCtx } from '../etat';
import type { ActionLien, Campagne, IdJoueur } from './types';
import { ageA, autre, bouger, borne, fait, finie, hash01, jourMonde, noter, rompre, souvenir, texteCommun } from './outils';
import { ouvrirCombatDuo, naturesDuo } from './combat';

/** Les deux sont-ils assez proches dans le temps, et libres, pour faire quelque chose ensemble ? */
export function ensemble(c: Campagne): boolean {
  const [a, b] = c.joueurs;
  return !finie(a) && !finie(b) && a.scene.type === 'temps_libre' && b.scene.type === 'temps_libre' && Math.abs(a.jour - b.jour) <= 90 && !c.combat && !c.commune && !c.resultat;
}

/** Les formules proposées pour nommer une technique de duo. */
export function nomsDuo(c: Campagne): string[] {
  const n = naturesDuo(c);
  const mots: Record<string, string> = { katon: 'cendre', suiton: 'marée', fuuton: 'bourrasque', raiton: 'foudre', doton: 'roche' };
  const [a, b] = [mots[n[0]] ?? 'ombre', mots[n[1] ?? n[0]] ?? 'ombre'];
  return [`La ${a} jumelle`, `La ${b} des deux rives`, `Prison de ${b}`, 'Le dos à dos', 'Le dragon jumeau', `Ce que ${c.creations[0].prenom} et ${c.creations[1].prenom} ont juré`];
}

/** Ce qu'un joueur peut faire maintenant envers l'autre (pour l'onglet du lien). */
export function actionsLien(c: Campagne, j: IdJoueur) {
  const s = c.joueurs[j];
  const o = c.joueurs[autre(j)];
  const age = ageA(s);
  const proche = ensemble(c);
  const enseignables = Object.keys(s.maitrises)
    .filter((id) => R.maitrises[id]?.technique && s.maitrises[id].tier >= 3 && !(o.maitrises[id]?.tier >= 1) && R.maitrises[id].kind === 'jutsu')
    .slice(0, 8);
  return {
    proche,
    donner: s.jauges.ryo >= 10,
    enseignables: proche ? enseignables : [],
    duel: proche && !c.proposition,
    technique: proche && !c.proposition && c.lien.accord >= 50 && c.lien.techniquesDuo.length < 3,
    nomsDuo: nomsDuo(c),
    // Agir contre l'autre : jamais pendant l'enfance.
    denoncer: age >= 12 && ageA(o) >= 12 && !finie(o),
    nuire: age >= 16 && ageA(o) >= 16 && !finie(o),
    cibles: (['parent', 'sensei', 'ami'] as const).filter((r) => {
      const id = o.roles[r === 'ami' ? 'coequipierA' : r];
      return !!id && (o.pnj[id]?.etat === 'vivant' || o.pnj[id]?.etat === 'blesse');
    }),
    enqueter: age >= 12,
    proposition: c.proposition && c.proposition.de !== j ? c.proposition : undefined,
  };
}

function pnjDe(o: GameState, cible: 'parent' | 'sensei' | 'ami'): string | undefined {
  return o.roles[cible === 'ami' ? 'coequipierA' : cible];
}

export function agirLienMut(c: Campagne, j: IdJoueur, x: ActionLien): void {
  const s = c.joueurs[j];
  const oj = autre(j);
  const o = c.joueurs[oj];
  const moi = c.creations[j].prenom;
  const lui = c.creations[oj].prenom;
  const v = actionsLien(c, j);
  switch (x.t) {
    case 'donner': {
      const n = Math.min(Math.max(0, Math.round(x.ryo)), Math.floor(s.jauges.ryo));
      if (n <= 0) throw new Error('Pas assez de ryō.');
      s.jauges.ryo -= n;
      o.jauges.ryo += n;
      bouger(c, oj, x.pret ? { dette: 4 } : { confiance: 3, dette: 2 });
      if (x.pret) fait(c, { id: `pret_${c.actions.length}`, texte: `${moi} a prêté ${n} ryō à ${lui}.`, connus: [j, oj], preuves: 0 });
      noter(c, oj, x.pret ? `${moi} t’a prêté ${n} ryō. Un prêt, pas un cadeau.` : `${moi} t’a donné ${n} ryō, sans rien demander.`);
      return;
    }
    case 'enseigner': {
      if (!v.enseignables.includes(x.technique)) throw new Error('Tu ne peux pas enseigner cette technique maintenant.');
      appliquerEffets(o, [{ apprendre: x.technique, source: 'mentor' }, { stat: 'jauges.fatigue', delta: 15 }], nouveauCtx());
      s.jauges.fatigue = Math.min(100, s.jauges.fatigue + 15);
      c.lien.accord = borne(c.lien.accord + 4);
      bouger(c, oj, { respect: 5, admiration: 3 });
      bouger(c, j, { confiance: 2 });
      // Une technique vue à l'entraînement est connue : elle ne surprendra plus l'autre en duel.
      for (const k of [0, 1] as IdJoueur[]) if (!c.lien.vus[k].includes(x.technique)) c.lien.vus[k].push(x.technique);
      noter(c, oj, `${moi} t’a appris ${R.maitrises[x.technique]?.nom ?? x.technique}. Plus lentement qu’un maître, mais tu sais désormais comment ${moi} pense.`);
      return;
    }
    case 'proposer': {
      if (x.type === 'duel' ? !v.duel : !v.technique) throw new Error('Proposition impossible maintenant.');
      c.proposition = { de: j, type: x.type, nom: x.nom };
      return;
    }
    case 'repondre': {
      const p = c.proposition;
      if (!p || p.de === j) throw new Error('Aucune proposition à laquelle répondre.');
      c.proposition = undefined;
      if (!x.accepte) {
        bouger(c, p.de, { ressentiment: 2 });
        noter(c, p.de, `${moi} a refusé ta proposition.`);
        return;
      }
      if (p.type === 'duel') return ouvrirCombatDuo(c, 'duel_entrainement');
      const id = `t${c.lien.techniquesDuo.length + 1}`;
      c.lien.techniquesDuo.push({ id, nom: p.nom ?? nomsDuo(c)[0], natures: naturesDuo(c), palier: 1, usages: 0 });
      c.lien.accord = borne(c.lien.accord + 5);
      for (const k of [0, 1] as IdJoueur[]) c.joueurs[k].jauges.fatigue = Math.min(100, c.joueurs[k].jauges.fatigue + 25);
      souvenir(c, `duo_${id}`, `Le jour où vous avez créé « ${p.nom ?? nomsDuo(c)[0]} », à deux.`, 4, 'fier');
      return;
    }
    case 'denoncer': {
      if (!v.denoncer) throw new Error('Pas encore.');
      const motif = x.motif;
      const id = `denonce_${c.actions.length}`;
      fait(c, { id, texte: `Tu as fait un rapport sur ${lui} : ${motif}.`, texteCible: `${c.creations[j].prenom} a fait un rapport sur toi : ${motif}.`, connus: [j, 'kage'], preuves: 1, cible: oj });
      c.repercussions.push({ jour: jourMonde(c) + 60 + Math.floor(hash01(c, id) * 120), cible: oj, type: 'enquete', faitId: id });
      // Un faux rapport peut se retourner contre son auteur.
      if (x.faux) c.faits.find((f) => f.id === id)!.texte += ' (faux)';
      return;
    }
    case 'rumeur': {
      if (!v.denoncer) throw new Error('Pas encore.');
      const id = `rumeur_${c.actions.length}`;
      fait(c, { id, texte: `Tu as fait courir une rumeur sur ${lui}.`, texteCible: `C’est ${c.creations[j].prenom} qui a fait courir la rumeur sur toi.`, connus: [j], preuves: 1, cible: oj });
      c.repercussions.push({ jour: jourMonde(c) + 20, cible: oj, type: 'rumeur', faitId: id });
      return;
    }
    case 'nuire': {
      if (!v.nuire || !v.cibles.includes(x.cible)) throw new Error('Impossible.');
      const pid = pnjDe(o, x.cible)!;
      const nomPnj = defPnj(o, pid)?.nom ?? 'quelqu’un';
      // La mort est réelle, dans la vie de l'autre (et dans la tienne, si c'est aussi ta famille).
      for (const k of [0, 1] as IdJoueur[]) {
        const st = c.joueurs[k].pnj[pid];
        if (st && (k === oj || c.joueurs[k].pnjGeneres[pid] === c.joueurs[oj].pnjGeneres[pid] || JSON.stringify(c.joueurs[k].pnjGeneres[pid]) === JSON.stringify(c.joueurs[oj].pnjGeneres[pid]))) {
          st.etat = 'mort';
          st.cause = 'retrouvé·e mort·e, sans témoin';
        }
      }
      ajouterJournal(o, `${nomPnj} a été retrouvé·e mort·e. Personne ne sait qui.`, 3);
      noter(c, oj, `${nomPnj} a été retrouvé·e mort·e, au petit matin. Aucune trace, aucun témoin. Quelqu’un savait où et quand.`);
      const id = `meurtre_${pid}`;
      fait(c, { id, texte: `Tu as tué ${nomPnj}, proche de ${lui}.`, texteCible: `C’est ${c.creations[j].prenom} qui a tué ${nomPnj}.`, connus: [j], preuves: 2, cible: oj });
      ajouterJournal(s, `Tu as tué ${nomPnj}.`, 3);
      s.ethique.compassion = Math.max(-100, s.ethique.compassion - 15);
      return;
    }
    case 'enqueter': {
      if (!v.enqueter) throw new Error('Pas encore.');
      s.jauges.fatigue = Math.min(100, s.jauges.fatigue + 15);
      s.jauges.ryo = Math.max(0, s.jauges.ryo - 20);
      // Ce qui te concerne et que tu ne sais pas encore : un rapport, une rumeur, un meurtre, une trahison.
      const caches = c.faits.filter((f) => f.cible === j && !f.connus.includes(j));
      const p = 0.2 + (s.attributs.intellect + s.attributs.perception) / 400;
      const trouve = caches.find((f) => hash01(c, `enquete:${f.id}:${c.actions.length}`) < p + 0.08 * f.preuves);
      if (!trouve) {
        noter(c, j, 'Tu as cherché, payé, questionné. Rien. Ou rien que tu puisses trouver.');
        return;
      }
      trouve.connus.push(j);
      const auteur = trouve.connus.find((q) => q === oj) !== undefined;
      noter(c, j, texteCommun(c, auteur ? `Tu sais maintenant. ${revele(trouve.id)} C’était {autre}.` : `Tu sais maintenant. ${revele(trouve.id)}`, j, j));
      if (auteur) {
        bouger(c, j, { ressentiment: trouve.id.startsWith('meurtre') ? 40 : 20, mefiance: 20, confiance: -25 });
        souvenir(c, `decouverte_${trouve.id}`, texteCommun(c, 'Le jour où tu as découvert ce que {autre} t’avait fait.', j, j), 5, 'amer', [j]);
        rompre(c);
      }
      return;
    }
  }
}

function revele(id: string): string {
  if (id.startsWith('denonce')) return 'Le rapport qui t’a valu l’enquête avait un auteur.';
  if (id.startsWith('rumeur')) return 'La rumeur venait de quelqu’un de proche.';
  if (id.startsWith('meurtre')) return 'La mort n’était pas un hasard.';
  return 'Ce qu’on t’avait caché tient en une phrase.';
}

/** Les conséquences différées : elles tombent quand la cible atteint leur jour, sans dire d'où elles viennent. */
export function appliquerRepercussions(c: Campagne): void {
  const restent = [];
  for (const r of c.repercussions) {
    const s = c.joueurs[r.cible];
    if (finie(s)) continue;
    if (s.jour < r.jour) {
      restent.push(r);
      continue;
    }
    const f = c.faits.find((x) => x.id === r.faitId);
    if (r.type === 'enquete') {
      const faux = !!f?.texte.endsWith('(faux)');
      appliquerEffets(s, [{ stat: 'social.suspicion', delta: 15 }, { stat: 'social.reputation', delta: -5 }], nouveauCtx());
      ajouterJournal(s, 'Une enquête t’a visé·e. Quelqu’un a parlé.', 2);
      noter(c, r.cible, 'Deux hommes de l’ANBU t’ont interrogé·e pendant des heures, sur des choses que très peu de gens savaient. Quelqu’un a parlé. Mais qui ?');
      // Un faux rapport finit par être démenti, et retombe sur son auteur.
      const auteur = f?.connus.find((q) => q === 0 || q === 1) as IdJoueur | undefined;
      if (faux && auteur !== undefined && hash01(c, `dementi:${f!.id}`) < 0.45) {
        appliquerEffets(c.joueurs[auteur], [{ stat: 'social.reputation', delta: -10 }, { stat: 'social.suspicion', delta: 10 }], nouveauCtx());
        noter(c, auteur, 'Ton rapport a été démenti. Le Kage t’a fait appeler, et t’a regardé·e longtemps sans rien dire.');
      }
    } else if (r.type === 'rumeur') {
      appliquerEffets(s, [{ stat: 'social.reputation', delta: -4 }], nouveauCtx());
      noter(c, r.cible, 'On chuchote dans ton dos, au marché, au terrain. Tu ne sais pas ce qu’on dit. Tu sais seulement qu’on le dit.');
    }
  }
  c.repercussions = restent;
}

export { texteCommun };
