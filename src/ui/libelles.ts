import type { AttributId, Changement, GameState, JaugeId, RelationAxe, SocialId, StatPath } from '../engine/types';
import { R } from '../engine/registre';
import { defPnj } from '../engine/etat';
import { libelleDuree } from '../engine/calendrier';

export const ATTRIBUT_LIBELLE: Record<AttributId, string> = {
  force: 'Force',
  agilite: 'Agilité',
  perception: 'Perception',
  discretion: 'Discrétion',
  intellect: 'Intelligence tactique',
  charisme: 'Charisme',
  controleChakra: 'Contrôle du chakra',
  controleEmotionnel: 'Contrôle émotionnel',
};

export const SOCIAL_LIBELLE: Record<SocialId, string> = {
  loyaute: 'Loyauté envers le village',
  reputation: 'Réputation',
  reputationOmbre: 'Réputation clandestine',
  influence: 'Influence politique',
  confianceClan: 'Confiance du clan',
  suspicion: 'Suspicion des autorités',
};

export const JAUGE_LIBELLE: Record<JaugeId, string> = {
  sante: 'Santé',
  chakra: 'Chakra',
  chakraMax: 'Chakra',
  fatigue: 'Fatigue',
  ryo: 'Ryō',
  experience: 'Expérience',
};

export const AXE_LIBELLE: Record<RelationAxe, string> = {
  confiance: 'confiance',
  respect: 'respect',
  amitie: 'amitié',
  rivalite: 'rivalité',
  hostilite: 'hostilité',
  attachement: 'attachement',
  peur: 'peur',
  dette: 'dette',
};

export const RANG_LIBELLE: Record<string, string> = {
  eleve: 'Élève de l’Académie',
  genin: 'Genin',
  chunin: 'Chūnin',
  jonin: 'Jōnin',
  kage: 'Kage',
  civil: 'Civil·e',
  renegat: 'Renégat·e',
};

export const STATUT_LIBELLE: Record<string, string> = {
  actif: 'En service',
  civil: 'Vie civile',
  deserteur: 'Déserteur·se',
  errant: 'Sur les routes',
  exile: 'Exilé·e',
  capture: 'Captif·ve',
  mort: 'Mort·e',
};

export const ETAT_PNJ: Record<string, string> = { vivant: '', blesse: 'blessé·e', disparu: 'disparu·e', mort: 'mort·e' };

export const STATUT_ARME: Record<string, string> = {
  possedee: 'Possédée',
  pretee: 'Prêtée par le village',
  derobee: 'Gardée en secret',
  confisquee: 'Confisquée',
  perdue: 'Perdue',
  detruite: 'Détruite',
  vendue: 'Vendue',
  rendue: 'Rendue',
};

export const KANJI_SAISON: Record<string, string> = { printemps: '春', ete: '夏', automne: '秋', hiver: '冬' };

export function libelleStat(chemin: StatPath): string {
  const [g, k] = chemin.split('.');
  if (g === 'attributs') return ATTRIBUT_LIBELLE[k as AttributId];
  if (g === 'social') return SOCIAL_LIBELLE[k as SocialId];
  if (g === 'jauges') return JAUGE_LIBELLE[k as JaugeId];
  return k;
}

export function nomPnjId(s: GameState, id: string): string {
  return defPnj(s, id)?.nom ?? id;
}

export interface VueChangement {
  texte: string;
  classe: string;
}

/** Traduit les changements bruts en indicateurs lisibles. En difficulté Légende, les valeurs exactes sont masquées. */
export function vueChangements(s: GameState, ch: Changement[]): VueChangement[] {
  const precis = s.creation.difficulte !== 'legende';
  const res: VueChangement[] = [];
  const fleche = (d: number) => (d > 0 ? '▲' : '▼');
  const valeur = (d: number) => (precis ? ` ${d > 0 ? '+' : ''}${Math.round(d)}` : ` ${fleche(d)}`);
  const relations = new Map<string, { axe: RelationAxe; delta: number }[]>();
  let tempsTotal = 0;
  for (const c of ch) {
    switch (c.t) {
      case 'stat': {
        const inverse = c.chemin === 'social.suspicion';
        const bon = inverse ? c.delta < 0 : c.delta > 0;
        res.push({ texte: `${libelleStat(c.chemin)}${valeur(c.delta)}`, classe: bon ? 'hausse' : 'baisse' });
        break;
      }
      case 'relation': {
        const l = relations.get(c.pnj) ?? [];
        l.push({ axe: c.axe, delta: c.delta });
        relations.set(c.pnj, l);
        break;
      }
      case 'rupture':
        res.push({ texte: `Rupture avec ${nomPnjId(s, c.pnj)}`, classe: 'baisse majeure' });
        break;
      case 'reconciliation':
        res.push({ texte: `Réconciliation avec ${nomPnjId(s, c.pnj)}`, classe: 'hausse majeure' });
        break;
      case 'palier':
        res.push({ texte: `${R.maitrises[c.maitrise]?.nom} : palier ${c.palier}`, classe: 'majeure' });
        break;
      case 'eveil':
        res.push({ texte: `Éveil : ${R.maitrises[c.maitrise]?.nom}`, classe: 'majeure' });
        break;
      case 'technique':
      case 'arme':
      case 'metier':
      case 'promesse':
        res.push({ texte: c.message, classe: c.t === 'arme' && R.armes[c.arme]?.rarete === 'legendaire' ? 'or' : '' });
        break;
      case 'blessure':
        res.push({ texte: `Blessure : ${c.nom}`, classe: 'baisse' });
        break;
      case 'soin':
        res.push({ texte: c.message, classe: 'hausse' });
        break;
      case 'rang':
        res.push({ texte: `Rang : ${RANG_LIBELLE[c.rang]}`, classe: 'or' });
        break;
      case 'secret':
        res.push({ texte: `Secret découvert : ${R.encyclopedie[`secret:${c.id}`]?.titre ?? 'inconnu'}`, classe: 'majeure' });
        break;
      case 'indice':
        res.push({ texte: 'Nouvel indice', classe: '' });
        break;
      case 'mission':
        if (c.statut !== 'en_cours') res.push({ texte: `Mission ${c.statut === 'reussie' ? 'réussie' : c.statut === 'echouee' ? 'échouée' : 'abandonnée'}`, classe: c.statut === 'reussie' ? 'hausse' : 'baisse' });
        break;
      case 'pnj':
        if (c.etat !== 'vivant') res.push({ texte: `${nomPnjId(s, c.pnj)} : ${ETAT_PNJ[c.etat]}`, classe: c.etat === 'mort' ? 'baisse majeure' : 'baisse' });
        break;
      case 'temps':
        tempsTotal += c.jours;
        break;
      case 'succes':
        res.push({ texte: `Trophée : ${R.succes[c.id]?.nom}`, classe: 'or' });
        break;
      case 'info':
        res.push({ texte: c.message, classe: '' });
        break;
      case 'points':
        res.push({ texte: `${c.age} ans : +${c.total} points de stat à répartir (${c.gains.map((g) => `${g.source} ${g.points}`).join(', ')})`, classe: 'or' });
        break;
    }
  }
  if (tempsTotal >= 5) res.unshift({ texte: `Temps écoulé : ${libelleDuree(tempsTotal)}`, classe: '' });
  for (const [pnj, axes] of relations) {
    const txt = axes.map((a) => `${AXE_LIBELLE[a.axe]}${precis ? ` ${a.delta > 0 ? '+' : ''}${a.delta}` : ` ${fleche(a.delta)}`}`).join(', ');
    const positif = axes.reduce((t, a) => t + (['rivalite', 'hostilite'].includes(a.axe) ? -a.delta : a.delta), 0) >= 0;
    res.push({ texte: `${nomPnjId(s, pnj)} : ${txt}`, classe: positif ? 'hausse' : 'baisse' });
  }
  return res;
}
