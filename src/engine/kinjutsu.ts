// Le prix d'une technique ultime, le même quel que soit le combat où on la lance.

import type { GameState } from './types';
import { Ctx, clamp } from './etat';
import { R } from './registre';
import { alea } from './rng';

/**
 * Le prix d'une technique ultime, payé au moment où on la lance : réserve perdue pour toujours, mort possible
 * (la huitième porte), ou sacrifice qui emportera l'utilisateur à la fin du combat (Shiki Fūjin, C0).
 */
export function consequenceUltime(s: GameState, tech: string, ctx: Ctx): string {
  const l = R.maitrises[tech]?.technique?.limite;
  if (!l) return '';
  let texte = '';
  if (l.chakraMaxPerdu) {
    s.jauges.chakraMax = Math.max(10, s.jauges.chakraMax - l.chakraMaxPerdu);
    s.jauges.chakra = Math.min(s.jauges.chakra, s.jauges.chakraMax);
    ctx.changements.push({ t: 'stat', chemin: 'jauges.chakraMax', delta: -l.chakraMaxPerdu });
    texte += 'Quelque chose en toi s’éteint pour toujours. ';
  }
  if (l.mort && (s.maitrises[tech]?.tier ?? 0) >= (l.mort.palierMin ?? 0) && alea(s) < l.mort.chance) {
    s.drapeaux['sacrifice'] = tech;
    texte += 'Tu sens ton corps se consumer de l’intérieur. Tu sais déjà que tu n’en reviendras pas. ';
  }
  if (l.controle) {
    const tier = s.maitrises['chakra_biju']?.tier ?? 1;
    const perte = clamp(0.5 - s.attributs.controleEmotionnel / 200 - (tier - 1) * 0.08, 0.03, 0.6);
    if (alea(s) < perte) {
      const d = 10;
      s.jauges.sante = clamp(s.jauges.sante - d, 1, 100);
      ctx.changements.push({ t: 'stat', chemin: 'jauges.sante', delta: -d });
      s.social.suspicion = clamp(s.social.suspicion + 4, 0, 100);
      s.drapeaux['pertes_controle'] = (Number(s.drapeaux['pertes_controle']) || 0) + 1;
      texte += 'La bête prend le dessus un instant : tu frappes plus fort que tu ne le voulais, et elle te mord de l’intérieur en retour. ';
    }
  }
  if (l.ethique) {
    for (const [k, v] of Object.entries(l.ethique)) s.ethique[k as keyof typeof s.ethique] += v ?? 0;
    texte += `${l.avertissement} `;
  }
  if (l.sacrifice) {
    s.drapeaux['sacrifice'] = tech;
    texte += 'Le prix est fixé. Tu le paieras quand tout sera fini. ';
  }
  return texte;
}
