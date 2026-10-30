import type { Condition, EventDef } from '../../engine/types';

/**
 * Des conversations qui ont une histoire : chacune laisse un souvenir (drapeau « dl_… » et souvenir sur la fiche
 * du personnage), et une conversation des années plus tard s'en souvient. Elles passent par le moteur d'événements
 * habituel : conditions d'âge, de rang, de village, de clan, de relation ; réponses ; conséquences.
 *
 * Les personnages sont ceux de la partie : {@coequipierA} (l'ami d'enfance), {@coequipierB}, {@sensei}, {@rival}.
 * Les voix des villages (Jinpachi, Sahira, Daichi…) sont des rencontres : on s'en souvient par drapeau.
 */
const TOUS = [1, 2, 3, 4, 5, 6];
const ACTIF: Condition = { statut: 'actif' };
const VIVANT = (role: string): Condition => ({ pnj: role, etat: ['vivant', 'blesse'] });
const base = { chapitre: 1, chapitres: TOUS };

export const CONVERSATIONS: EventDef[] = [
  // ── A. Deux enfants après les cours ──
  {
    ...base,
    id: 'dl_pierre',
    titre: 'Une pierre qui ressemble à un ninja',
    arc: 'origines',
    categorie: 'amitie',
    lieu: '$village',
    poids: 14,
    si: { tout: [ACTIF, VIVANT('@coequipierA'), { age: { min: 7, max: 9 } }] },
    texte: [
      { texte: '« Hé ! Attends-moi ! Tu marches toujours trop vite. » {@coequipierA} te rattrape en courant, les joues rouges. « C’est toi qui traînes », tu réponds. « C’est faux. J’ai juste ramassé un truc. Regarde ! » Dans sa paume sale, une pierre grise, à peine plus grosse qu’un œuf.' },
      { si: { village: 'konoha' }, texte: '« Je l’ai trouvée près du monument des Hokage. Elle ressemble à une tête de ninja. » Tu la regardes. « Elle ressemble surtout à une patate. »' },
      { si: { non: { village: 'konoha' } }, texte: '« Je l’ai trouvée sous les fenêtres du bureau du {kage}. Elle ressemble à une tête de ninja. » Tu la regardes. « Elle ressemble surtout à une patate. »' },
      { texte: '« Tu n’as aucun goût. » {Il:@coequipierA} la serre contre {lui:@coequipierA} comme un trésor. « Je vais la garder quand même. Quand je serai {kage}, je la mettrai dans mon bureau. »' },
    ],
    choix: [
      {
        id: 'conseiller',
        texte: '« Alors je serai ton premier conseiller. »',
        effets: [
          { relation: '@coequipierA', delta: { amitie: 8, attachement: 4 } },
          { drapeau: 'dl_pierre', valeur: 'conseiller' },
          { souvenir: 'Tu lui as promis d’être son premier conseiller, le jour de la pierre.', pnj: '@coequipierA' },
        ],
        resultat: '{@coequipierA} s’arrête net, comme si tu venais de signer un traité. « Promis ? » « Promis. » Vous rentrez en vous disputant déjà sur la couleur des rideaux du bureau.',
      },
      {
        id: 'moquer',
        texte: '« Tu n’arriveras même pas à devenir genin. »',
        effets: [
          { relation: '@coequipierA', delta: { rivalite: 8, hostilite: 3, amitie: -2 } },
          { drapeau: 'dl_pierre', valeur: 'moquerie' },
          { souvenir: 'Le jour de la pierre, ton rire a blessé son rêve.', pnj: '@coequipierA' },
        ],
        resultat: '{@coequipierA} ne répond rien. {Il:@coequipierA} range la pierre dans sa poche, et marche devant toi tout le reste du chemin, assez vite pour que tu doives courir. Tu ne sais pas encore que ce genre de phrase reste.',
      },
      {
        id: 'chance',
        texte: '« Garde-la. Elle te portera peut-être chance. »',
        effets: [
          { relation: '@coequipierA', delta: { amitie: 5, confiance: 4 } },
          { drapeau: 'dl_pierre', valeur: 'chance' },
          { souvenir: 'Tu lui as dit que sa pierre lui porterait chance.', pnj: '@coequipierA' },
        ],
        resultat: '« Tu crois ? » {@coequipierA} la frotte contre sa manche, très sérieusement, pour la rendre plus brillante. Elle ne brille pas. Ça n’a aucune importance.',
      },
    ],
  },

  // ── Le ravin : la première mission, et le choix qu'on n'oublie pas ──
  {
    ...base,
    id: 'dl_ravin',
    titre: 'Le ravin',
    arc: 'premieres_missions',
    categorie: 'mission',
    lieu: '$ici',
    poids: 10,
    si: { tout: [ACTIF, VIVANT('@coequipierA'), { rang: 'genin' }, { age: { min: 12, max: 15 } }, { nonVu: 'dl_ravin' }] },
    texte: '{@sensei} vous a séparés pour couvrir plus de terrain. Le rouleau est dans ta sacoche, le point de rendez-vous à une heure de course. Derrière toi, un craquement, un cri, puis plus rien. Tu te retournes : le bord du ravin s’est effondré. En bas, sur une corniche, {@coequipierA} se tient la jambe. {Il:@coequipierA} lève les yeux vers toi et ne dit rien. Au loin, des voix approchent : ceux qui veulent le rouleau.',
    choix: [
      {
        id: 'demi_tour',
        texte: 'Faire demi-tour et descendre {le:@coequipierA} chercher',
        effets: [
          { relation: '@coequipierA', delta: { dette: 15, attachement: 10, confiance: 8, amitie: 4 } },
          { relation: '@sensei', delta: { respect: 2, confiance: -2 } },
          { blessure: { id: 'ravin', nom: 'Écorchures du ravin', gravite: 1, jours: 12 } },
          { drapeau: 'dl_ravin', valeur: 'sauve' },
          { souvenir: 'Tu as fait demi-tour au ravin, pendant votre première mission.', pnj: '@coequipierA' },
          { ethique: { compassion: 4, honneur: 2 } },
        ],
        resultat: 'Tu poses le rouleau sous une pierre et tu descends. La paroi s’effrite sous tes doigts. Quand tu arrives sur la corniche, {@coequipierA} te regarde comme si tu avais perdu la tête. « Tu devais continuer. » « Tais-toi et accroche-toi. » La remontée prend une éternité. Le rouleau est toujours sous sa pierre ; les voix sont passées à côté. {@sensei} ne dit rien en vous voyant arriver en retard, couverts de terre. {Il:@sensei} regarde seulement la jambe de {@coequipierA}, puis tes mains en sang, longtemps.',
      },
      {
        id: 'continuer',
        texte: 'Continuer : la mission d’abord, on reviendra {le:@coequipierA} chercher',
        effets: [
          { relation: '@coequipierA', delta: { hostilite: 8, confiance: -10, attachement: -4 } },
          { relation: '@sensei', delta: { respect: 3 } },
          { stat: 'social.reputation', delta: 2 },
          { drapeau: 'dl_ravin', valeur: 'laisse' },
          { souvenir: 'Au ravin, tu as choisi le rouleau plutôt que de redescendre.', pnj: '@coequipierA' },
          { ethique: { ambition: 3, compassion: -3 } },
        ],
        resultat: '« Je reviens », tu cries. Tu ne sais pas si {il:@coequipierA} t’a entendu·e. Tu cours. Le rouleau arrive au rendez-vous à l’heure. L’équipe qui retourne au ravin trouve {@coequipierA} vivant{e:@coequipierA}, la jambe bandée avec sa propre manche. {Il:@coequipierA} remercie tout le monde, poliment. Toi, {il:@coequipierA} ne te regarde pas.',
      },
      {
        id: 'signal',
        texte: 'Lancer un signal à {@sensei}, et garder la position au bord du ravin',
        effets: [
          { relation: '@coequipierA', delta: { confiance: 5, dette: 5 } },
          { relation: '@sensei', delta: { confiance: 5, respect: 2 } },
          { drapeau: 'dl_ravin', valeur: 'signal' },
          { souvenir: 'Au ravin, tu as gardé le bord et appelé de l’aide.', pnj: '@coequipierA' },
        ],
        resultat: 'La fusée de signal monte dans le ciel blanc. Tu t’accroupis au bord du ravin, un kunai dans chaque main, et tu attends les voix. Elles arrivent avant {@sensei}. Tu te bats seul·e pendant une minute qui dure une heure. Puis {@sensei} est là, et c’est fini. En bas, {@coequipierA} a tout entendu.',
      },
    ],
  },

  // ── C. Une dispute entre coéquipiers ──
  {
    ...base,
    id: 'dl_dispute',
    titre: 'On a eu de la chance',
    arc: 'premieres_missions',
    categorie: 'amitie',
    lieu: '$village',
    poids: 10,
    si: { tout: [ACTIF, VIVANT('@coequipierA'), VIVANT('@coequipierB'), { rang: ['genin', 'chunin'] }, { age: { min: 13, max: 16 } }] },
    texte: 'Retour de mission. Vous n’êtes pas encore arrivés à la porte que {@coequipierB} explose. « Tu aurais pu nous prévenir avant de foncer ! » « J’ai vu une ouverture. » « Une ouverture ? {@sensei} a failli se prendre ton kunai dans le dos ! » {@coequipierA} lève les mains. « Arrêtez. On est rentrés, c’est l’essentiel. » « C’est justement ça le problème, coupe {@coequipierB}. On a eu de la chance. La prochaine fois, quelqu’un ne rentrera peut-être pas. »',
    choix: [
      {
        id: 'erreur',
        texte: 'Reconnaître ton erreur',
        effets: [{ relation: '@coequipierB', delta: { respect: 6, confiance: 5 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'dl_dispute', valeur: 'erreur' }],
        resultat: '« Tu as raison. J’aurais dû prévenir. » {@coequipierB} ouvre la bouche pour continuer, puis la referme. {Il:@coequipierB} ne s’attendait pas à ça. « Bon. » Un silence. « La prochaine fois, un signe de la main. C’est tout ce que je demande. »',
      },
      {
        id: 'hesite',
        texte: 'Lui reprocher d’avoir hésité',
        effets: [{ relation: '@coequipierB', delta: { hostilite: 6, rivalite: 6, confiance: -4 } }, { drapeau: 'dl_dispute', valeur: 'reproche' }],
        resultat: '« Si tu n’avais pas hésité, je n’aurais pas eu besoin de foncer. » Le visage de {@coequipierB} se ferme d’un coup. « D’accord. » Ce soir-là, {il:@coequipierB} mange seul{e:@coequipierB}. Le lendemain aussi.',
      },
      {
        id: 'excuses',
        texte: 'Présenter des excuses à toute l’équipe',
        effets: [{ relation: '@coequipierB', delta: { confiance: 4, amitie: 3 } }, { relation: '@coequipierA', delta: { amitie: 3 } }, { relation: '@sensei', delta: { respect: 4 } }, { drapeau: 'dl_dispute', valeur: 'excuses' }],
        resultat: 'Tu t’arrêtes au milieu du chemin et tu t’inclines, devant eux trois. {@sensei}, qui marchait devant sans rien dire, ralentit. Juste un peu.',
      },
      {
        id: 'demander',
        texte: 'Demander à {@coequipierA} ce qu’{il:@coequipierA} en pense',
        effets: [{ relation: '@coequipierA', delta: { confiance: 3 } }, { relation: '@coequipierB', delta: { respect: -2 } }, { drapeau: 'dl_dispute', valeur: 'arbitre' }],
        resultat: '{@coequipierA} soupire, longuement. « Je pense que vous avez raison tous les deux, et que je veux manger. » {@coequipierB} lève les yeux au ciel. La tension retombe, sans être réglée.',
      },
      {
        id: 'partir',
        texte: 'Partir sans répondre',
        effets: [{ relation: '@coequipierB', delta: { hostilite: 4, confiance: -6 } }, { relation: '@coequipierA', delta: { confiance: -2 } }, { drapeau: 'dl_dispute', valeur: 'fuite' }],
        resultat: 'Tu les dépasses sans un mot. Derrière toi, la voix de {@coequipierB} : « Voilà. Exactement ça. » Tu ne te retournes pas. La fracture ne se voit pas encore ; elle est là.',
      },
    ],
  },

  // ── D. Un sensei et son élève ──
  {
    ...base,
    id: 'dl_sensei',
    titre: 'Tu as changé',
    arc: 'formation',
    categorie: 'entrainement',
    lieu: '$terrain',
    poids: 10,
    si: { tout: [ACTIF, VIVANT('@sensei'), { age: { min: 15, max: 18 } }] },
    texte: [
      { si: { pnj: '@sensei', etat: 'blesse' }, texte: '{@sensei} est assis{e:@sensei} sur la souche du terrain d’entraînement, la jambe encore bandée. {Il:@sensei} te regarde frapper le poteau depuis une heure.' },
      { si: { pnj: '@sensei', etat: 'vivant' }, texte: '{@sensei} t’observe frapper le poteau depuis une heure, adossé{e:@sensei} à un arbre, sans rien dire.' },
      { texte: '« Tu as changé depuis ton entrée à l’Académie. » « C’est censé être un compliment ? » « Je n’ai pas encore décidé. Tu progresses vite, mais tu confonds parfois vitesse et précipitation. »' },
      { si: { relation: '@sensei', axe: 'confiance', max: 5 }, texte: '« Je te l’ai déjà dit. Tu n’écoutes pas. Un jour, ça coûtera plus qu’un poteau. »' },
    ],
    choix: [
      {
        id: 'piquer',
        texte: '« Et vous, vous avez toujours une remarque à faire. »',
        effets: [{ relation: '@sensei', delta: { respect: 2, amitie: 2 } }, { drapeau: 'dl_sensei', valeur: 'pique' }],
        resultat: '« C’est mon travail. » Un sourire, rare. « Le jour où je n’aurai plus rien à t’apprendre, j’espère que tu seras assez intelligent·e pour ne plus avoir besoin de moi. »',
      },
      {
        id: 'ecouter',
        texte: '« Montrez-moi la différence. »',
        effets: [{ relation: '@sensei', delta: { confiance: 6, respect: 3 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'dl_sensei', valeur: 'ecoute' }],
        resultat: '{@sensei} se lève, prend ta place devant le poteau, et frappe une seule fois, lentement. Le poteau se fend jusqu’au sol. « Voilà la différence. La vitesse, c’est quand tu arrives vite. La précipitation, c’est quand tu pars trop tôt. »',
      },
      {
        id: 'blessure',
        si: { pnj: '@sensei', etat: 'blesse' },
        texte: '« Et votre jambe ? Ça, c’était de la précipitation ? »',
        effets: [{ relation: '@sensei', delta: { respect: 4, amitie: 4, confiance: 2 } }, { drapeau: 'dl_sensei', valeur: 'jambe' }],
        resultat: '{@sensei} te fixe longtemps. Puis éclate de rire, pour la première fois depuis que tu {le:@sensei} connais. « Non. Ça, c’était quelqu’un qui croyait avoir le temps. Retiens ça aussi. »',
      },
    ],
  },

  // ── B. La pierre, des années plus tard ──
  {
    ...base,
    id: 'dl_pierre_souvenir',
    titre: 'La pierre',
    chapitre: 3,
    arc: 'heritage',
    categorie: 'amitie',
    lieu: '$village',
    poids: 12,
    si: { tout: [ACTIF, VIVANT('@coequipierA'), { vu: 'dl_pierre' }, { age: { min: 19, max: 30 } }] },
    texte: [
      { si: { drapeau: 'dl_pierre', egal: 'moquerie' }, texte: 'Vous vous croisez devant le bureau des missions. {@coequipierA} s’arrête. « Tu te moquais toujours de moi, quand on était petits. » « Tu étais ridicule. » « Peut-être. » {Il:@coequipierA} sort de sa poche une pierre grise, polie par les années. « Mais au moins, j’avais des rêves. J’ai parfois l’impression que tu as oublié les tiens. »' },
      { si: { non: { drapeau: 'dl_pierre', egal: 'moquerie' } }, texte: 'Un soir, sur le toit où vous montiez enfants, {@coequipierA} sort quelque chose de sa poche. « Tu te rappelles cette pierre ? » « Celle qui ressemblait à une patate ? » « Exactement. Je l’ai toujours. »' },
      { si: { drapeau: 'dl_pierre', egal: 'conseiller' }, texte: '« Je crois que je l’ai gardée parce que tu étais la seule personne à rire de mes rêves sans me demander d’y renoncer. Et puis tu m’avais promis quelque chose. Premier conseiller. Je n’ai pas oublié. »' },
      { si: { drapeau: 'dl_pierre', egal: 'chance' }, texte: '« Tu m’avais dit qu’elle me porterait chance. Je l’avais sur moi à chaque mission. Je suis toujours là. Alors peut-être que tu avais raison. »' },
    ],
    choix: [
      {
        id: 'tenir',
        texte: 'Prendre la pierre dans ta main, un moment, puis la lui rendre',
        effets: [{ relation: '@coequipierA', delta: { attachement: 6, amitie: 4 } }, { souvenir: 'Des années après, la pierre était toujours dans sa poche.', pnj: '@coequipierA' }],
        resultat: 'Elle est tiède de sa poche. Elle ressemble toujours à une patate. Tu la lui rends, et vous restez là jusqu’à ce que les lampes du village s’éteignent une à une.',
      },
      {
        id: 'excuse',
        si: { drapeau: 'dl_pierre', egal: 'moquerie' },
        texte: '« J’avais tort. Je m’excuse. Vingt ans trop tard, mais je m’excuse. »',
        effets: [{ relation: '@coequipierA', delta: { hostilite: -8, amitie: 8, respect: 4 } }, { drapeau: 'dl_pierre_excuse' }],
        resultat: '{@coequipierA} te regarde, surpris{e:@coequipierA}. Puis {il:@coequipierA} rit, un rire un peu cassé. « Vingt ans. Tu as toujours été lent{e} pour les choses importantes. » Pour la première fois depuis longtemps, {il:@coequipierA} marche à côté de toi, pas devant.',
      },
      {
        id: 'esquiver',
        texte: 'Changer de sujet',
        effets: [{ relation: '@coequipierA', delta: { attachement: -3 } }],
        resultat: 'Tu parles de la prochaine mission, des rumeurs, du temps. {@coequipierA} remet la pierre dans sa poche sans rien dire. Certaines portes ne se rouvrent pas deux fois.',
      },
    ],
  },

  // ── Le ravin, des années plus tard ──
  {
    ...base,
    id: 'dl_ravin_souvenir',
    titre: 'Ce jour-là, au ravin',
    chapitre: 3,
    arc: 'heritage',
    categorie: 'amitie',
    lieu: '$village',
    poids: 12,
    si: { tout: [ACTIF, VIVANT('@coequipierA'), { vu: 'dl_ravin' }, { age: { min: 19, max: 32 } }] },
    texte: [
      { si: { drapeau: 'dl_ravin', egal: 'sauve' }, texte: 'Une veillée funèbre, pour un camarade que vous connaissiez à peine. Dehors, {@coequipierA} te tend une tasse. « Tu te souviens du ravin, pendant notre première mission ? J’avais déjà accepté l’idée de ne jamais rentrer. Toi, tu as fait demi-tour. » {Il:@coequipierA} regarde sa tasse. « Je ne te l’ai jamais vraiment dit, mais je crois que c’est ce jour-là que j’ai décidé de rester à tes côtés. »' },
      { si: { drapeau: 'dl_ravin', egal: 'laisse' }, texte: 'Une veillée funèbre, pour un camarade que vous connaissiez à peine. Dehors, {@coequipierA} reste à distance, puis s’approche. « Je me suis souvent demandé si tu avais regretté de m’avoir laissé{e:@coequipierA} là-bas. » Un silence. « Moi, je n’ai jamais oublié. »' },
      { si: { drapeau: 'dl_ravin', egal: 'signal' }, texte: 'Une veillée funèbre, pour un camarade que vous connaissiez à peine. Dehors, {@coequipierA} te rejoint. « Le ravin. Je t’entendais te battre, au-dessus. Je ne voyais rien, j’entendais seulement. Je n’ai jamais eu aussi peur pour quelqu’un d’autre que moi. »' },
    ],
    choix: [
      {
        id: 'sincere',
        texte: 'Lui dire ce que tu as ressenti ce jour-là, sans rien arranger',
        effets: [{ relation: '@coequipierA', delta: { confiance: 6, attachement: 4 } }, { souvenir: 'Vous avez enfin parlé du ravin, des années après.', pnj: '@coequipierA' }],
        resultat: 'Tu racontes la paroi, les voix, le rouleau dans ta sacoche, et ce que tu as pensé à la seconde où tu as dû choisir. {@coequipierA} écoute jusqu’au bout. Quand tu as fini, {il:@coequipierA} hoche la tête. Ce n’est pas un pardon, ni un merci. C’est mieux : c’est quelqu’un qui sait.',
      },
      {
        id: 'regret',
        si: { drapeau: 'dl_ravin', egal: 'laisse' },
        texte: '« Oui. Je l’ai regretté. Chaque fois que j’ai porté un rouleau depuis. »',
        effets: [{ relation: '@coequipierA', delta: { hostilite: -10, confiance: 8 } }, { drapeau: 'dl_ravin_pardon' }],
        resultat: '{@coequipierA} ferme les yeux. « J’avais besoin de l’entendre. Pas de te pardonner. Juste de l’entendre. » {Il:@coequipierA} pose la main sur ton épaule, une seconde, et rentre.',
      },
      {
        id: 'mission',
        texte: '« C’était la mission. Tu aurais fait pareil. »',
        effets: [{ relation: '@coequipierA', delta: { respect: 2, attachement: -4 } }],
        resultat: '« Peut-être. » {@coequipierA} finit sa tasse. « C’est ce qui me fait peur, justement. »',
      },
    ],
  },

  // ── E. Un ancien rival, devenu jōnin ──
  {
    ...base,
    id: 'dl_rival_rapport',
    titre: 'Une décision difficile',
    chapitre: 3,
    arc: 'conflit',
    categorie: 'rivalite',
    lieu: '$village',
    poids: 10,
    si: { tout: [ACTIF, VIVANT('@rival'), { rangMin: 'jonin' }, { age: { min: 21, max: 30 } }, { nonVu: 'dl_rival_rapport' }] },
    texte: '{@rival} t’attend à la sortie de la salle du conseil, un rouleau à la main. « Je viens de lire ton rapport. Trois ennemis neutralisés, aucun blessé dans ton équipe. Tu as toujours cette manie de vouloir tout contrôler. » « Tu aurais préféré que je les laisse mourir ? » « Non. Je voulais simplement savoir si tu étais encore capable de prendre une décision difficile. » « Tu veux vraiment parler de décisions difficiles ? » {Il:@rival} roule le rapport, lentement. « Un jour, on devra régler cette histoire. Pas pendant une réunion du conseil. Pas devant nos supérieurs. Juste toi et moi. »',
    choix: [
      {
        id: 'duel',
        texte: '« Pourquoi pas ce soir ? Le vieux terrain d’entraînement. »',
        effets: [{ relation: '@rival', delta: { respect: 6, rivalite: 6 } }, { drapeau: 'dl_rival', valeur: 'duel' }, { planifier: 'dl_rival_duel', dansJours: 1 }],
        resultat: '{@rival} sourit, pour la première fois depuis des années. Un vrai sourire, presque celui de l’enfant que tu as connu. « Ce soir. »',
      },
      {
        id: 'paix',
        texte: '« Il n’y a rien à régler. On n’est plus des gamins. »',
        effets: [{ relation: '@rival', delta: { rivalite: -6, amitie: 4, respect: -2 } }, { drapeau: 'dl_rival', valeur: 'paix' }],
        resultat: '{@rival} te regarde comme on regarde une porte qui se ferme. « Si tu le dis. » Puis, plus bas, en s’éloignant : « Tu me manques, comme adversaire. »',
      },
      {
        id: 'plus_tard',
        texte: '« Un jour, oui. Quand ça comptera vraiment. »',
        effets: [{ relation: '@rival', delta: { rivalite: 8, respect: 4 } }, { drapeau: 'dl_rival', valeur: 'promis' }],
        resultat: '« Alors ne meurs pas avant. » {@rival} te tourne le dos. C’est sa façon à {lui:@rival} de dire qu’{il:@rival} tient à toi.',
      },
    ],
  },
  {
    ...base,
    id: 'dl_rival_duel',
    titre: 'Juste toi et moi',
    chapitre: 3,
    arc: 'conflit',
    categorie: 'rivalite',
    lieu: '$terrain',
    enchaine: true,
    si: { tout: [ACTIF, VIVANT('@rival'), { drapeau: 'dl_rival', egal: 'duel' }] },
    texte: 'Le vieux terrain d’entraînement, celui de l’Académie. Les poteaux portent encore vos entailles d’enfants. {@rival} est déjà là, sans gilet, sans bandeau. « Pas de techniques interdites. Pas de témoins. Pas de rancune après. » Tu hoches la tête. Vous vous mettez en garde, comme à dix ans.',
    choix: [
      {
        id: 'tout',
        texte: 'Te battre avec tout ce que tu as',
        test: {
          type: 'combat',
          difficulte: 64,
          attributs: { agilite: 2, force: 1, perception: 1 },
          maitrises: { taijutsu: 2, ninjutsu: 1 },
          succes: {
            texte: 'Quand {@rival} touche le sol pour la dernière fois, {il:@rival} reste allongé{e:@rival}, à regarder le ciel. « Bien. » Tu t’assois à côté. Vous ne dites rien pendant longtemps. Puis {il:@rival} rit. « Encore un match. Dans dix ans. »',
            effets: [{ relation: '@rival', delta: { respect: 10, amitie: 6, hostilite: -6 } }, { drapeau: 'dl_rival', valeur: 'regle_victoire' }, { souvenir: 'Vous avez réglé votre histoire au vieux terrain. Tu as gagné.', pnj: '@rival' }],
          },
          echec: {
            texte: 'Tu te retrouves dans la poussière, {@rival} au-dessus de toi. {Il:@rival} te tend la main. « Tu as hésité, à la fin. Pourquoi ? » Tu prends sa main. Tu ne réponds pas. Vous savez tous les deux.',
            effets: [{ relation: '@rival', delta: { respect: 6, amitie: 6, hostilite: -6 } }, { drapeau: 'dl_rival', valeur: 'regle_defaite' }, { souvenir: 'Vous avez réglé votre histoire au vieux terrain. Tu as perdu.', pnj: '@rival' }],
          },
        },
      },
      {
        id: 'baisser',
        texte: 'Baisser les mains : vous n’avez plus dix ans',
        effets: [{ relation: '@rival', delta: { respect: -4, amitie: 3, rivalite: -4 } }, { drapeau: 'dl_rival', valeur: 'renonce' }],
        resultat: 'Tu laisses retomber tes mains. {@rival} reste en garde un long moment, puis baisse les siennes. « Tu as changé. » Tu ne sais pas si c’est un reproche. {Il:@rival} non plus, peut-être. Vous rentrez ensemble, sans parler, jusqu’à la porte du quartier.',
      },
    ],
  },

  // ── F à H. Les voix des villages ──
  {
    ...base,
    id: 'dl_kiri_jinpachi',
    titre: 'Le silence et la paix',
    arc: 'conflit',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 8,
    si: { tout: [ACTIF, { village: 'kiri' }, { age: { min: 16, max: 22 } }] },
    texte: 'Sur la jetée, dans la brume du matin, un garçon de ton âge recoud un filet. Jinpachi, de l’équipe d’à côté ; on dit qu’il a passé l’examen la dernière année où l’on se battait encore à mort. « À Kiri, on apprend très tôt à ne pas confondre le silence et la paix. » « Tu parles de ton village ? » « Je parle des gens qui sourient pendant qu’ils calculent combien de temps tu mettras à couler. »',
    choix: [
      {
        id: 'regret',
        texte: '« Tu regrettes d’être devenu ninja ? »',
        effets: [{ ethique: { compassion: 2 } }, { drapeau: 'dl_jinpachi', valeur: 'regret' }],
        resultat: '« Je regrette certaines choses que j’ai faites pour le devenir. Ce n’est pas pareil. » Il passe l’aiguille dans la maille, serre. « Toi, tu es né·e après. Tu as de la chance. Ne la gaspille pas à imiter ceux d’avant. »',
      },
      {
        id: 'nom',
        texte: '« Je ne t’ai jamais demandé ton vrai nom, en fait. »',
        effets: [{ drapeau: 'dl_jinpachi', valeur: 'nom' }, { stat: 'social.reputation', delta: 1 }],
        resultat: '« Tu veux connaître mon nom ? Commence par me montrer que tu ne vas pas t’en servir contre moi. » Puis, après un moment, sans lever les yeux : « Jinpachi. C’est le vrai. Ne le dis à personne. » Tu comprends que c’est un cadeau.',
      },
      {
        id: 'brume',
        texte: 'Regarder la brume avec lui, sans rien dire',
        effets: [{ stat: 'attributs.controleEmotionnel', delta: 1 }, { drapeau: 'dl_jinpachi', valeur: 'silence' }],
        resultat: '« La brume cache les chemins, dit-il au bout d’un moment. Elle cache aussi les gens qui ont peur de les prendre. » Vous restez là jusqu’à ce qu’elle se lève. Notre village a changé, pense-t-il sans doute. Les souvenirs, eux, ne changent pas aussi facilement.',
      },
    ],
  },
  {
    ...base,
    id: 'dl_suna_sahira',
    titre: 'Ce que le désert ne pardonne pas',
    chapitre: 3,
    arc: 'conflit',
    categorie: 'mission',
    lieu: '$village',
    poids: 8,
    si: { tout: [ACTIF, { village: 'suna' }, { age: { min: 22, max: 32 } }] },
    texte: 'Une halte entre deux dunes, pendant une escorte de caravane. Sahira, ta coéquipière pour la saison, vide sa gourde d’une seule gorgée, puis la regarde, vide. « Le désert ne pardonne pas les décisions prises trop vite. » « Pourtant, tu fonces toujours la première. » « Parce que je sais exactement quand il faut arrêter de réfléchir. » « Et si tu te trompes ? »',
    choix: [
      {
        id: 'ramener',
        texte: 'Attendre sa réponse',
        effets: [{ drapeau: 'dl_sahira', valeur: 'promesse' }, { ethique: { honneur: 2 } }],
        resultat: '« Alors j’espère que tu seras assez proche pour me ramener. » Elle te tend sa gourde vide. Tu la remplis à moitié avec la tienne. « Ici, on ne promet pas de revenir, dit-elle. On promet de faire tout ce qui est possible pour y arriver. » Tu promets.',
      },
      {
        id: 'eau',
        texte: '« Tu gaspilles ton eau comme si le désert allait te pardonner. »',
        effets: [{ drapeau: 'dl_sahira', valeur: 'eau' }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: 'Elle éclate de rire. « C’est ma phrase, ça. C’est ma mère qui me la disait. » Elle range la gourde. « Tu as raison. Tu as toujours raison, c’est fatigant. » Le reste du trajet, elle boit à petites gorgées, en te regardant chaque fois.',
      },
      {
        id: 'marionnettes',
        texte: 'Lui parler des marionnettistes qui ont escorté la dernière caravane',
        effets: [{ drapeau: 'dl_sahira', valeur: 'marionnettes' }],
        resultat: '« Une marionnette ne tremble pas, dit-elle en regardant l’horizon. Celui qui la contrôle, en revanche, peut trembler toute sa vie. » Tu ne sais pas de qui elle parle. Tu ne demandes pas.',
      },
    ],
  },
  {
    ...base,
    id: 'dl_kumo_daichi',
    titre: 'Pour ne jamais dépendre',
    chapitre: 3,
    arc: 'conflit',
    categorie: 'entrainement',
    lieu: '$terrain',
    poids: 8,
    si: { tout: [ACTIF, { village: 'kumo' }, { age: { min: 26, max: 38 } }] },
    texte: 'Au sommet de l’escalier des mille marches, Daichi t’attend, en sueur, une pierre de meule sur les épaules. Il la pose. « Tu sais pourquoi les gens de Kumo s’entraînent si durement ? » « Pour devenir plus forts ? » « Pour ne jamais dépendre de quelqu’un qui ne serait pas capable de nous relever. »',
    choix: [
      {
        id: 'amitie',
        texte: '« C’est une drôle de façon de parler de l’amitié. »',
        effets: [{ drapeau: 'dl_daichi', valeur: 'amitie' }, { ethique: { compassion: 1 } }],
        resultat: '« Non. C’est justement parce que je prends l’amitié au sérieux. » Il te jette la pierre de meule ; tu la rattrapes, de justesse. « Si tu veux me dépasser, ne me demande pas de ralentir. »',
      },
      {
        id: 'equipe',
        texte: '« Un combat gagné seul ne prouve pas qu’on sait protéger une équipe. »',
        effets: [{ drapeau: 'dl_daichi', valeur: 'equipe' }, { stat: 'social.reputation', delta: 1 }],
        resultat: 'Il te dévisage, puis hoche la tête lentement. « Ça, c’est une phrase de Kumo. » Il reprend sa pierre. « La foudre ne prévient pas. C’est à toi d’apprendre à la lire. Et à lire ceux qui sont à côté de toi. »',
      },
      {
        id: 'monter',
        texte: 'Prendre la pierre et redescendre les mille marches avec',
        effets: [{ drapeau: 'dl_daichi', valeur: 'pierre' }, { stat: 'attributs.force', delta: 1 }, { stat: 'jauges.fatigue', delta: 20 }],
        resultat: 'Tu descends. Tu remontes. En haut, Daichi a disparu ; il a laissé un mot sous une pierre plus petite : « Pas mal. Demain, deux. »',
      },
    ],
  },
  {
    ...base,
    id: 'dl_iwa_ancien',
    titre: 'La pierre ne cède pas',
    chapitre: 3,
    arc: 'conflit',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 8,
    si: { tout: [ACTIF, { village: 'iwa' }, { age: { min: 20, max: 40 } }] },
    texte: 'Un vieux soldat de la Grande Guerre, le bras gauche coupé au coude, t’observe donner des ordres à une équipe de jeunes genin. Quand ils sont partis, il s’approche. « La pierre ne cède pas parce qu’on lui crie dessus. » « Vous trouvez que je crie ? » « Je trouve que tu veux qu’ils t’obéissent. Ce n’est pas la même chose que vouloir qu’ils reviennent. »',
    choix: [
      {
        id: 'commander',
        texte: '« Comment on apprend à commander, alors ? »',
        effets: [{ drapeau: 'dl_iwa', valeur: 'commander' }, { stat: 'attributs.intellect', delta: 1 }],
        resultat: '« Tu veux commander des hommes ? Apprends d’abord à porter leurs erreurs. » Il frotte son moignon, par habitude. « On nous apprend à tenir une position. Personne ne nous apprend à accepter de l’abandonner. Ça, tu l’apprendras seul, et tu le paieras cher. »',
      },
      {
        id: 'bras',
        texte: 'Lui demander où il a perdu son bras',
        effets: [{ drapeau: 'dl_iwa', valeur: 'bras' }, { ethique: { compassion: 2 } }],
        resultat: '« En tenant une position qu’il aurait fallu abandonner. » Il sourit sans joie. « Mon capitaine criait très fort. »',
      },
    ],
  },
  {
    ...base,
    id: 'dl_konoha_monument',
    titre: 'Les noms gravés',
    arc: 'formation',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 8,
    si: { tout: [ACTIF, { village: 'konoha' }, { age: { min: 14, max: 26 } }] },
    texte: 'Devant la stèle des héros, une vieille femme dépose des fleurs. Elle remarque que tu lis les noms. « La stèle est pleine de noms. Certains avaient ton âge quand ils ont été gravés. » Elle se redresse, avec peine. « On parle souvent de la Volonté du Feu. Pourtant, personne ne nous explique vraiment comment la garder quand on a perdu quelqu’un. »',
    choix: [
      {
        id: 'liens',
        texte: '« Peut-être en restant avec ceux qui restent. »',
        effets: [{ drapeau: 'dl_monument', valeur: 'liens' }, { ethique: { compassion: 2 } }],
        resultat: 'Elle te regarde, longtemps. « Tu peux devenir le meilleur ninja du village. Mais si personne ne veut se battre à tes côtés, tu n’auras pas gagné grand-chose. » Elle te donne une fleur, et part.',
      },
      {
        id: 'force',
        texte: '« En devenant assez fort·e pour que ça n’arrive plus. »',
        effets: [{ drapeau: 'dl_monument', valeur: 'force' }, { ethique: { ambition: 2 } }],
        resultat: '« C’est ce que disait mon fils. » Elle touche un nom sur la pierre, du bout des doigts. Elle n’a pas besoin de dire lequel.',
      },
    ],
  },

  // ── I. Un ancien de clan ──
  {
    ...base,
    id: 'dl_ancien_clan',
    titre: 'Ceux qui t’accompagnaient',
    chapitre: 4,
    arc: 'heritage',
    categorie: 'heritage',
    lieu: '$maison',
    poids: 10,
    si: { tout: [{ statut: ['actif', 'errant', 'exile'] }, { non: { clan: 'sans_clan' } }, { age: { min: 40, max: 55 } }] },
    texte: 'Le plus vieil homme du clan {clan} te fait venir chez lui. Il ne se lève plus beaucoup ; il te reçoit sous trois couvertures, le thé déjà servi. « Tu as passé ta vie à chercher à devenir quelqu’un. » « Et vous pensez que j’ai échoué ? » « Je pense que tu as oublié de regarder ceux qui t’accompagnaient. La puissance ne laisse pas toujours de place aux autres. »',
    choix: [
      {
        id: 'retour',
        texte: '« Et vous, vous avez laissé quoi derrière vous ? »',
        effets: [{ drapeau: 'dl_ancien', valeur: 'question' }, { stat: 'social.confianceClan', delta: 3 }],
        resultat: '« Quelques erreurs. Quelques élèves. Et suffisamment de regrets pour ne pas avoir envie de te voir répéter les mêmes. » Il te tend une tasse. Elle a refroidi pendant qu’il parlait. Tu la bois quand même.',
      },
      {
        id: 'noms',
        texte: 'Lui citer, un par un, le nom de ceux qui t’ont accompagné·e',
        effets: [{ drapeau: 'dl_ancien', valeur: 'noms' }, { relation: '@coequipierA', delta: { attachement: 2 } }, { ethique: { compassion: 3 } }],
        resultat: 'Tu commences par {@coequipierA}. Tu continues. La liste est plus longue que tu ne pensais, et certains noms te serrent la gorge. Le vieil homme écoute jusqu’au bout, les yeux fermés. « Bien. Tu n’as pas tout oublié, alors. »',
      },
    ],
  },

  // ── Hyūga et Uchiha : voir, et savoir ──
  {
    ...base,
    id: 'dl_hyuga_uchiha',
    titre: 'Voir trop de choses',
    arc: 'formation',
    categorie: 'conflit_clans',
    lieu: '$village',
    poids: 10,
    si: { tout: [ACTIF, { clan: 'uchiha' }, VIVANT('@coequipierB'), { clanPnj: '@coequipierB', clan: 'hyuga' }, { age: { min: 13, max: 20 } }] },
    texte: 'Au bord du terrain, {@coequipierB} te regarde t’entraîner, les veines tendues autour des yeux. Quand tu t’arrêtes, {il:@coequipierB} relâche son Byakugan. « Tu as la chance de pouvoir observer les choses sans avoir à les comprendre. » « Et toi, tu as la chance de croire que voir quelque chose signifie savoir ce qu’il représente. » « Tu parles comme quelqu’un qui a peur de ce qu’il voit. »',
    choix: [
      {
        id: 'avouer',
        texte: '« Peut-être que je vois simplement trop de choses. »',
        effets: [{ relation: '@coequipierB', delta: { confiance: 6, amitie: 4 } }, { drapeau: 'dl_hyuga_uchiha', valeur: 'aveu' }],
        resultat: '{@coequipierB} ne répond rien. Puis {il:@coequipierB} touche son front, là où le bandeau cache le sceau de la branche secondaire. « Moi aussi. Ça ne se voit juste pas de la même façon. » Pour la première fois, vous vous comprenez.',
      },
      {
        id: 'piquer',
        texte: '« Et toi, tu parles comme quelqu’un qui porte une cage sur le front. »',
        effets: [{ relation: '@coequipierB', delta: { hostilite: 8, respect: 2 } }, { drapeau: 'dl_hyuga_uchiha', valeur: 'blessure' }],
        resultat: 'Le visage de {@coequipierB} se ferme comme une porte. {Il:@coequipierB} se lève et s’en va, très droit. Tu as touché juste. C’est bien ça le problème.',
      },
    ],
  },
  {
    ...base,
    id: 'dl_uchiha_hyuga',
    titre: 'Voir, et savoir',
    arc: 'formation',
    categorie: 'conflit_clans',
    lieu: '$village',
    poids: 10,
    si: { tout: [ACTIF, { clan: 'hyuga' }, VIVANT('@rival'), { clanPnj: '@rival', clan: 'uchiha' }, { age: { min: 13, max: 20 } }] },
    texte: '{@rival} s’arrête devant toi, les yeux encore rouges du Sharingan qu’{il:@rival} vient de relâcher. Tu as gardé ton Byakugan ouvert. « Tu as la chance de pouvoir observer les choses sans avoir à les comprendre », dis-tu. « Et toi, tu as la chance de croire que voir quelque chose signifie savoir ce qu’il représente. » « Tu parles comme quelqu’un qui a peur de ce qu’il voit. »',
    choix: [
      {
        id: 'ecouter',
        texte: 'Attendre sa réponse, sans rien ajouter',
        effets: [{ relation: '@rival', delta: { respect: 6, rivalite: -2 } }, { drapeau: 'dl_uchiha_hyuga', valeur: 'ecoute' }],
        resultat: '« Peut-être que je vois simplement trop de choses. » {@rival} détourne les yeux, une seconde. Chez {lui:@rival}, c’est un aveu énorme. Tu n’en parles à personne.',
      },
      {
        id: 'defi',
        texte: '« Alors montre-moi ce que tu vois. Ici, maintenant. »',
        effets: [{ relation: '@rival', delta: { rivalite: 8, respect: 3 } }, { drapeau: 'dl_uchiha_hyuga', valeur: 'defi' }],
        resultat: 'Vos yeux s’allument en même temps. Vous ne vous battez pas : vous vous regardez, seulement, chacun lisant l’autre jusqu’au dernier tenketsu, jusqu’au dernier tressaillement. Au bout d’une minute, c’est {@rival} qui cligne le premier. {Il:@rival} ne te le pardonnera jamais tout à fait.',
      },
    ],
  },
];
