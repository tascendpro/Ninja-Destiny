import type { Condition, Effect, EventDef } from '../../engine/types';
import { partirEnExil } from './exil';

// Ce qui suit un combat mortel, quel qu'il soit : l'adversaire vaincu à ta merci, ou ta propre captivité.
// Ces scènes sont ouvertes par le moteur (voir apresCombat) et peuvent revenir à chaque combat.

const base = { chapitre: 1, chapitres: [1, 2, 3, 4, 5, 6], arc: 'conflit' as const, enchaine: true, repetable: { delaiJours: 0 } };

/** Retour au statut d'avant la capture (au village, sur la route, en fuite). */
const RETOUR: Effect[] = [
  {
    si: { drapeau: 'statut_avant_capture', egal: 'actif' },
    alors: [{ statut: 'actif' }],
    sinon: [
      {
        si: { drapeau: 'statut_avant_capture', egal: 'deserteur' },
        alors: [{ statut: 'deserteur' }],
        sinon: [{ si: { drapeau: 'statut_avant_capture', egal: 'exile' }, alors: [{ statut: 'exile' }], sinon: [{ statut: 'errant' }] }],
      },
    ],
  },
  { drapeau: 'statut_avant_capture', retirer: true },
];
const VILLAGE_DERRIERE = { drapeau: 'statut_avant_capture', egal: 'actif' } as const;
const DUEL = { drapeau: 'verdict_forme', egal: 'duel' } as const;
/** Ton sensei est encore là, derrière toi, tant que tu es jeune genin. */
const SENSEI_PRESENT: Condition = { tout: [{ statut: 'actif' }, { rang: 'genin' }, { age: { max: 16 } }, { pnj: '@sensei', etat: ['vivant', 'blesse'] }] };
/** Ton coéquipier est dans la mêlée quand le combat avait des alliés. */
const AMI_PRESENT: Condition = { tout: [{ statut: 'actif' }, { drapeau: 'verdict_allies' }, { pnj: '@coequipierA', etat: ['vivant', 'blesse'] }] };
/** Les villages qui ne pardonnent pas qu'on achève des vaincus. Kiri, la Brume sanglante, et Iwa ferment les yeux. */
const VILLAGE_STRICT: Condition = { village: ['konoha', 'suna', 'kumo'] };
/** Ceux qui ont vu : leur regard change, et ils s'en souviennent. */
const TEMOINS_CHOQUES: Effect[] = [
  { relation: '@coequipierA', delta: { peur: 6, amitie: -4, confiance: -3 } },
  { relation: '@coequipierB', delta: { peur: 4, respect: -2 } },
  { drapeau: 'temoins_choques', incr: 1 },
  { journal: 'Tes équipiers t’ont vu achever un homme à terre. Ils ne te regardent plus pareil.', importance: 2 },
];

export const CONSEQUENCES: EventDef[] = [
  // ── Le sang de trop : le conseil convoque celui ou celle qui achève les vaincus ──
  {
    ...base,
    id: 'x_conseil_sang',
    titre: 'Le conseil',
    categorie: 'mission',
    lieu: '$village',
    planifieParMoteur: true,
    si: { tout: [{ statut: 'actif' }, { drapeau: 'conseil_sang', absent: true }] },
    texte: [
      { texte: 'Deux ANBU t’attendent devant ta porte. Pas de masque baissé, pas de mot de trop : le conseil veut te voir. Maintenant.' },
      { texte: 'Dans la salle, les anciens ont devant eux un dossier. Ton nom, et la liste de ceux que tu as achevés à terre. « Un ninja de ce village tue quand il doit. Pas quand il peut. On nous rapporte que tu ne fais plus la différence. »' },
      { si: { drapeau: 'temoins_choques' }, texte: 'Tu reconnais l’écriture d’un des rapports. Celle de {@coequipierA}.' },
    ],
    choix: [
      {
        id: 'justifier',
        texte: 'Te justifier : chaque fois, c’était eux ou nous',
        test: {
          type: 'competence',
          difficulte: 55,
          attributs: { charisme: 3, intellect: 1, controleEmotionnel: 2 },
          succes: {
            texte: 'Tu parles longtemps, calmement. De chaque nom, de chaque mission, de ce qui serait arrivé s’ils s’étaient relevés. Le silence qui suit dure une éternité. « Un avertissement. Le dernier. » On te laisse partir. Dans le couloir, tu sens les regards dans ton dos.',
            effets: [{ drapeau: 'conseil_sang', valeur: 'averti' }, { stat: 'social.suspicion', delta: 10 }, { stat: 'social.reputation', delta: -4 }],
          },
          echec: {
            texte: 'Tes mots tombent à plat. Tu le vois dans leurs yeux avant qu’ils parlent. « Tu quittes le village avant la lune nouvelle. Ton bandeau reste ici. » Personne ne te raccompagne à la porte. Personne n’en a besoin.',
            effets: [{ drapeau: 'conseil_sang', valeur: 'exile' }, { statut: 'exile' }, { stat: 'social.loyaute', delta: -20 }, ...partirEnExil('exil prononcé par le conseil')],
          },
        },
      },
      {
        id: 'accepter',
        texte: 'Ne rien dire, et accepter leur sentence',
        effets: [
          {
            hasard: [
              { poids: 55, effets: [{ drapeau: 'conseil_sang', valeur: 'averti' }, { stat: 'social.suspicion', delta: 6 }, { stat: 'social.loyaute', delta: 3 }] },
              { poids: 45, effets: [{ drapeau: 'conseil_sang', valeur: 'exile' }, { statut: 'exile' }, { stat: 'social.loyaute', delta: -10 }, ...partirEnExil('exil prononcé par le conseil')] },
            ],
          },
        ],
        resultat: [
          { si: { drapeau: 'conseil_sang', egal: 'averti' }, texte: 'Ton silence les surprend. Ils s’attendaient à des excuses ou à de la colère. « Un avertissement, alors. » Tu inclines la tête et tu sors.' },
          { si: { drapeau: 'conseil_sang', egal: 'exile' }, texte: 'Ton silence leur suffit. « Tu quittes le village avant la lune nouvelle. » Tu poses ton bandeau sur la table toi-même. Le bruit du métal sur le bois te poursuivra longtemps.' },
        ],
      },
      {
        id: 'fuir',
        texte: 'Sauter par la fenêtre avant la sentence',
        effets: [{ drapeau: 'conseil_sang', valeur: 'fui' }, { statut: 'deserteur' }, { stat: 'social.loyaute', delta: -40 }, ...partirEnExil('fuite devant le conseil')],
        resultat: 'Le verre éclate, les toits défilent. Derrière toi, les cloches sonnent. Ce soir, ton visage est dans le Bingo Book de ton propre village.',
      },
    ],
  },

  // ── L'adversaire à ta merci ──
  {
    ...base,
    id: 'x_verdict',
    planifieParMoteur: true,
    titre: 'À ta merci',
    categorie: 'mission',
    lieu: '$ici',
    si: { drapeau: 'verdict_forme' },
    texte: [
      { si: DUEL, texte: 'Ton adversaire est à terre, désarmé, une main pressée sur sa blessure. Il ne supplie pas. Il attend de voir ce que tu es.' },
      { si: { non: DUEL }, texte: 'Les autres ont fui ou ne se relèveront pas. Leur chef est à genoux dans la boue, le souffle court, et il te regarde approcher.' },
      { texte: 'Personne ne te reprochera ce que tu feras maintenant. C’est bien ça le problème.' },
    ],
    choix: [
      {
        id: 'achever',
        texte: 'L’achever : un ennemi épargné est un ennemi qui revient',
        effets: [
          // Qui est là peut te retenir : ton sensei tant que tu es jeune genin, ton coéquipier quand il est dans la mêlée.
          { drapeau: 'verdict_issue', valeur: 'tue' },
          { si: SENSEI_PRESENT, alors: [{ hasard: [{ poids: 45, effets: [{ drapeau: 'verdict_issue', valeur: 'sensei' }] }, { poids: 55, effets: [] }] }] },
          { si: { tout: [{ drapeau: 'verdict_issue', egal: 'tue' }, AMI_PRESENT] }, alors: [{ hasard: [{ poids: 35, effets: [{ drapeau: 'verdict_issue', valeur: 'ami' }] }, { poids: 65, effets: [] }] }] },
          {
            si: { drapeau: 'verdict_issue', egal: 'tue' },
            alors: [
              { ethique: { compassion: -8, ambition: 2 } },
              { stat: 'social.reputationOmbre', delta: 4 },
              { stat: 'attributs.controleEmotionnel', delta: -1 },
              { drapeau: 'ennemis_acheves', incr: 1 },
              { journal: 'Tu as achevé un ennemi vaincu.', importance: 2 },
              { si: AMI_PRESENT, alors: TEMOINS_CHOQUES },
              // Trop de vaincus achevés, dans un village qui ne le tolère pas : le conseil s'en mêle.
              { si: { tout: [{ statut: 'actif' }, VILLAGE_STRICT, { drapeau: 'ennemis_acheves', min: 3 }, { drapeau: 'conseil_sang', absent: true }] }, alors: [{ planifier: 'x_conseil_sang', dansJours: 20 }] },
            ],
            sinon: [
              { ethique: { compassion: 2 } },
              { si: { drapeau: 'verdict_issue', egal: 'sensei' }, alors: [{ relation: '@sensei', delta: { confiance: -4, attachement: 3 } }, { planifier: 'x_epargne_vengeance', dansJours: 300 }] },
              { si: { drapeau: 'verdict_issue', egal: 'ami' }, alors: [{ relation: '@coequipierA', delta: { confiance: 4, attachement: 3 } }, { planifier: 'x_epargne_dette', dansJours: 240 }] },
            ],
          },
          { drapeau: 'verdict_forme', retirer: true },
          { drapeau: 'verdict_allies', retirer: true },
        ],
        resultat: [
          { si: { drapeau: 'verdict_issue', egal: 'tue' }, texte: 'Tu ne détournes pas les yeux. C’est la seule politesse qu’il te reste à lui faire. Le soir, en lavant tes mains, tu frottes plus longtemps que nécessaire.' },
          { si: { tout: [{ drapeau: 'verdict_issue', egal: 'tue' }, AMI_PRESENT] }, texte: '{@coequipierA} a tout vu. {Il:@coequipierA} ne dit rien sur le chemin du retour. Le soir, autour du feu, {il:@coequipierA} s’assoit de l’autre côté. Quand tu lèves les yeux, {il:@coequipierA} détourne les siens, une demi-seconde trop vite.' },
          { si: { drapeau: 'verdict_issue', egal: 'sensei' }, texte: 'Ta lame s’arrête à un pouce de sa gorge : {@sensei} te tient le poignet. « On ne tue pas un homme à terre parce qu’on peut. On le tue parce qu’on doit. Là, tu ne dois pas. » L’ennemi en profite pour disparaître dans les fourrés.' },
          { si: { drapeau: 'verdict_issue', egal: 'ami' }, texte: '{@coequipierA} se jette entre vous. « Il est fini. Regarde-le. Il est fini. » Tu baisses ta lame. L’homme rampe jusqu’aux arbres. Tu ne sais pas si tu en veux à ton ami{e:@coequipierA}, ou si tu lui dois quelque chose.' },
        ],
      },
      {
        id: 'epargner',
        texte: 'L’épargner et le laisser partir',
        indice: 'Ce qu’on épargne finit toujours par revenir. Pas toujours pour te remercier.',
        effets: [
          { ethique: { compassion: 8, honneur: 2 } },
          { drapeau: 'ennemis_epargnes', incr: 1 },
          { drapeau: 'verdict_forme', retirer: true },
          {
            hasard: [
              { poids: 45, effets: [{ planifier: 'x_epargne_dette', dansJours: 240 }] },
              { poids: 35, effets: [{ planifier: 'x_epargne_vengeance', dansJours: 300 }] },
              { poids: 20, effets: [] },
            ],
          },
        ],
        resultat: 'Tu ranges ton arme. Il te fixe comme on fixe une énigme, puis il disparaît entre les arbres en boitant. Tu ne sais pas encore si tu viens de faire une erreur.',
      },
      {
        id: 'ramener',
        texte: 'Le ligoter et le ramener au village pour qu’il soit interrogé',
        si: { statut: 'actif' },
        test: {
          type: 'competence',
          difficulte: 46,
          attributs: { force: 1, perception: 1, intellect: 1 },
          succes: {
            texte: 'Trois jours de route avec un prisonnier qui ne dort jamais. Tu ne dors pas non plus. Au village, les interrogateurs l’emmènent sans un mot, et le {kage} retient ton nom.',
            effets: [{ stat: 'social.reputation', delta: 6 }, { stat: 'social.loyaute', delta: 4 }, { stat: 'jauges.ryo', delta: 80 }, { stat: 'jauges.fatigue', delta: 15 }, { drapeau: 'verdict_forme', retirer: true }],
          },
          echec: {
            texte: 'La deuxième nuit, ses liens sont vides. Il a pris ta gourde, et il t’a laissé la vie. Tu n’es pas sûr·e que ce soit un cadeau.',
            effets: [{ stat: 'social.reputation', delta: -2 }, { drapeau: 'verdict_forme', retirer: true }, { planifier: 'x_epargne_vengeance', dansJours: 200 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'x_epargne_dette',
    titre: 'Une dette payée',
    categorie: 'reputation',
    lieu: '$ici',
    si: { statut: ['actif', 'errant', 'deserteur', 'exile'] },
    texte: 'Un soir, sur ton chemin, un paquet t’attend, posé sur une pierre. Dedans, des pilules de soin, une bourse, et un mot d’une écriture maladroite : « On est quittes. » Tu reconnais la cicatrice sur la main de l’homme qui s’éloigne, au loin. Celui que tu as épargné.',
    choix: [
      {
        id: 'accepter',
        texte: 'Accepter, et le regarder partir',
        effets: [{ stat: 'jauges.ryo', delta: 120 }, { stat: 'jauges.sante', delta: 20 }, { ethique: { compassion: 2 } }, { journal: 'Un ennemi que tu avais épargné a payé sa dette.', importance: 2 }],
        resultat: 'Il ne se retourne pas. Toi, tu gardes le mot, plié dans ta veste, plus longtemps que la bourse.',
      },
      {
        id: 'rattraper',
        texte: 'Le rattraper et lui demander qui l’employait',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { charisme: 2, perception: 1 },
          succes: {
            texte: 'Il hésite, puis te donne un nom, un lieu, et un conseil : « Ne va pas là-bas seul·e. » Il ne t’a jamais menti avant ; il ne commence pas maintenant.',
            effets: [{ stat: 'jauges.ryo', delta: 120 }, { stat: 'attributs.perception', delta: 2 }, { indice: 'epargne_informateur' }],
          },
          echec: {
            texte: 'Il te laisse approcher, puis disparaît d’un saut. Il a payé sa dette, pas plus.',
            effets: [{ stat: 'jauges.ryo', delta: 120 }],
          },
        },
      },
    ],
  },
  {
    ...base,
    id: 'x_epargne_vengeance',
    titre: 'Celui qui revient',
    categorie: 'trahison',
    lieu: '$ici',
    si: { statut: ['actif', 'errant', 'deserteur', 'exile'] },
    texte: 'Tu le reconnais à sa façon de se tenir, le poids sur la jambe que tu lui avais brisée. Celui que tu as épargné. Il a passé chaque jour depuis à s’entraîner pour ce moment. « Tu aurais dû finir ce que tu avais commencé. »',
    choix: [
      {
        id: 'combattre',
        texte: 'Finir ce que tu as commencé',
        test: {
          type: 'combat',
          difficulte: 54,
          attributs: { agilite: 1, force: 1, perception: 1 },
          maitrises: { taijutsu: 1, arme: 1 },
          arme: true,
          letal: true,
          manches: 3,
          causeMort: 'tué·e par un ennemi qu’on avait épargné',
          succes: { texte: 'Il s’est entraîné. Toi aussi. Il tombe pour la deuxième fois, et cette fois, il le sait, c’est la dernière où tu auras le choix.', effets: [{ stat: 'social.reputationOmbre', delta: 4 }] },
          echec: { texte: 'Il te laisse en sang dans la poussière. « Maintenant on est quittes. » Il ne t’achève pas. Tu ne sais pas si c’est de la pitié ou du mépris.', effets: [{ blessure: { id: 'vengeance', nom: 'Blessures de la revanche', gravite: 2, jours: 40 } }] },
        },
      },
      {
        id: 'parler',
        texte: 'Baisser ta garde et lui parler',
        test: {
          type: 'competence',
          difficulte: 56,
          attributs: { charisme: 2, controleEmotionnel: 2 },
          succes: {
            texte: 'Tu lui demandes ce qu’il a fait de la vie que tu lui as laissée. Il ouvre la bouche, ne trouve rien. Il range son arme. « La prochaine fois, je ne t’écouterai pas. » Il n’y aura pas de prochaine fois, et vous le savez tous les deux.',
            effets: [{ ethique: { compassion: 5, honneur: 3 } }, { stat: 'attributs.charisme', delta: 2 }],
          },
          echec: {
            texte: 'Il n’est pas venu pour parler. Le premier coup te prend de face, le deuxième par surprise.',
            effets: [{ blessure: { id: 'vengeance_traitre', nom: 'Coup en traître', gravite: 3, jours: 60 } }],
          },
        },
      },
    ],
  },

  // ── Capturé·e ──
  {
    ...base,
    id: 'x_capture',
    planifieParMoteur: true,
    titre: 'Prisonnier·e',
    categorie: 'capture',
    lieu: '$ici',
    si: { statut: 'capture' },
    texte: [
      { texte: 'Une cave, ou une cale : le sol bouge, ou c’est ta tête. Tes poignets sont liés par une corde trempée de chakra qui brûle quand tu tires dessus. Un homme s’assoit en face de toi et pose un couteau sur ses genoux.' },
      { si: VILLAGE_DERRIERE, texte: '« Ton village. Ses patrouilles, ses relèves, ses gens importants. Parle, et tu reverras le soleil. »' },
      { si: { non: VILLAGE_DERRIERE }, texte: '« Personne ne viendra te chercher, tu le sais ? Alors dis-moi ce que tu vaux, et je verrai à qui te vendre. »' },
    ],
    choix: [
      {
        id: 'silence',
        texte: 'Te taire, quoi qu’ils fassent',
        test: {
          type: 'competence',
          difficulte: 52,
          attributs: { controleEmotionnel: 3, force: 1 },
          succes: {
            texte: 'Ils frappent. Tu te tais. Ils recommencent le lendemain, et le jour d’après. Le quatrième soir, l’homme au couteau soupire et sort. Ils se lassent avant toi.',
            effets: [{ blessure: { id: 'interrogatoire', nom: 'Séquelles d’interrogatoire', gravite: 2, jours: 45 } }, { stat: 'attributs.controleEmotionnel', delta: 4 }, { stat: 'social.loyaute', delta: 6 }],
            suite: 'x_capture_nuit',
          },
          echec: {
            texte: 'Le troisième jour, tu parles. Pas beaucoup. Assez. Tu ne sauras jamais ce que ces mots ont coûté, et c’est presque le pire.',
            effets: [{ stat: 'jauges.sante', delta: -15 }, { drapeau: 'a_parle' }, { si: VILLAGE_DERRIERE, alors: [{ stat: 'social.suspicion', delta: 12 }] }, { ethique: { honneur: -4 } }],
            suite: 'x_capture_nuit',
          },
        },
      },
      {
        id: 'rancon',
        texte: 'Proposer de payer ta liberté (150 ryō)',
        si: { stat: 'jauges.ryo', min: 150 },
        verrou: 'Il te faudrait 150 ryō pour acheter ta liberté.',
        effets: [{ stat: 'jauges.ryo', delta: -150 }, ...RETOUR, { stat: 'social.reputationOmbre', delta: 2 }, { journal: 'Tu as acheté ta liberté.', importance: 2 }],
        resultat: 'L’homme au couteau compte les pièces deux fois. Puis il coupe tes liens lui-même. « Rien de personnel. » On te pousse dehors, les yeux bandés, à deux jours de marche de nulle part.',
      },
      {
        id: 'evasion',
        texte: 'Ne rien dire, et guetter la nuit',
        effets: [{ drapeau: 'guette_evasion' }],
        resultat: 'Tu fais semblant d’être plus faible que tu ne l’es. Tu comptes les pas des gardes, les heures de relève, les nœuds de ta corde.',
        suite: 'x_capture_nuit',
      },
    ],
  },
  {
    ...base,
    id: 'x_capture_nuit',
    titre: 'La nuit des captifs',
    categorie: 'capture',
    lieu: '$ici',
    si: { statut: 'capture' },
    texte: 'La nuit. Un seul garde, qui lutte contre le sommeil. Ta corde a du jeu, à force de la frotter contre la pierre. C’est maintenant, ou dans un autre endroit, plus loin, plus profond.',
    choix: [
      {
        id: 'fuir',
        texte: 'Défaire tes liens et fuir',
        test: {
          type: 'competence',
          difficulte: 54,
          attributs: { agilite: 2, discretion: 2 },
          maitrises: { kawarimi: 2 },
          modificateur: 0,
          succes: {
            texte: 'Une bûche à ta place, sous la couverture. Toi, tu es déjà dans les arbres. Tu cours jusqu’à ne plus sentir tes jambes, puis encore un peu.',
            effets: [...RETOUR, { drapeau: 'evade' }, { stat: 'social.reputation', delta: 4 }, { succes: 'evade' }, { journal: 'Tu t’es évadé·e de captivité.', importance: 2 }],
          },
          echec: {
            texte: 'Le garde ne dormait pas. On te ramène par les cheveux. Le lendemain, on t’emmène plus loin, au-delà de toutes les frontières que tu connais.',
            effets: [{ stat: 'jauges.sante', delta: -20 }, { fin: 'capture', cause: 'emmené·e en captivité après une défaite' }],
          },
        },
      },
      {
        id: 'permutation',
        texte: 'Une permutation avec la bûche du foyer, au moment où le garde se retourne',
        si: { maitrise: 'kawarimi', palierMin: 1 },
        verrou: 'Il faudrait connaître la permutation.',
        indice: 'Ta permutation te sort des liens sans les défaire.',
        test: {
          type: 'competence',
          difficulte: 44,
          attributs: { agilite: 2, controleChakra: 1 },
          maitrises: { kawarimi: 3 },
          succes: {
            texte: 'Le garde se retourne vers une bûche ligotée. Toi, tu es déjà derrière lui, puis dehors, puis loin.',
            effets: [...RETOUR, { drapeau: 'evade' }, { succes: 'evade' }, { journal: 'Tu t’es évadé·e de captivité par une permutation.', importance: 2 }],
          },
          echec: {
            texte: 'La corde trempée de chakra brouille ta technique : tu te retrouves à moitié dehors, le garde sur toi. On te ramène, on te frappe, et on t’enchaîne plus solidement.',
            effets: [{ blessure: { id: 'permutation_ratee', nom: 'Coups des gardes', gravite: 2, jours: 30 } }],
            suite: 'x_capture_nuit',
          },
        },
      },
      {
        id: 'secours',
        texte: 'Tenir, et faire confiance à ton village',
        si: VILLAGE_DERRIERE,
        verrou: 'Personne ne viendra te chercher : tu n’as plus de village.',
        effets: [
          {
            hasard: [
              { poids: 60, effets: [{ drapeau: 'secours_venu' }, ...RETOUR, { stat: 'social.loyaute', delta: 8 }, { relation: '@sensei', delta: { attachement: 8 } }] },
              { poids: 40, effets: [{ stat: 'jauges.sante', delta: -20 }, { fin: 'capture', cause: 'des secours qui ne sont jamais venus' }] },
            ],
          },
        ],
        resultat: [
          { si: { drapeau: 'secours_venu' }, texte: 'Le cinquième jour, la porte vole en éclats. Des bandeaux de ton village, des visages durs, et {@sensei} qui te soulève sans un mot. Le village n’abandonne pas les siens. Pas cette fois.' },
          { si: { non: { drapeau: 'secours_venu' } }, texte: 'Tu attends. Un jour, dix, trente. Personne ne vient. Un matin, on te met dans une charrette, vers une frontière dont tu ne connais pas le nom.' },
        ],
      },
      {
        id: 'retourner',
        texte: 'Parler au garde, toute la nuit, jusqu’à le retourner',
        test: {
          type: 'competence',
          difficulte: 58,
          attributs: { charisme: 3, intellect: 1 },
          succes: {
            texte: 'Il a ton âge, une mère malade, et aucune envie d’être là. À l’aube, il coupe ta corde et s’en va dans l’autre sens. Vous ne vous reverrez jamais.',
            effets: [...RETOUR, { stat: 'attributs.charisme', delta: 3 }, { ethique: { compassion: 3 } }],
          },
          echec: {
            texte: 'Il écoute. Puis il appelle les autres. Tu passes le reste de la nuit à regretter d’avoir parlé.',
            effets: [{ blessure: { id: 'captivite', nom: 'Coups de captivité', gravite: 2, jours: 30 } }, { fin: 'capture', cause: 'trahi·e par un garde qu’on croyait convaincre' }],
          },
        },
      },
    ],
  },
];
