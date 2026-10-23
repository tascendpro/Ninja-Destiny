// Chronologie : le temps qui passe soigne, fatigue, fait grandir — et fait progresser tout le monde.

import type { GameState } from './types';
import { R } from './registre';
import { age } from './calendrier';
import { Ctx, ajouterJournal, clamp } from './etat';
import { eveilsAutomatiques, progressionPnj } from './maitrise';
import { anniversaire } from './progression';
import { perteAnnuelle } from './pertes';
import { actualiserTableau } from './tableauMissions';

function croissanceAnnuelle(s: GameState, nouvelAge: number, ctx: Ctx): void {
  // Le corps grandit seul ; tout le reste se gagne (points de stat, voir progression.ts).
  if (nouvelAge <= 20) {
    s.attributs.force = clamp(s.attributs.force + 1, 0, 100);
    s.attributs.agilite = clamp(s.attributs.agilite + 1, 0, 100);
  } else if (nouvelAge >= 36) {
    // Le déclin physique est compensé par l'expérience tactique.
    s.attributs.force = clamp(s.attributs.force - 1, 0, 100);
    s.attributs.agilite = clamp(s.attributs.agilite - 1, 0, 100);
    s.attributs.intellect = clamp(s.attributs.intellect + 1, 0, 100);
  }
  if (nouvelAge <= 25) {
    const bonus = R.clans[s.creation.clan]?.chakraBonus ?? 0;
    s.jauges.chakraMax = clamp(s.jauges.chakraMax + 6 + Math.round(bonus / 10), 10, 400);
  }
  ajouterJournal(s, `Tu as ${nouvelAge} ans.`, 1);
  anniversaire(s, nouvelAge, ctx);
  perteAnnuelle(s, ctx);
}

export function avancerTemps(s: GameState, jours: number, ctx: Ctx): void {
  if (jours <= 0) return;
  const ageAvant = age(s);
  s.jour += Math.round(jours);
  const ageApres = age(s);
  for (let a = ageAvant + 1; a <= ageApres; a++) croissanceAnnuelle(s, a, ctx);

  // Guérison des blessures non invalidantes.
  const gueries = s.blessures.filter((b) => !b.invalidante && b.guerison <= s.jour);
  if (gueries.length) {
    s.blessures = s.blessures.filter((b) => !gueries.includes(b));
    for (const b of gueries) ctx.changements.push({ t: 'soin', message: `${b.nom} : guérie.` });
  }

  const grave = s.blessures.some((b) => b.gravite >= 3);
  const medical = s.metier.principal === 'medical' || s.metier.secondaire === 'medical';
  const regen = (grave ? 0.15 : s.blessures.length ? 0.35 : 0.6) * (medical ? 1.5 : 1);
  const plafondSante = s.blessures.some((b) => b.invalidante) ? 75 : 100;
  if (s.jauges.sante < plafondSante) s.jauges.sante = Math.min(plafondSante, Math.round(s.jauges.sante + jours * regen));
  s.jauges.fatigue = Math.max(0, Math.round(s.jauges.fatigue - jours * 0.6));
  s.jauges.chakra = s.jauges.chakraMax;

  if (s.metier.principal && s.statut === 'actif') {
    const salaire = R.metiers[s.metier.principal]?.salaireMensuel ?? 0;
    s.jauges.ryo += Math.round((salaire * jours) / 30);
  }

  for (const st of Object.values(s.pnj)) {
    if (st.etat === 'blesse' && st.gueriLe !== undefined && s.jour >= st.gueriLe) {
      st.etat = 'vivant';
      st.gueriLe = undefined;
    }
  }

  eveilsAutomatiques(s, ctx);
  progressionPnj(s, jours);
  actualiserTableau(s, ctx);
  ctx.changements.push({ t: 'temps', jours: Math.round(jours) });
}
