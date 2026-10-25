// Chapitre 5 : la voie (de 30 à 45 ans). Le chapitre où le personnage décide ce qu'il devient :
// commandant, chef de l'ombre, médecin, diplomate… ou celui qui part, ou celle qui pose le bandeau.
// À chaque étape, partir reste possible.

import type { Condition, Effect, EventDef } from '../../engine/types';
import { combatPouvoir, entrainerPouvoir, segmentsParVillage } from './outils';

const base = { chapitre: 5, arc: 'heritage' as const };
const ACTIF: Condition = { statut: 'actif' };
const ROUTE: Condition = { statut: ['errant', 'deserteur', 'exile'] };
const VOIE = (v: string): Condition => ({ drapeau: 'voie', egal: v });

/** La suite commune à toutes les voies du village. */
const COMMUN: Effect[] = [
  { planifier: 'c5v_milieu', dansJours: 2600 },
  { planifier: 'c5v_tentation', dansJours: 3700 },
];

/** Partir : on quitte le village, sans y être chassé·e. La route reprend au chapitre suivant. */
const PARTIR: Effect[] = [
  { statut: 'errant' },
  { drapeau: 'parti_a_trente_ans' },
  { stat: 'social.loyaute', delta: -20 },
  { journal: 'Tu quittes le village, de ton plein gré.', importance: 3 },
  { planifier: 'c5vr_ouverture', dansJours: 60 },
];

export const CHAPITRE5_VOIE: EventDef[] = [
  {
    ...base,
    id: 'c5v_ouverture',
    titre: 'La croisée',
    categorie: 'promotion',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    personnages: ['@kage'],
    texte: [
      { texte: 'Tu as trente ans. Le {kage} te reçoit seul·e, sans gardes, un soir de pluie. « Tu as fait tout ce qu’on t’a demandé. Maintenant, je te demande ce que toi, tu veux faire. Les dix prochaines années décideront de ce qu’on dira de toi. »' },
      ...segmentsParVillage({
        konoha: 'Par la fenêtre, on voit les visages des Hokage sculptés dans la falaise.',
        suna: 'Le vent jette du sable contre les volets. Suna a besoin de chefs, et d’eau.',
        kiri: 'La brume entre par les fenêtres. Kiri se reconstruit, et cherche qui la gardera.',
        kumo: 'L’orage gronde sur les sommets. Kumo veut des chefs forts, et elle les use vite.',
        iwa: 'La lampe éclaire une carte des frontières couverte de cailloux. Chaque caillou est une garnison.',
      }),
    ],
    choix: [
      {
        id: 'commandement',
        texte: 'Commander les forces du village',
        indice: 'La voie du chef de guerre, et peut-être du chapeau de Kage.',
        effets: [{ drapeau: 'voie', valeur: 'commandement' }, { stat: 'social.influence', delta: 6 }, { planifier: 'c5v_cmd_frontiere', dansJours: 500 }, { planifier: 'c5v_cmd_conseil', dansJours: 1700 }, ...COMMUN],
        resultat: 'On te remet un sceau de commandant et une salle de cartes. Le premier soir, tu y restes jusqu’à l’aube, à apprendre par cœur les noms de tes chefs d’unité.',
      },
      {
        id: 'ombre',
        texte: 'Diriger les unités de l’ombre',
        indice: 'Des missions dont personne ne saura rien. Une réputation qui ne sort jamais au soleil.',
        effets: [{ drapeau: 'voie', valeur: 'ombre' }, { stat: 'social.reputationOmbre', delta: 12 }, { planifier: 'c5v_ombre_ordre', dansJours: 500 }, { planifier: 'c5v_ombre_complot', dansJours: 1700 }, ...COMMUN],
        resultat: 'On te remet un masque blanc, sans motif, et une clé. Derrière la porte, des dossiers sur tout le monde, toi compris.',
      },
      {
        id: 'medecine',
        texte: 'Fonder un corps médical digne de ce nom',
        indice: 'Sauver des vies plutôt qu’en prendre. Et la tentation de ce que la médecine ne devrait pas faire.',
        effets: [{ drapeau: 'voie', valeur: 'medecine' }, { entrainer: 'shosen', jours: 60, mentor: true }, { ethique: { compassion: 6 } }, { planifier: 'c5v_med_epidemie', dansJours: 500 }, { planifier: 'c5v_med_interdit', dansJours: 1700 }, ...COMMUN],
        resultat: 'Un hôpital à moitié vide, des médecins fatigués, un budget ridicule. Tu commences par repeindre les murs toi-même. Les jeunes médecins t’imitent.',
      },
      {
        id: 'diplomatie',
        texte: 'Devenir l’ambassadeur du village',
        indice: 'Les mots plutôt que les armes. Mais les mots tuent aussi, autrement.',
        effets: [{ drapeau: 'voie', valeur: 'diplomatie' }, { stat: 'attributs.charisme', delta: 3 }, { planifier: 'c5v_dip_sommet', dansJours: 500 }, { planifier: 'c5v_dip_otage', dansJours: 1700 }, ...COMMUN],
        resultat: 'On te donne une malle de vêtements de cérémonie, un sceau du village, et une liste de gens qui veulent sa perte, poliment.',
      },
      {
        id: 'partir',
        texte: 'Partir : le monde est plus grand que ce village',
        indice: 'Tu quittes le village, libre, mais sans bandeau.',
        effets: [{ drapeau: 'voie', valeur: 'partir' }, ...PARTIR],
        resultat: 'Le {kage} ne te retient pas. « Les meilleurs finissent toujours par partir. Certains reviennent. » Tu rends ton gilet le lendemain et tu prends la route du sel.',
      },
      {
        id: 'poser',
        texte: 'Poser le bandeau et vivre une vie ordinaire',
        effets: [{ drapeau: 'voie', valeur: 'civil' }, { fin: 'retrait_precoce' }],
        resultat: 'Tu ranges ton bandeau dans un coffre. Le {kage} soupire, puis te serre la main. « Tu as gagné le droit de ne plus te battre. Peu de gens le gagnent. »',
      },
    ],
  },

  // ───────── Commandement ─────────
  {
    ...base,
    arc: 'conflit',
    id: 'c5v_cmd_frontiere',
    titre: 'La ligne rouge',
    categorie: 'guerre',
    lieu: 'frontiere_herbe',
    enchaine: true,
    si: { tout: [ACTIF, VOIE('commandement')] },
    texte: 'Un village voisin masse des troupes à la frontière. Pas une guerre, pas encore : un test. Le conseil veut une réponse ferme. Tes chefs d’unité attendent ton ordre.',
    choix: [
      {
        id: 'force',
        texte: 'Mener toi-même une démonstration de force',
        test: {
          type: 'combat',
          difficulte: 62,
          letal: true,
          causeMort: 'tombé·e à la frontière, à la tête de tes troupes',
          attributs: { force: 1, agilite: 1, charisme: 1, controleEmotionnel: 1 },
          maitrises: { arme: 1, ninjutsu: 1 },
          arme: true,
          succes: { texte: 'Tu brises leur avant-garde en une nuit. Le lendemain, leurs troupes se retirent. Personne n’a déclaré la guerre. Personne n’en voudra.', effets: [{ stat: 'social.reputation', delta: 12 }, { stat: 'social.influence', delta: 6 }, ...combatPouvoir()] },
          echec: { texte: 'L’engagement tourne mal. Tu ramènes tes hommes, mais pas tous, et le conseil te le fera payer.', effets: [{ stat: 'social.influence', delta: -6 }, { blessure: { id: 'ligne_rouge', nom: 'Blessure de commandement', gravite: 2, jours: 60 } }] },
        },
      },
      {
        id: 'negocier',
        texte: 'Aller parler seul·e à leur commandant',
        test: {
          type: 'competence',
          difficulte: 60,
          attributs: { charisme: 3, controleEmotionnel: 1 },
          succes: { texte: 'Deux commandants sur un rocher, entre deux armées. Vous parlez de vos morts. Le lendemain, les deux camps reculent d’un kilomètre.', effets: [{ stat: 'social.influence', delta: 10 }, { ethique: { compassion: 4 } }] },
          echec: { texte: 'Il te fait attendre deux jours, puis refuse de te voir. Tu as perdu la face, et du temps.', effets: [{ stat: 'social.reputation', delta: -4 }] },
        },
      },
      {
        id: 'demission',
        texte: 'Refuser cette escalade et rendre ton commandement',
        effets: [{ drapeau: 'voie', valeur: 'aucune' }, { stat: 'social.influence', delta: -8 }, { ethique: { honneur: 6 } }],
        resultat: 'Tu poses ton sceau sur la table du conseil. On ne te le pardonne pas tout de suite. Tu redeviens un jōnin parmi d’autres, et tu respires mieux.',
      },
    ],
  },
  {
    ...base,
    id: 'c5v_cmd_conseil',
    titre: 'Le siège au conseil',
    categorie: 'politique',
    lieu: '$village',
    enchaine: true,
    si: { tout: [ACTIF, VOIE('commandement')] },
    texte: 'Le conseil t’offre un siège permanent. Le pouvoir réel, celui qui décide des guerres avant les Kage. Mais un siège se paie : il faut voter avec les anciens, toujours.',
    choix: [
      { id: 'accepter', texte: 'Accepter le siège', effets: [{ stat: 'social.influence', delta: 15 }, { ethique: { ambition: 6 } }, { drapeau: 'conseiller_kage' }], resultat: 'Tu siégeras à la gauche des anciens. Tu apprendras vite à quel point les décisions se prennent avant les réunions.' },
      { id: 'refuser', texte: 'Refuser pour rester près des troupes', effets: [{ stat: 'social.reputation', delta: 6 }, { stat: 'social.loyaute', delta: 4 }], resultat: 'Les soldats l’apprennent avant le soir. On te salue autrement dans les casernes.' },
      { id: 'partir', texte: 'Comprendre que ce village n’est plus le tien, et partir', effets: [...PARTIR], resultat: 'Tu lis l’offre deux fois, puis tu la brûles. Le lendemain, tu n’es plus là.' },
    ],
  },

  // ───────── Ombre ─────────
  {
    ...base,
    arc: 'crise',
    id: 'c5v_ombre_ordre',
    titre: 'L’ordre de trop',
    categorie: 'trahison',
    lieu: '$village',
    enchaine: true,
    si: { tout: [ACTIF, VOIE('ombre')] },
    texte: 'L’ordre arrive dans une enveloppe sans sceau : éliminer un genin de quatorze ans qui a vu ce qu’il n’aurait pas dû voir. Tes hommes attendent que tu désignes qui ira.',
    choix: [
      { id: 'executer', texte: 'Désigner quelqu’un', effets: [{ stat: 'social.loyaute', delta: 8 }, { ethique: { compassion: -12 } }, { stat: 'attributs.controleEmotionnel', delta: 3 }, { journal: 'Tu as donné un ordre que tu ne te pardonneras pas.', importance: 3 }], resultat: 'Le rapport tient en une ligne. Tu le ranges dans le dossier, et le dossier dans le coffre. Le coffre ne ferme plus tout à fait.' },
      {
        id: 'cacher',
        texte: 'Faire disparaître l’enfant ailleurs, vivant',
        test: {
          type: 'competence',
          difficulte: 62,
          attributs: { discretion: 2, intellect: 2 },
          succes: { texte: 'Un faux rapport, un faux corps, une barque vers un village de pêcheurs. L’enfant vivra, sous un autre nom. Toi, tu as menti à ton propre village.', effets: [{ ethique: { compassion: 10, honneur: 4 } }, { stat: 'social.suspicion', delta: 10 }, { drapeau: 'enfant_sauve' }] },
          echec: { texte: 'On découvre la supercherie. L’enfant est retrouvé. On te retire ton masque, et on te surveille.', effets: [{ drapeau: 'voie', valeur: 'aucune' }, { stat: 'social.suspicion', delta: 25 }, { stat: 'social.loyaute', delta: -10 }] },
        },
      },
      { id: 'fuir', texte: 'Prendre l’enfant et fuir le village', effets: [{ statut: 'deserteur' }, { drapeau: 'enfant_sauve' }, { ethique: { compassion: 12, honneur: 8 } }, { journal: 'Tu as fui le village avec un enfant condamné.', importance: 3 }, { planifier: 'c5vr_ouverture', dansJours: 30 }], resultat: 'Cette nuit-là, tu deviens ce que tu as chassé pendant des années : un déserteur. L’enfant dort contre ton épaule pendant que tu cours.' },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c5v_ombre_complot',
    titre: 'Le coup de l’ombre',
    categorie: 'politique',
    lieu: '$village',
    enchaine: true,
    si: { tout: [ACTIF, VOIE('ombre')] },
    texte: 'Ton propre adjoint prépare un coup contre le {kage}, avec la moitié des unités de l’ombre. Il te propose de le mener : « Tu sais ce que ce village devient sous lui. Avec nous, tu serais Kage avant l’hiver. »',
    choix: [
      { id: 'denoncer', texte: 'Le dénoncer au {kage}', effets: [{ stat: 'social.loyaute', delta: 12 }, { stat: 'social.influence', delta: 8 }, { relation: '@kage', delta: { confiance: 15 } }], resultat: 'Les conjurés sont arrêtés à l’aube. Ton adjoint te regarde passer devant sa cellule sans dire un mot. Il n’en a pas besoin.' },
      {
        id: 'mener',
        texte: 'Prendre la tête du coup',
        test: {
          type: 'combat',
          difficulte: 66,
          letal: true,
          causeMort: 'tué·e pendant la nuit du coup de l’ombre',
          attributs: { discretion: 2, agilite: 1, intellect: 1 },
          maitrises: { arme: 1, ninjutsu: 1 },
          arme: true,
          succes: { texte: 'À l’aube, la tour est à toi. Le {kage} est vivant, exilé. Le village se réveille avec un nouveau maître, qui n’a pas été choisi. Tu sais ce que ça veut dire : on viendra un jour pour toi aussi.', effets: [{ rang: 'kage' }, { stat: 'social.loyaute', delta: -10 }, { stat: 'social.reputationOmbre', delta: 20 }, { ethique: { ambition: 12, honneur: -10 } }, { drapeau: 'kage_usurpateur' }] },
          echec: { texte: 'Le {kage} vous attendait. Tu fuis par les toits, blessé·e, déserteur·e désormais.', effets: [{ statut: 'deserteur' }, { blessure: { id: 'coup_ombre', nom: 'Blessures du coup manqué', gravite: 2, jours: 60 } }, { planifier: 'c5vr_ouverture', dansJours: 30 }] },
        },
      },
      { id: 'quitter', texte: 'Ne rien faire, et quitter l’ombre', effets: [{ drapeau: 'voie', valeur: 'aucune' }, { ethique: { honneur: 2 } }, { stat: 'social.reputationOmbre', delta: -10 }], resultat: 'Tu rends ton masque et tu laisses les autres se débrouiller. Le coup échoue sans toi. Personne ne sait si tu le savais.' },
    ],
  },

  // ───────── Médecine ─────────
  {
    ...base,
    arc: 'crise',
    id: 'c5v_med_epidemie',
    titre: 'La fièvre grise',
    categorie: 'civils',
    lieu: '$village',
    enchaine: true,
    si: { tout: [ACTIF, VOIE('medecine')] },
    texte: 'Une fièvre inconnue touche les quartiers pauvres. En une semaine, quarante morts. Le conseil veut fermer les quartiers et laisser la maladie s’y éteindre.',
    choix: [
      {
        id: 'soigner',
        texte: 'Entrer dans les quartiers et chercher un remède',
        test: {
          type: 'competence',
          difficulte: 62,
          attributs: { intellect: 3, controleChakra: 1 },
          maitrises: { shosen: 3 },
          succes: { texte: 'Trois semaines sans dormir. Un remède à base d’herbes de marais et de chakra médical. L’épidémie recule, puis disparaît. Dans les quartiers pauvres, on prononce ton nom comme une prière.', effets: [{ stat: 'social.reputation', delta: 15 }, { ethique: { compassion: 8 } }, { entrainer: 'shosen', jours: 60 }] },
          echec: { texte: 'Tu trouves le remède trop tard pour beaucoup, et tu tombes malade toi-même. Tu t’en remets, de justesse.', effets: [{ stat: 'jauges.sante', delta: -35 }, { stat: 'social.reputation', delta: 5 }] },
        },
      },
      { id: 'fermer', texte: 'Accepter la quarantaine décidée par le conseil', effets: [{ stat: 'social.loyaute', delta: 6 }, { ethique: { compassion: -8 } }], resultat: 'Les quartiers sont fermés. La maladie s’y éteint, avec deux cents habitants. Les survivants ne te salueront plus jamais.' },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c5v_med_interdit',
    titre: 'La recherche interdite',
    categorie: 'organisation',
    lieu: '$village',
    enchaine: true,
    si: { tout: [ACTIF, VOIE('medecine')] },
    texte: 'Dans les archives scellées de l’hôpital, les notes d’un ancien médecin banni : une technique pour transférer son esprit dans un corps jeune, et ne jamais mourir. Les notes sont incomplètes. Tu sais exactement comment les compléter.',
    choix: [
      { id: 'detruire', texte: 'Brûler les notes', effets: [{ ethique: { honneur: 8 } }, { stat: 'attributs.controleEmotionnel', delta: 3 }], resultat: 'Le papier brûle mal, comme s’il ne voulait pas disparaître. Tu restes jusqu’à la dernière page.' },
      { id: 'etudier', texte: 'Les étudier en secret', effets: [{ drapeau: 'recherche_interdite' }, { drapeau: 'cellules_senju' }, { stat: 'attributs.intellect', delta: 4 }, { stat: 'social.suspicion', delta: 12 }, { ethique: { ambition: 10 } }, ...entrainerPouvoir(40)], resultat: 'Chaque nuit, une page. Au bout d’un an, tu t’injectes les cellules régénératrices décrites dans les notes, pour voir. Tu te dis que c’est pour comprendre, pas pour faire. Tu te le dis souvent.' },
      { id: 'fuir', texte: 'Partir avec les notes, pour les achever loin d’ici', effets: [{ statut: 'deserteur' }, { drapeau: 'recherche_interdite' }, { ethique: { ambition: 15, honneur: -10 } }, { journal: 'Tu as fui le village avec les notes interdites.', importance: 3 }, { planifier: 'c5vr_ouverture', dansJours: 30 }], resultat: 'Tu pars une nuit, les notes cousues dans ton manteau. Le village t’inscrit au registre des déserteurs. Tu as déjà en tête le nom de ton premier laboratoire.' },
    ],
  },

  // ───────── Diplomatie ─────────
  {
    ...base,
    id: 'c5v_dip_sommet',
    titre: 'Le sommet des cinq',
    categorie: 'politique',
    lieu: 'pays_fer',
    enchaine: true,
    si: { tout: [ACTIF, VOIE('diplomatie')] },
    texte: 'Pour la première fois depuis la guerre, les cinq villages envoient leurs ambassadeurs au Pays du Fer. L’ordre du jour : une alliance contre les organisations de déserteurs, et notamment celle qu’on appelle le Navire noir.',
    choix: [
      {
        id: 'alliance',
        texte: 'Bâtir l’alliance des cinq',
        test: {
          type: 'competence',
          difficulte: 64,
          attributs: { charisme: 3, intellect: 1 },
          succes: { texte: 'Neuf jours de négociations. Le dixième, cinq sceaux sur un même parchemin. On l’appellera « le pacte du Fer ». Ton nom est en bas.', effets: [{ drapeau: 'pacte_du_fer' }, { stat: 'social.influence', delta: 15 }, { stat: 'social.reputation', delta: 10 }] },
          echec: { texte: 'Kumo et Iwa se lèvent au troisième jour. Le sommet s’achève sur des politesses glacées.', effets: [{ stat: 'social.influence', delta: -4 }] },
        },
      },
      { id: 'avantage', texte: 'Négocier un avantage pour ton seul village', effets: [{ stat: 'social.loyaute', delta: 8 }, { stat: 'social.influence', delta: 6 }, { ethique: { honneur: -4 } }], resultat: 'Ton village repart avec des routes commerciales et des droits de passage. Les autres ambassadeurs retiendront que tu ne joues que pour toi.' },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c5v_dip_otage',
    titre: 'L’ambassade prise',
    categorie: 'capture',
    lieu: 'montagnes_foudre',
    enchaine: true,
    si: { tout: [ACTIF, VOIE('diplomatie')] },
    texte: 'Pendant une mission diplomatique, ton escorte est massacrée et tu es fait·e prisonnier·e par une faction qui veut une guerre. Ils comptent t’exécuter publiquement pour la déclencher.',
    choix: [
      {
        id: 'evasion',
        texte: 'T’évader',
        test: {
          type: 'combat',
          difficulte: 62,
          letal: true,
          causeMort: 'exécuté·e par une faction qui voulait la guerre',
          attributs: { agilite: 2, discretion: 1, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1, ninjutsu: 1 },
          succes: { texte: 'Trois gardes, une fenêtre, un précipice. Tu rentres au village à pied, maigre et vivant·e. La guerre n’aura pas lieu.', effets: [{ stat: 'social.reputation', delta: 10 }, { succes: 'evade' }, ...combatPouvoir()] },
          echec: { texte: 'Tu échoues, mais tu survis : le village paie une rançon énorme. Ta carrière d’ambassadeur s’arrête là.', effets: [{ drapeau: 'voie', valeur: 'aucune' }, { stat: 'social.influence', delta: -10 }] },
        },
      },
      {
        id: 'convaincre',
        texte: 'Convaincre tes geôliers',
        test: {
          type: 'competence',
          difficulte: 64,
          attributs: { charisme: 3, intellect: 1 },
          succes: { texte: 'Tu parles pendant trois jours. Le quatrième, leur chef te libère, et te demande de porter un message de paix à ton village.', effets: [{ stat: 'social.influence', delta: 12 }, { ethique: { compassion: 6 } }] },
          echec: { texte: 'Ils ne veulent pas t’entendre. Une équipe de ton village te libère in extremis.', effets: [{ stat: 'jauges.sante', delta: -30 }] },
        },
      },
    ],
  },

  // ───────── Pour tous ─────────
  {
    ...base,
    id: 'c5v_milieu',
    titre: 'Quarante ans',
    categorie: 'quotidien',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    personnages: ['@sensei'],
    texte: [
      { texte: 'Tu as quarante ans, et le matin, il te faut quelques secondes de plus pour te lever. Les jeunes jōnin t’appellent « maître ». Tu détestes ça, et tu t’y habitues.' },
      { si: { pnj: '@sensei', etat: ['vivant', 'blesse'] }, texte: '{@sensei}, très vieux maintenant, te fait appeler. Il veut te parler avant qu’il ne soit trop tard.' },
      { si: { non: { pnj: '@sensei', etat: ['vivant', 'blesse'] } }, texte: 'Sur la pierre du souvenir, tu comptes les noms de ta génération. Tu es l’un des derniers.' },
      { si: { drapeau: 'famille_fondee' }, texte: 'Ton enfant vient de recevoir son bandeau. Tu ne sais pas si tu es fier·e ou terrifié·e.' },
    ],
    choix: [
      { id: 'rester', texte: 'Rester, et continuer ce que tu as commencé', effets: [{ stat: 'attributs.controleEmotionnel', delta: 3 }, { stat: 'social.loyaute', delta: 4 }], resultat: 'Tu as encore des choses à faire ici. Beaucoup de choses.' },
      { id: 'transmettre', texte: 'Commencer à transmettre ce que tu sais', effets: [{ stat: 'attributs.charisme', delta: 2 }, { ethique: { compassion: 4 } }, ...entrainerPouvoir(20, true)], resultat: 'Tu prends trois élèves, cette fois par choix. Tu leur apprends d’abord à survivre, ensuite à gagner.' },
      { id: 'partir', texte: 'Partir enfin, avant qu’il ne soit trop tard', effets: [...PARTIR], resultat: 'Tu as donné vingt-cinq ans à ce village. Tu te donnes le reste. Tu pars un matin de printemps, sans prévenir personne.' },
    ],
  },
  {
    ...base,
    arc: 'crise',
    id: 'c5v_tentation',
    titre: 'L’envoyé de l’Amiral',
    categorie: 'trahison',
    lieu: '$village',
    enchaine: true,
    si: ACTIF,
    texte: 'Un homme au tatouage d’ancre noire s’assoit à ta table dans une gargote. « L’Amiral prépare quelque chose de grand. Il veut des gens comme toi : des gens que leurs villages n’ont jamais vraiment mérités. » Il pose une bourse et une ancre de fer sur la table.',
    choix: [
      { id: 'denoncer', texte: 'L’arrêter et le livrer au {kage}', effets: [{ stat: 'social.loyaute', delta: 8 }, { drapeau: 'connait_amiral' }, { secret: 'traitre_navire_noir' }], resultat: 'Il ne résiste pas. En prison, il dit seulement : « Vous verrez la flotte bien assez tôt. »' },
      { id: 'double', texte: 'Accepter, pour espionner l’Amiral de l’intérieur', effets: [{ drapeau: 'agent_double' }, { drapeau: 'connait_amiral' }, { stat: 'social.reputationOmbre', delta: 10 }, { stat: 'social.suspicion', delta: 8 }], resultat: 'Tu prends l’ancre de fer. Tu préviens le {kage} le soir même, et lui seul. Désormais, tu marches sur un fil.' },
      { id: 'rejoindre', texte: 'Accepter, pour de vrai', effets: [{ statut: 'deserteur' }, { drapeau: 'agent_amiral' }, { ethique: { honneur: -10, ambition: 10 } }, { journal: 'Tu as rejoint l’Amiral du Navire noir.', importance: 3 }, { planifier: 'c5vr_ouverture', dansJours: 30 }], resultat: 'Tu prends l’ancre et la bourse. Une semaine plus tard, tu embarques de nuit. Ton village découvre ton départ au matin.' },
    ],
  },
  {
    ...base,
    id: 'c5v_fin',
    titre: 'Ce que tu es devenu·e',
    categorie: 'epilogue',
    lieu: '$village',
    priorite: 30,
    si: { tout: [ACTIF, { un: [{ tout: [{ vu: 'c5v_tentation' }, { age: { min: 44 } }] }, { age: { min: 47 } }] }] },
    texte: [
      { texte: 'Quinze ans ont passé depuis la croisée. Tu sais maintenant ce que tu es.' },
      { si: VOIE('commandement'), texte: 'Un chef de guerre que les soldats suivraient n’importe où.' },
      { si: VOIE('ombre'), texte: 'Une ombre dont le village ne connaît pas le visage, mais à qui il doit plus qu’il ne le croit.' },
      { si: VOIE('medecine'), texte: 'Un médecin qui a sauvé plus de vies qu’aucun ninja n’en a pris.' },
      { si: VOIE('diplomatie'), texte: 'Une voix que les cinq villages écoutent.' },
      { si: VOIE('aucune'), texte: 'Quelqu’un qui a refusé ce qu’on attendait de lui, et qui ne le regrette pas.' },
      { si: { drapeau: 'kage_usurpateur' }, texte: 'Un Kage qui n’a pas été choisi, et qui dort mal.' },
    ],
    choix: [
      { id: 'continuer', texte: 'Regarder vers ce qui vient', effets: [{ drapeau: 'chapitre5_fini' }, { fin: 'chapitre_5' }], resultat: 'Le Kage vieillit. La succession approche. Et au large, une flotte noire attend.' },
    ],
  },

  // ───────── La route ─────────
  {
    ...base,
    id: 'c5vr_ouverture',
    titre: 'Le seigneur sans bandeau',
    categorie: 'organisation',
    lieu: 'route_commerce',
    enchaine: true,
    chapitres: [5],
    si: ROUTE,
    texte: [
      { si: { drapeau: 'parti_a_trente_ans' }, texte: 'Tu as quitté le village. Sur la route du sel, ta réputation te précède : on te propose des contrats, des alliances, des terres.' },
      { si: { drapeau: 'parti_a_trente_ans', absent: true }, texte: 'Tu as trente ans passés et un nom que tout le monde connaît sur les routes. Ce que tu as bâti grandit, et attire des regards.' },
    ],
    choix: [
      { id: 'seigneur', texte: 'Fonder un petit village caché, et en devenir le chef', effets: [{ drapeau: 'seigneur_cache' }, { stat: 'social.influence', delta: 12 }, { ethique: { ambition: 6 } }, { planifier: 'c5vr_epreuve', dansJours: 1500 }], resultat: 'Une vallée, trente familles, un mur de bois. On t’appelle « chef ». Tu n’y crois pas encore.' },
      { id: 'allie', texte: 'Offrir tes services à un grand village, comme allié', effets: [{ statut: 'actif' }, { rang: 'jonin' }, { drapeau: 'reintegre' }, { stat: 'social.loyaute', delta: 20 }, { drapeau: 'voie', valeur: 'aucune' }, ...COMMUN], resultat: 'On te rend un bandeau, avec un rang de jōnin et des regards méfiants. Tu sais qu’il te faudra des années pour qu’on oublie d’où tu viens.' },
      { id: 'ermite', texte: 'Te retirer dans la montagne et chercher la maîtrise absolue', effets: [{ drapeau: 'ermite_montagne' }, ...entrainerPouvoir(80), { entrainer: 'ninjutsu', jours: 120 }, { planifier: 'c5vr_epreuve', dansJours: 1500 }], resultat: 'Une grotte, une cascade, le silence. Les années passent comme des saisons.' },
    ],
  },
  {
    ...base,
    arc: 'conflit',
    id: 'c5vr_epreuve',
    titre: 'Ceux qui te cherchent',
    categorie: 'guerre',
    lieu: 'frontiere_herbe',
    enchaine: true,
    chapitres: [5],
    si: ROUTE,
    texte: 'Des chasseurs de primes, envoyés par ton ancien village ou par quelqu’un qui paie bien, te retrouvent enfin. Ils sont cinq, jeunes, et ils ont entendu les histoires.',
    choix: [
      {
        id: 'combattre',
        texte: 'Leur montrer pourquoi on raconte ces histoires',
        test: {
          type: 'combat',
          difficulte: 64,
          letal: true,
          manches: 3,
          causeMort: 'tombé·e sous les coups de cinq chasseurs de primes',
          attributs: { agilite: 2, controleEmotionnel: 1, perception: 1 },
          maitrises: { arme: 1, ninjutsu: 1, taijutsu: 1 },
          arme: true,
          succes: { texte: 'Ils repartent à trois, sans leur prime. Le plus jeune se retourne une dernière fois. Dans dix ans, il racontera cette histoire à son tour.', effets: [{ stat: 'social.reputationOmbre', delta: 10 }, ...combatPouvoir()] },
          echec: { texte: 'Tu leur échappes, de justesse, en laissant derrière toi plus de sang que tu ne voudrais.', effets: [{ blessure: { id: 'chasseurs_vieux', nom: 'Blessures des chasseurs', gravite: 2, jours: 70 } }] },
        },
      },
      { id: 'parler', texte: 'Les inviter à s’asseoir et leur parler', effets: [{ ethique: { compassion: 6 } }, { stat: 'attributs.charisme', delta: 2 }], resultat: 'Tu leur racontes la vérité, celle qui n’est dans aucune prime. Au matin, deux d’entre eux décident de rester avec toi.' },
    ],
  },
  {
    ...base,
    id: 'c5vr_fin',
    titre: 'La moitié du chemin',
    categorie: 'epilogue',
    lieu: 'route_commerce',
    priorite: 30,
    chapitres: [5],
    si: { tout: [ROUTE, { un: [{ tout: [{ vu: 'c5vr_epreuve' }, { age: { min: 42 } }] }, { age: { min: 47 } }] }] },
    texte: [
      { texte: 'Tu as passé la moitié de ta vie sur les routes. L’autre moitié t’attend, et tu sais déjà qu’elle sera plus courte.' },
      { si: { drapeau: 'seigneur_cache' }, texte: 'Ton petit village caché compte maintenant cent âmes, et une école.' },
      { si: { drapeau: 'ermite_montagne' }, texte: 'Ce que tu as appris dans la montagne, peu de gens au monde le savent.' },
      { si: { drapeau: 'agent_amiral' }, texte: 'L’Amiral t’a confié un navire. Tu ne sais plus très bien pourquoi tu l’as suivi.' },
    ],
    choix: [{ id: 'continuer', texte: 'Continuer', effets: [{ drapeau: 'chapitre5_fini' }, { fin: 'chapitre_5_route' }], resultat: 'La route continue. Toi aussi.' }],
  },
];
