import type { Condition, EventDef, MissionDef } from '../../engine/types';

/**
 * La vie d'un genin : des missions de rang D qui tournent parfois mal (on peut y mourir), des missions de rang C
 * où l'on se bat vraiment, et des bagarres au village. Chaque mission se joue une fois.
 */
const ACTIF: Condition = { statut: 'actif' };
const B: Condition = { pnj: '@coequipierB', etat: ['vivant', 'blesse'] };
const base = { chapitre: 1, chapitres: [1, 2, 3], arc: 'premieres_missions' as const, categorie: 'mission' as const, enchaine: true };
const D = (n: number): Condition => ({ tout: [{ rangMin: 'genin' }, { missionsReussies: n }, { blessureGrave: false }] });
const C = (n: number): Condition => ({ tout: [{ rangMin: 'genin' }, { missionsReussies: n }, { age: { min: 13 } }, { blessureGrave: false }] });
const en = (m: string): Condition => ({ mission: m, statut: 'en_cours' });

export const MISSIONS_GENIN: MissionDef[] = [
  { id: 'd_chat', rang: 'D', titre: 'Le chat de la dame du daimyō', description: 'Retrouver le chat de l’épouse du daimyō, en fuite pour la sixième fois cette année.', lieu: '$village', duree: 2, si: D(0), recompense: { ryo: 30, reputation: 2 }, risques: 'Griffures. Humiliation.', evenement: 'mg_chat' },
  { id: 'd_sanglier', rang: 'D', titre: 'Le sanglier des rizières', description: 'Un sanglier ravage les rizières du village voisin. Le chasser, ou pire.', lieu: 'foret_feu', duree: 3, si: D(1), recompense: { ryo: 35, reputation: 3 }, risques: 'Un sanglier adulte peut tuer un enfant.', evenement: 'mg_sanglier' },
  { id: 'd_entrepot', rang: 'D', titre: 'La garde de l’entrepôt', description: 'Garder l’entrepôt à riz du quartier sud, de nuit, après une série de vols.', lieu: '$village', duree: 2, si: D(1), recompense: { ryo: 25, reputation: 2 }, risques: 'Voleurs armés.', evenement: 'mg_entrepot' },
  { id: 'd_puits', rang: 'D', titre: 'L’enfant du puits', description: 'Un enfant est tombé dans un vieux puits à sec, à la sortie du village.', lieu: '$village', duree: 1, si: D(0), recompense: { ryo: 20, reputation: 4 }, risques: 'Effondrement.', evenement: 'mg_puits' },
  { id: 'd_meute', rang: 'D', titre: 'La meute de la ferme', description: 'Une meute de chiens sauvages tourne autour d’une ferme isolée. Le fermier a déjà perdu deux chèvres.', lieu: 'foret_feu', duree: 3, si: D(2), recompense: { ryo: 40, reputation: 3 }, risques: 'Morsures. Une meute peut tuer.', evenement: 'mg_meute' },
  { id: 'd_noble', rang: 'D', titre: 'Le fils du marchand de soie', description: 'Raccompagner chez lui le fils ivre d’un riche marchand, à travers le quartier des tavernes.', lieu: '$village', duree: 1, si: D(1), recompense: { ryo: 35, reputation: 1 }, risques: 'Bagarre probable.', evenement: 'mg_noble' },
  { id: 'd_forge', rang: 'D', titre: 'Le charbon du forgeron', description: 'Aider le forgeron du village à charger le charbon de la grande forge.', lieu: '$forge', duree: 2, si: D(0), recompense: { ryo: 20, reputation: 1 }, risques: 'Brûlures.', evenement: 'mg_forge' },
  { id: 'd_colis', rang: 'D', titre: 'Le colis du relais', description: 'Livrer un colis scellé au relais de poste de la frontière. Une demi-journée de marche.', lieu: 'frontiere_herbe', duree: 2, si: D(3), recompense: { ryo: 40, reputation: 3 }, risques: 'Aucun, en théorie.', evenement: 'mg_colis' },
  { id: 'd_sortie', rang: 'D', titre: 'La sortie des petits', description: 'Accompagner une classe de l’Académie pour une sortie en forêt.', lieu: 'foret_feu', duree: 1, si: D(2), recompense: { ryo: 25, reputation: 4 }, risques: 'Enfants turbulents.', evenement: 'mg_sortie' },
  { id: 'd_digue', rang: 'D', titre: 'La digue de la rivière', description: 'Renforcer une digue avant les crues, avec les paysans du bourg voisin.', lieu: 'foret_feu', duree: 4, si: D(2), recompense: { ryo: 30, reputation: 3 }, risques: 'Crue soudaine.', evenement: 'mg_digue' },
  { id: 'c_col', rang: 'C', titre: 'Les bandits du col', description: 'Déloger une bande de pillards installée au col, qui rançonne les voyageurs.', lieu: 'montagnes_foudre', duree: 8, si: C(3), recompense: { ryo: 110, reputation: 6 }, risques: 'Une dizaine d’hommes armés. Peut-être un ninja.', evenement: 'mg_col' },
  { id: 'c_bateau', rang: 'C', titre: 'Le bateau des contrebandiers', description: 'Inspecter un navire suspect au port et saisir sa cargaison.', lieu: 'cotes_brume', duree: 6, si: C(3), recompense: { ryo: 100, reputation: 5 }, risques: 'Équipage armé, mercenaires.', evenement: 'mg_bateau' },
  { id: 'c_deserteur', rang: 'C', titre: 'Le genin qui a fui', description: 'Ramener un genin d’un village voisin, déserteur, qui se cache dans les marais. Vivant, si possible.', lieu: 'frontiere_herbe', duree: 7, si: C(4), recompense: { ryo: 120, reputation: 5 }, risques: 'Il est entraîné, désespéré, et il sait qu’on le cherche.', evenement: 'mg_deserteur' },
  { id: 'c_cendres', rang: 'C', titre: 'Le village en cendres', description: 'Enquêter sur un hameau brûlé à la frontière. Personne ne sait qui l’a fait.', lieu: 'frontiere_herbe', duree: 8, si: C(4), recompense: { ryo: 100, reputation: 6 }, risques: 'Inconnus.', evenement: 'mg_cendres' },
  { id: 'c_medecin', rang: 'C', titre: 'Le médecin de l’épidémie', description: 'Escorter un médecin jusqu’à un bourg frappé par une fièvre, à travers une région sans loi.', lieu: 'route_commerce', duree: 10, si: C(3), recompense: { ryo: 90, reputation: 7 }, risques: 'Fièvre, bandits.', evenement: 'mg_medecin' },
  { id: 'c_tournoi', rang: 'C', titre: 'Le garde du corps', description: 'Protéger un seigneur de province pendant son tournoi d’archers annuel.', lieu: 'route_commerce', duree: 5, si: C(5), recompense: { ryo: 130, reputation: 5 }, risques: 'Menaces de mort reçues la semaine dernière.', evenement: 'mg_tournoi' },
];

export const EVENEMENTS_MISSIONS_GENIN: EventDef[] = [
  // ── Rang D ───────────────────────────────────────────────────────
  {
    ...base,
    id: 'mg_chat',
    titre: 'Le chat de la dame du daimyō',
    lieu: '$village',
    si: en('d_chat'),
    texte: 'Le chat s’appelle Tora. Il a un ruban rouge à l’oreille, un caractère de démon, et une préférence pour les toits du quartier des tanneurs. Trois équipes de genin ont échoué avant toi. L’une d’elles a démissionné.',
    choix: [
      { id: 'piege', texte: 'Lui tendre un piège avec du poisson séché', test: { type: 'competence', difficulte: 36, attributs: { intellect: 2, discretion: 1 }, succes: { texte: 'Tora tombe dans le panier comme un débutant. Il te regarde à travers l’osier avec une haine pure. La dame du daimyō l’écrase contre elle en pleurant de joie. Tora te fixe par-dessus son épaule. Il se souviendra de toi.', effets: [{ mission: 'd_chat', statut: 'reussie' }, { stat: 'attributs.intellect', delta: 1 }] }, echec: { texte: 'Tora mange le poisson, renverse le panier, et te griffe au passage. Tu le rattrapes quand même, trois heures plus tard, dans une gouttière. Tu as des griffures jusqu’au cou.', effets: [{ mission: 'd_chat', statut: 'reussie' }, { stat: 'jauges.sante', delta: -3 }, { stat: 'attributs.agilite', delta: 1 }] } } },
      { id: 'poursuite', texte: 'Le poursuivre sur les toits', test: { type: 'competence', difficulte: 40, attributs: { agilite: 3 }, succes: { texte: 'Six toits, deux cheminées, un étendage. Tu le coinces contre une girouette. Il crache. Tu as gagné. C’est la poursuite la plus difficile de ta jeune carrière, et c’était un chat.', effets: [{ mission: 'd_chat', statut: 'reussie' }, { stat: 'attributs.agilite', delta: 2 }] }, echec: { texte: 'Il saute d’un toit que tu ne peux pas sauter. Tu tombes dans le bac du teinturier. Tu rentres bleu·e de la tête aux pieds, sans le chat. Mission échouée. Le village en parlera longtemps.', effets: [{ mission: 'd_chat', statut: 'echouee' }, { stat: 'social.reputation', delta: -1 }, { stat: 'attributs.agilite', delta: 1 }] } } },
    ],
  },
  {
    ...base,
    id: 'mg_sanglier',
    titre: 'Le sanglier des rizières',
    lieu: 'foret_feu',
    si: en('d_sanglier'),
    personnages: ['@coequipierB'],
    texte: 'Les paysans le décrivent avec les mains, toujours plus grand à chaque récit. Puis tu le vois, à l’orée du bois, au crépuscule. Il est plus grand que tous les récits. Ses défenses ont la longueur de ton avant-bras. Il t’a vu aussi.',
    choix: [
      { id: 'combat', texte: 'L’affronter avant qu’il charge', test: { type: 'combat', difficulte: 42, attributs: { force: 1, agilite: 2 }, maitrises: { taijutsu: 1, arme: 1 }, arme: true, letal: true, manches: 2, causeMort: 'éventré·e par un sanglier, au bord des rizières, pendant une mission de rang D', succes: { texte: 'Il charge. Tu sautes au dernier moment, ton kunai trouve sa nuque. Il s’effondre dans la boue des rizières. Les paysans arrivent avec des torches et des cris de joie. Ce soir, le village voisin mange du sanglier. Toi, tu trembles encore.', effets: [{ mission: 'd_sanglier', statut: 'reussie' }, { stat: 'attributs.force', delta: 2 }, { combatSur: ['taijutsu'] }, { stat: 'jauges.ryo', delta: 10 }] }, echec: { texte: 'Sa défense t’ouvre la cuisse. Tu roules dans la boue, il revient. C’est {@coequipierB} qui le détourne avec des pierres, assez longtemps pour que tu rampes jusqu’à un arbre. Le sanglier s’en va. La mission est un échec. Tu es vivant·e. De justesse.', effets: [{ mission: 'd_sanglier', statut: 'echouee' }, { blessure: { id: 'defense_sanglier', nom: 'Cuisse ouverte', gravite: 2, jours: 30 } }, { relation: '@coequipierB', delta: { attachement: 6 } }] } } },
      { id: 'piege', texte: 'Creuser une fosse sur son chemin, et attendre', test: { type: 'competence', difficulte: 42, attributs: { intellect: 2, perception: 1 }, succes: { texte: 'Une nuit à creuser, une autre à attendre. À l’aube, un fracas énorme : il est dans la fosse, fou de rage. Les paysans s’en chargent. Tu n’as pas eu à le toucher.', effets: [{ mission: 'd_sanglier', statut: 'reussie' }, { stat: 'attributs.intellect', delta: 2 }, { stat: 'jauges.fatigue', delta: 15 }] }, echec: { texte: 'Il contourne la fosse comme s’il l’avait vue creuser. Il saccage un autre champ et disparaît. Tu repars bredouille, les mains en sang.', effets: [{ mission: 'd_sanglier', statut: 'echouee' }, { stat: 'attributs.intellect', delta: 1 }] } } },
    ],
  },
  {
    ...base,
    id: 'mg_entrepot',
    titre: 'La garde de l’entrepôt',
    lieu: '$village',
    si: en('d_entrepot'),
    texte: 'Deuxième nuit de garde. Les sacs de riz sentent la poussière. Vers trois heures, la porte arrière grince. Trois silhouettes, des sacs vides sur l’épaule, des bâtons ferrés à la main. Ils ne savent pas que tu es là.',
    choix: [
      { id: 'surprendre', texte: 'Leur tomber dessus dans le noir', test: { type: 'combat', difficulte: 42, attributs: { agilite: 1, discretion: 2, force: 1 }, maitrises: { taijutsu: 2 }, manches: 2, succes: { texte: 'Le premier ne te voit pas venir. Le deuxième, si, trop tard. Le troisième lâche son bâton et lève les mains. Ce sont des journaliers du port, sans travail depuis deux mois. Le chef du quartier te félicite. Toi, tu repenses à leurs mains maigres.', effets: [{ mission: 'd_entrepot', statut: 'reussie' }, { stat: 'attributs.discretion', delta: 1 }, { stat: 'attributs.force', delta: 1 }, { combatSur: ['taijutsu'] }] }, echec: { texte: 'Un bâton ferré te cueille à la tempe. Tu te réveilles à l’aube, entouré·e de sacs éventrés. Ils ont pris ce qu’ils pouvaient porter.', effets: [{ mission: 'd_entrepot', statut: 'echouee' }, { stat: 'jauges.sante', delta: -12 }, { stat: 'attributs.perception', delta: 1 }] } } },
      { id: 'parler', texte: 'Allumer la lanterne et leur parler', test: { type: 'competence', difficulte: 40, attributs: { charisme: 2, controleEmotionnel: 1 }, succes: { texte: 'La lumière les fige. Tu leur parles du bureau des missions, où le village paie des journaliers pour réparer les toits. Ils hésitent, puis repartent les sacs vides. Le lendemain, deux d’entre eux font la queue au bureau.', effets: [{ mission: 'd_entrepot', statut: 'reussie' }, { stat: 'attributs.charisme', delta: 2 }, { ethique: { compassion: 4 } }] }, echec: { texte: 'Ils voient un enfant avec une lanterne. Ils rient, et ils attaquent. Tu te défends comme tu peux. Ils fuient, mais tu as un bras en écharpe.', effets: [{ mission: 'd_entrepot', statut: 'reussie' }, { blessure: { id: 'baton_ferre', nom: 'Bras contusionné', gravite: 1, jours: 15 } }] } } },
    ],
  },
  {
    ...base,
    id: 'mg_puits',
    titre: 'L’enfant du puits',
    lieu: '$village',
    si: en('d_puits'),
    texte: 'Le puits est vieux, à sec, profond de vingt mètres. Au fond, une petite voix pleure. La mère, au bord, ne pleure plus : elle a déjà tout pleuré. Les pierres des parois sont descellées. Une corde ne tiendra pas longtemps.',
    choix: [
      { id: 'descendre', texte: 'Descendre en marchant sur les parois', test: { type: 'competence', difficulte: 42, attributs: { controleChakra: 2, agilite: 1 }, succes: { texte: 'Le chakra dans les pieds, comme à l’Académie. Tu descends la paroi à la verticale, une pierre après l’autre. L’enfant a la jambe cassée et des yeux immenses. Tu remontes avec lui sur le dos. La mère te serre si fort que tu en as mal aux côtes.', effets: [{ mission: 'd_puits', statut: 'reussie' }, { stat: 'attributs.controleChakra', delta: 2 }, { stat: 'social.reputation', delta: 2 }] }, echec: { texte: 'Une pierre cède sous ton pied. Tu tombes les cinq derniers mètres. L’enfant et toi, au fond, attendez les secours ensemble. Tu lui racontes des histoires pendant six heures. Il ne pleure plus.', effets: [{ mission: 'd_puits', statut: 'reussie' }, { blessure: { id: 'chute_puits', nom: 'Cheville foulée', gravite: 1, jours: 15 } }, { ethique: { compassion: 3 } }] } } },
      { id: 'corde', texte: 'Organiser les villageois pour une descente en corde', effets: [{ mission: 'd_puits', statut: 'reussie' }, { stat: 'attributs.intellect', delta: 1 }, { stat: 'attributs.charisme', delta: 1 }], resultat: 'Tu fais tresser trois cordes ensemble, tu places quatre hommes, tu fais descendre le plus léger. Une heure plus tard, l’enfant est dehors. Personne ne se souviendra de toi. Tout le monde se souviendra que ça a marché.' },
    ],
  },
  {
    ...base,
    id: 'mg_meute',
    titre: 'La meute de la ferme',
    lieu: 'foret_feu',
    si: en('d_meute'),
    personnages: ['@coequipierB'],
    texte: 'Ils sont sept. Maigres, rapides, avec des yeux qui brillent dans le noir. Ce ne sont plus des chiens : c’est une meute qui a appris que les humains sont lents. Ils vous encerclent dans la cour de la ferme, en silence.',
    choix: [
      { id: 'combat', texte: 'Dos à dos avec {@coequipierB}, et tenir', test: { type: 'combat', difficulte: 46, attributs: { agilite: 2, perception: 1, force: 1 }, maitrises: { taijutsu: 1, arme: 1 }, arme: true, letal: true, manches: 3, allies: true, causeMort: 'tombé·e sous les crocs d’une meute, dans la cour d’une ferme, pendant une mission de rang D', succes: { texte: 'Ils attaquent tous en même temps. Tu frappes, tu tournes, tu frappes encore, et tu sens le dos de {@coequipierB} contre le tien à chaque mouvement. Le chef de meute tombe. Les autres hésitent, puis s’enfuient dans la forêt. Le fermier vous donne une chèvre. Vous la lui rendez.', effets: [{ mission: 'd_meute', statut: 'reussie' }, { stat: 'attributs.agilite', delta: 2 }, { combatSur: ['taijutsu'] }, { relation: '@coequipierB', delta: { confiance: 6, attachement: 4 } }] }, echec: { texte: 'Un chien te prend le bras, un autre la jambe. Vous vous réfugiez dans la grange, en sang, et tenez la porte jusqu’au matin. Le fermier vous recoud avec du fil à voile.', effets: [{ mission: 'd_meute', statut: 'echouee' }, { blessure: { id: 'morsures', nom: 'Morsures profondes', gravite: 2, jours: 30 } }] } } },
      { id: 'feu', texte: 'Le feu : un cercle de torches autour de la ferme', test: { type: 'competence', difficulte: 44, attributs: { intellect: 2, controleEmotionnel: 1 }, succes: { texte: 'Tu cries à {@coequipierB} d’allumer la paille. Un cercle de feu monte entre vous et la meute. Ils tournent autour, longtemps, puis abandonnent. Vous gardez le feu jusqu’à l’aube. La meute ne revient pas.', effets: [{ mission: 'd_meute', statut: 'reussie' }, { stat: 'attributs.intellect', delta: 2 }, { stat: 'jauges.fatigue', delta: 15 }] }, echec: { texte: 'Le vent tourne, le feu prend la grange. Vous sauvez le fermier, pas la grange. La meute, elle, est partie avec le reste des chèvres.', effets: [{ mission: 'd_meute', statut: 'echouee' }, { stat: 'social.reputation', delta: -2 }, { stat: 'jauges.sante', delta: -6 }] } } },
    ],
  },
  {
    ...base,
    id: 'mg_noble',
    titre: 'Le fils du marchand de soie',
    lieu: '$village',
    si: en('d_noble'),
    texte: 'Il a dix-neuf ans, des bagues à chaque doigt, et il a bu tout ce que la taverne avait. Il refuse de rentrer. Pire : il vient d’insulter un groupe de bûcherons qui se lèvent un par un. Ils sont cinq. Ils ont des mains comme des pelles.',
    choix: [
      { id: 'proteger', texte: 'Te mettre entre eux', test: { type: 'combat', difficulte: 42, attributs: { agilite: 2, controleEmotionnel: 1 }, maitrises: { taijutsu: 2 }, manches: 2, succes: { texte: 'Tu esquives le premier poing, tu fais trébucher le deuxième dans le troisième, et tu traînes le fils du marchand dehors par le col pendant qu’ils se relèvent. Dans la rue, il vomit sur tes sandales et te traite de servant. Mission réussie.', effets: [{ mission: 'd_noble', statut: 'reussie' }, { stat: 'attributs.agilite', delta: 2 }, { combatSur: ['taijutsu'] }] }, echec: { texte: 'Un bûcheron te soulève et te pose sur le comptoir, sans méchanceté. « Rentre chez toi, petit·e. Lui, on le garde un peu. » Tu ramènes le fils du marchand à l’aube, avec un œil au beurre noir. Le sien, pas le tien.', effets: [{ mission: 'd_noble', statut: 'reussie' }, { stat: 'social.reputation', delta: -1 }, { stat: 'attributs.controleEmotionnel', delta: 1 }] } } },
      { id: 'payer', texte: 'Payer une tournée aux bûcherons avec l’argent du fils', effets: [{ mission: 'd_noble', statut: 'reussie' }, { stat: 'attributs.charisme', delta: 2 }, { stat: 'attributs.intellect', delta: 1 }], resultat: 'Tu prends sa bourse avant qu’il comprenne, et tu poses une pièce d’or sur la table des bûcherons. « De la part de monsieur, pour s’excuser. » Ils éclatent de rire et trinquent à sa santé. Lui ne se souviendra de rien. Son père, en voyant la bourse, se souviendra de tout.' },
    ],
  },
  {
    ...base,
    id: 'mg_forge',
    titre: 'Le charbon du forgeron',
    lieu: '$forge',
    si: en('d_forge'),
    texte: 'Pelleter du charbon dans la grande forge, toute la journée, dans une chaleur qui fait danser l’air. Le forgeron parle à peine. Vers midi, une étincelle saute sur un tas de bois sec. En dix secondes, le mur de l’atelier flambe.',
    choix: [
      { id: 'feu', texte: 'Éteindre le feu', test: { type: 'competence', difficulte: 40, attributs: { agilite: 1, force: 1, controleEmotionnel: 1 }, succes: { texte: 'Seaux, sable, couvertures mouillées : en cinq minutes, il n’y a plus que de la fumée. Le forgeron te regarde, couvert·e de suie. Il ne dit rien. Le lendemain, il te forge un kunai, gratuit, équilibré à la perfection.', effets: [{ mission: 'd_forge', statut: 'reussie' }, { stat: 'attributs.force', delta: 1 }, { stat: 'jauges.ryo', delta: 15 }] }, echec: { texte: 'Les flammes te lèchent le bras avant que vous les mattiez à deux. L’atelier est sauvé. Ton bras est rouge et cloqué pour une semaine.', effets: [{ mission: 'd_forge', statut: 'reussie' }, { blessure: { id: 'brulure_forge', nom: 'Brûlure au bras', gravite: 1, jours: 12 } }] } } },
      { id: 'forgeron', texte: 'Sortir le forgeron, qui veut sauver ses outils', effets: [{ mission: 'd_forge', statut: 'reussie' }, { stat: 'attributs.force', delta: 2 }, { stat: 'jauges.sante', delta: -4 }], resultat: 'Il hurle qu’il doit sauver ses marteaux. Tu le tires dehors par la ceinture. Le mur s’effondre une seconde plus tard, là où il se tenait. Les marteaux survivent. Lui aussi.' },
    ],
  },
  {
    ...base,
    id: 'mg_colis',
    titre: 'Le colis du relais',
    lieu: 'frontiere_herbe',
    si: en('d_colis'),
    texte: 'Mission de rang D : un colis, un relais, une demi-journée de marche. Au relais, il n’y a personne. La porte est ouverte. Sur le comptoir, du thé encore tiède. Et derrière toi, sur la route, un homme sans bandeau qui marche vers toi en souriant. Il veut le colis.',
    choix: [
      { id: 'combat', texte: 'Te battre pour le colis', test: { type: 'combat', difficulte: 52, attributs: { agilite: 2, perception: 1, controleEmotionnel: 1 }, maitrises: { taijutsu: 1, arme: 1, ninjutsu: 1 }, arme: true, letal: true, manches: 3, causeMort: 'tué·e sur la route de la frontière, pour un colis de rang D qui n’en était pas un', succes: { texte: 'C’est un ninja. Un vrai, un déserteur, dix ans de plus que toi. Mais il ne s’attendait pas à ce qu’un genin se batte vraiment. Ton kunai l’atteint à l’épaule, il fuit dans les herbes hautes. Au village, on ouvre le colis devant toi : des plans de la frontière. La mission est requalifiée en rang B. Ta paie aussi.', effets: [{ mission: 'd_colis', statut: 'reussie' }, { stat: 'jauges.ryo', delta: 120 }, { stat: 'social.reputation', delta: 6 }, { combatSur: ['taijutsu'] }, { stat: 'attributs.perception', delta: 2 }] }, echec: { texte: 'Il te met à terre en trois coups et prend le colis. Il aurait pu te tuer. Il te regarde, puis te laisse. « Rentre. Dis-leur que le relais est fermé. »', effets: [{ mission: 'd_colis', statut: 'echouee' }, { blessure: { id: 'relais', nom: 'Côtes fêlées', gravite: 2, jours: 25 } }] } } },
      { id: 'fuir', texte: 'Fuir avec le colis', test: { type: 'competence', difficulte: 48, attributs: { agilite: 2, discretion: 2 }, succes: { texte: 'Tu passes par la fenêtre arrière, tu coupes à travers les herbes hautes, tu cours jusqu’à ne plus sentir tes jambes. Il ne te rattrape pas. Au village, tu remets le colis à un jōnin qui pâlit en lisant l’étiquette.', effets: [{ mission: 'd_colis', statut: 'reussie' }, { stat: 'attributs.agilite', delta: 2 }, { stat: 'jauges.ryo', delta: 40 }] }, echec: { texte: 'Il est plus rapide. Il te plaque dans les herbes, prend le colis, et disparaît. Tu rentres les mains vides et l’épaule démise.', effets: [{ mission: 'd_colis', statut: 'echouee' }, { blessure: { id: 'epaule', nom: 'Épaule démise', gravite: 1, jours: 20 } }] } } },
    ],
  },
  {
    ...base,
    id: 'mg_sortie',
    titre: 'La sortie des petits',
    lieu: 'foret_feu',
    si: en('d_sortie'),
    texte: 'Douze enfants de sept ans, une forêt, des sandwichs. Tout se passe bien jusqu’à ce qu’un petit hurle. Entre les arbres, une ourse, dressée sur ses pattes arrière. Derrière elle, deux oursons. Entre elle et ses oursons : trois de tes enfants.',
    choix: [
      { id: 'detourner', texte: 'Attirer l’ourse sur toi', test: { type: 'combat', difficulte: 48, attributs: { agilite: 2, controleEmotionnel: 1, force: 1 }, maitrises: { taijutsu: 1 }, letal: true, manches: 2, causeMort: 'tombé·e sous les griffes d’une ourse, en protégeant une classe de l’Académie', succes: { texte: 'Tu cries, tu lances une pierre, tu cours. Elle te suit. Les enfants s’enfuient vers la route. Tu grimpes à un arbre au dernier moment, et elle griffe le tronc sous tes pieds pendant une heure. Puis elle repart vers ses petits. Les douze enfants sont sains et saufs. L’un d’eux a dessiné la scène. Tu y as des bras très longs.', effets: [{ mission: 'd_sortie', statut: 'reussie' }, { stat: 'attributs.agilite', delta: 2 }, { stat: 'social.reputation', delta: 4 }, { ethique: { compassion: 3 } }] }, echec: { texte: 'Elle te rattrape au pied de l’arbre. Ses griffes t’ouvrent le dos. Mais les enfants sont loin, sur la route, et elle repart vers ses petits. On te ramène sur une porte en guise de brancard.', effets: [{ mission: 'd_sortie', statut: 'reussie' }, { blessure: { id: 'griffes_ourse', nom: 'Dos lacéré', gravite: 3, jours: 50 } }, { stat: 'social.reputation', delta: 3 }] } } },
      { id: 'calme', texte: 'Faire reculer les enfants lentement, sans crier', test: { type: 'competence', difficulte: 46, attributs: { controleEmotionnel: 3, charisme: 1 }, succes: { texte: 'Tu parles bas, très bas. Les trois enfants reculent un pas après l’autre, les yeux sur toi, pas sur l’ourse. Elle grogne, puis rejoint ses petits. Personne n’a couru. Personne n’a saigné.', effets: [{ mission: 'd_sortie', statut: 'reussie' }, { stat: 'attributs.controleEmotionnel', delta: 3 }] }, echec: { texte: 'Un enfant panique et court. L’ourse charge. Tu te jettes entre eux. Elle te renverse, renifle, et s’en va. Tu as eu de la chance. Beaucoup.', effets: [{ mission: 'd_sortie', statut: 'reussie' }, { blessure: { id: 'ourse', nom: 'Côtes fêlées', gravite: 2, jours: 25 } }] } } },
    ],
  },
  {
    ...base,
    id: 'mg_digue',
    titre: 'La digue de la rivière',
    lieu: 'foret_feu',
    si: en('d_digue'),
    texte: 'Quatre jours à porter des sacs de terre avec les paysans. Le quatrième soir, il pleut depuis des heures. Un grondement monte de l’amont. La crue arrive un jour plus tôt que prévu, et un vieux paysan est encore au pied de la digue, de l’autre côté.',
    choix: [
      { id: 'sauver', texte: 'Traverser la crue pour le chercher', test: { type: 'competence', difficulte: 48, attributs: { force: 2, controleChakra: 1 }, succes: { texte: 'Le chakra dans les pieds, sur l’eau qui bouillonne. Tu cours sur la crue comme sur un sol mouvant, tu attrapes le vieux par le bras, et vous remontez la digue au moment où elle tient. Elle tient. Grâce aux sacs que tu as portés.', effets: [{ mission: 'd_digue', statut: 'reussie' }, { stat: 'attributs.controleChakra', delta: 2 }, { stat: 'attributs.force', delta: 1 }, { stat: 'social.reputation', delta: 3 }] }, echec: { texte: 'L’eau te prend aux genoux, puis à la taille. Tu le rattrapes, mais vous êtes emportés tous les deux sur cent mètres avant qu’une branche vous arrête. Vivants. Trempés. Couverts de bleus.', effets: [{ mission: 'd_digue', statut: 'reussie' }, { blessure: { id: 'crue', nom: 'Contusions de la crue', gravite: 1, jours: 15 } }, { stat: 'attributs.force', delta: 1 }] } } },
      { id: 'digue', texte: 'Renforcer la digue pendant que les autres le cherchent', effets: [{ mission: 'd_digue', statut: 'reussie' }, { stat: 'attributs.force', delta: 2 }, { stat: 'jauges.fatigue', delta: 25 }], resultat: 'Tu portes des sacs toute la nuit, dans l’eau jusqu’aux genoux. Les autres ramènent le vieux. La digue tient. À l’aube, les paysans te portent sur leurs épaules, ce qui est très gênant et très agréable.' },
    ],
  },

  // ── Rang C ───────────────────────────────────────────────────────
  {
    ...base,
    id: 'mg_col',
    titre: 'Les bandits du col',
    lieu: 'montagnes_foudre',
    si: en('c_col'),
    personnages: ['@coequipierA', '@sensei'],
    texte: 'Le repaire est une ancienne tour de guet, au sommet du col. Dix hommes, des arcs, un chaudron sur le feu. Et parmi eux, un homme qui ne mange pas, assis à l’écart, avec un bandeau rayé : un ninja déserteur. {@sensei} trace le plan dans la neige. « Toi, tu prends l’aile gauche. Ne te fais pas tuer. »',
    choix: [
      { id: 'assaut', texte: 'Prendre l’aile gauche, comme prévu', test: { type: 'combat', difficulte: 54, attributs: { agilite: 1, force: 1, perception: 1, controleEmotionnel: 1 }, maitrises: { taijutsu: 1, arme: 1, ninjutsu: 1 }, arme: true, letal: true, manches: 3, allies: true, causeMort: 'tombé·e à l’assaut d’une tour de guet, au col', succes: { texte: 'Tu passes par le rocher, tu tombes sur les trois archers de l’aile gauche avant qu’ils encochent. Puis le déserteur se lève, et c’est sur toi qu’il vient. Il est meilleur que toi. Mais {@coequipierA} arrive par derrière, et à deux, vous le mettez à terre. {@sensei} te regarde, couvert·e de sang qui n’est pas le tien. « Bien. Maintenant, tu sais. »', effets: [{ mission: 'c_col', statut: 'reussie' }, { combatSur: ['taijutsu', 'ninjutsu'] }, { stat: 'attributs.force', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { relation: '@coequipierA', delta: { confiance: 6 } }] }, echec: { texte: 'Une flèche dans l’épaule dès le premier assaut. Tu te bats d’une main, mal. C’est {@sensei} qui finit le travail, seul{e:@sensei}, en cinq minutes, pendant que {@coequipierA} te tire à l’abri.', effets: [{ mission: 'c_col', statut: 'reussie' }, { blessure: { id: 'fleche_col', nom: 'Flèche dans l’épaule', gravite: 2, jours: 35 } }, { stat: 'attributs.perception', delta: 1 }] } } },
      { id: 'infiltrer', texte: 'Proposer de t’infiltrer seul·e la nuit', test: { type: 'competence', difficulte: 52, attributs: { discretion: 3, perception: 1 }, succes: { texte: '{@sensei} hésite, puis accepte. Tu te glisses dans la tour à deux heures, tu coupes les cordes des arcs, tu mélanges du somnifère au chaudron. À l’aube, l’assaut dure trente secondes. Le déserteur, réveillé trop tard, se rend sans combattre.', effets: [{ mission: 'c_col', statut: 'reussie' }, { stat: 'attributs.discretion', delta: 3 }, { stat: 'social.reputation', delta: 3 }, { relation: '@sensei', delta: { respect: 6 } }] }, echec: { texte: 'Le déserteur ne dormait pas. Il t’attrape par la cheville sur le rebord de la fenêtre. Le combat qui suit est confus et sanglant. La mission réussit. Tu as eu de la chance.', effets: [{ mission: 'c_col', statut: 'reussie' }, { blessure: { id: 'tour', nom: 'Blessures de la tour', gravite: 2, jours: 30 } }] } } },
    ],
  },
  {
    ...base,
    id: 'mg_bateau',
    titre: 'Le bateau des contrebandiers',
    lieu: 'cotes_brume',
    si: en('c_bateau'),
    texte: 'Un navire au mouillage, des caisses sans marque dans la cale. L’équipage vous regarde monter à bord avec des sourires trop larges. Dans la cale, sous une bâche : des armes, et des cages. Dans les cages, des enfants. Le capitaine referme l’écoutille derrière vous.',
    choix: [
      { id: 'combat', texte: 'Combattre dans la cale', test: { type: 'combat', difficulte: 56, attributs: { agilite: 2, force: 1, controleEmotionnel: 1 }, maitrises: { taijutsu: 1, arme: 1, ninjutsu: 1 }, arme: true, letal: true, manches: 3, allies: true, causeMort: 'tué·e dans la cale d’un navire de contrebande', succes: { texte: 'La cale est étroite, sombre, et elle tangue. Tu te bats entre les cages, en essayant de ne pas regarder les enfants. Deux mercenaires tombent. Le capitaine tente de mettre le feu aux caisses ; tu l’en empêches à un souffle près. Les enfants sortent des cages un par un. L’un d’eux ne te lâche plus la main jusqu’au port.', effets: [{ mission: 'c_bateau', statut: 'reussie' }, { combatSur: ['taijutsu'] }, { stat: 'social.reputation', delta: 6 }, { ethique: { compassion: 4 } }, { stat: 'attributs.agilite', delta: 2 }] }, echec: { texte: 'L’écoutille fermée, la cale en feu, un mercenaire sur ton dos. Vous sortez par le hublot, en emportant trois enfants sur sept. Le navire brûle au mouillage. Tu entendras les autres crier longtemps.', effets: [{ mission: 'c_bateau', statut: 'echouee' }, { blessure: { id: 'cale', nom: 'Brûlures de la cale', gravite: 2, jours: 35 } }, { stat: 'attributs.controleEmotionnel', delta: 3 }] } } },
      { id: 'ruse', texte: 'Faire croire au capitaine que vous êtes là pour acheter', test: { type: 'competence', difficulte: 54, attributs: { charisme: 2, intellect: 2 }, succes: { texte: 'Tu marchandes le prix d’un enfant sans trembler, en détestant chaque mot. Le capitaine baisse la garde, rouvre l’écoutille pour montrer « la marchandise ». C’est tout ce qu’il fallait. Les gardes du port sont déjà sur le quai.', effets: [{ mission: 'c_bateau', statut: 'reussie' }, { stat: 'attributs.charisme', delta: 2 }, { stat: 'attributs.intellect', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: -1 }] }, echec: { texte: 'Ta voix tremble au mauvais moment. Le capitaine comprend. Le combat éclate dans la cale, et il est long.', effets: [{ mission: 'c_bateau', statut: 'reussie' }, { stat: 'jauges.sante', delta: -18 }] } } },
    ],
  },
  {
    ...base,
    id: 'mg_deserteur',
    titre: 'Le genin qui a fui',
    lieu: 'frontiere_herbe',
    si: en('c_deserteur'),
    texte: 'Tu le trouves au troisième jour, dans une cabane de roseaux au milieu des marais. Il a ton âge. Il a les yeux cernés de quelqu’un qui ne dort plus depuis des semaines, et un kunai à la main. « Ils m’ont envoyé tuer un enfant. Je ne l’ai pas fait. Si je rentre, c’est moi qu’ils tueront. »',
    choix: [
      { id: 'ramener', texte: 'Le ramener, de force s’il le faut', test: { type: 'combat', difficulte: 56, attributs: { agilite: 2, force: 1, perception: 1 }, maitrises: { taijutsu: 2, arme: 1 }, arme: true, letal: true, manches: 3, causeMort: 'tué·e dans les marais par un genin qui ne voulait pas rentrer', succes: { texte: 'Il se bat comme quelqu’un qui n’a plus rien à perdre. Tu te bats comme quelqu’un qui a une mission. Tu gagnes. Pendant tout le trajet, il ne dit plus un mot. À la frontière, on le remet à son village. Tu ne sauras jamais ce qu’il est devenu. Tu y penseras souvent.', effets: [{ mission: 'c_deserteur', statut: 'reussie' }, { combatSur: ['taijutsu'] }, { stat: 'social.loyaute', delta: 4 }, { stat: 'attributs.force', delta: 2 }, { ethique: { compassion: -3 } }] }, echec: { texte: 'Il te blesse, gravement, et s’enfuit plus loin dans les marais. Il aurait pu t’achever. Il ne l’a pas fait. Ça te poursuit plus que la blessure.', effets: [{ mission: 'c_deserteur', statut: 'echouee' }, { blessure: { id: 'marais', nom: 'Blessure des marais', gravite: 2, jours: 40 } }] } } },
      { id: 'laisser', texte: 'Le laisser partir, et rapporter qu’il est mort', effets: [{ mission: 'c_deserteur', statut: 'echouee' }, { ethique: { compassion: 6, honneur: -3 } }, { stat: 'social.suspicion', delta: 3 }, { drapeau: 'deserteur_epargne' }], resultat: 'Tu lui donnes ta gourde et la moitié de tes vivres, et tu lui indiques la route des marchands vers l’ouest. À ton retour, tu rapportes une noyade. Le dossier est classé. {@sensei} te regarde un long moment, sans rien dire. {Il:@sensei} sait. {Il:@sensei} ne dira rien non plus.' },
      { id: 'plaider', texte: 'Le convaincre de rentrer, en promettant de plaider pour lui', test: { type: 'competence', difficulte: 54, attributs: { charisme: 3, controleEmotionnel: 1 }, succes: { texte: 'Tu lui parles toute la nuit. À l’aube, il pose son kunai. Tu tiens parole : devant le conseil de son village, tu racontes l’ordre qu’il a refusé. Il n’est pas exécuté. Il est rayé des listes de ninjas, et renvoyé à la vie civile. C’est mieux que la mort. Il te serre la main avant de partir.', effets: [{ mission: 'c_deserteur', statut: 'reussie' }, { stat: 'attributs.charisme', delta: 3 }, { ethique: { honneur: 4, compassion: 4 } }, { stat: 'social.reputation', delta: 4 }] }, echec: { texte: 'Il ne te croit pas. Il s’enfuit dans la nuit. Mission échouée. Tu as au moins essayé.', effets: [{ mission: 'c_deserteur', statut: 'echouee' }, { stat: 'attributs.charisme', delta: 1 }] } } },
    ],
  },
  {
    ...base,
    id: 'mg_cendres',
    titre: 'Le village en cendres',
    lieu: 'frontiere_herbe',
    si: en('c_cendres'),
    personnages: ['@coequipierA'],
    texte: 'Le hameau n’est plus qu’un champ de poutres noires. Pas de corps. Des traces de chariots qui partent vers le nord. Et dans le puits, une petite fille cachée depuis quatre jours, qui ne parle pas. {@coequipierA} veut suivre les traces tout de suite.',
    choix: [
      { id: 'suivre', texte: 'Suivre les traces, et frapper le camp à la nuit', test: { type: 'combat', difficulte: 56, attributs: { perception: 2, agilite: 1, discretion: 1 }, maitrises: { taijutsu: 1, arme: 1, ninjutsu: 1 }, arme: true, letal: true, manches: 3, allies: true, causeMort: 'tombé·e en libérant les villageois d’un hameau brûlé', succes: { texte: 'Les traces mènent à un camp d’esclavagistes, au bord de la rivière. Les villageois sont enchaînés au milieu. Vous frappez à minuit. Le combat est rapide, sale, désespéré. À l’aube, trente villageois rentrent vers leurs cendres. La petite fille du puits court vers une femme et ne la lâche plus.', effets: [{ mission: 'c_cendres', statut: 'reussie' }, { combatSur: ['taijutsu'] }, { stat: 'social.reputation', delta: 7 }, { ethique: { compassion: 4 } }, { relation: '@coequipierA', delta: { confiance: 6 } }] }, echec: { texte: 'Ils vous attendaient. Vous libérez une dizaine de villageois avant de devoir fuir. Les autres sont emmenés plus loin, vers des marchés dont personne ne revient.', effets: [{ mission: 'c_cendres', statut: 'echouee' }, { blessure: { id: 'camp', nom: 'Blessures du camp', gravite: 2, jours: 40 } }] } } },
      { id: 'fille', texte: 'D’abord faire parler la petite fille', test: { type: 'competence', difficulte: 50, attributs: { charisme: 2, controleEmotionnel: 2 }, succes: { texte: 'Il te faut toute la journée. Elle finit par chuchoter : des hommes avec des chaînes, et un homme avec un œil de verre qui les commandait. Cet homme-là, le renseignement le cherche depuis deux ans. Ton rapport remonte jusqu’au Kage. Une unité entière part le lendemain.', effets: [{ mission: 'c_cendres', statut: 'reussie' }, { stat: 'attributs.charisme', delta: 2 }, { indice: 'oeil_de_verre' }, { ethique: { compassion: 5 } }] }, echec: { texte: 'Elle ne parle pas. Tu la ramènes au village. Les traces, elles, sont effacées par la pluie de la nuit.', effets: [{ mission: 'c_cendres', statut: 'echouee' }, { ethique: { compassion: 3 } }] } } },
    ],
  },
  {
    ...base,
    id: 'mg_medecin',
    titre: 'Le médecin de l’épidémie',
    lieu: 'route_commerce',
    si: en('c_medecin'),
    texte: 'Le médecin est une vieille femme acariâtre qui marche plus vite que toi. Au septième jour, sur un pont de corde, des bandits vous barrent la route. Ils ne veulent pas d’argent. Ils veulent ses remèdes : chez eux aussi, la fièvre a frappé.',
    choix: [
      { id: 'combat', texte: 'Forcer le passage', test: { type: 'combat', difficulte: 52, attributs: { agilite: 2, force: 1, perception: 1 }, maitrises: { taijutsu: 1, arme: 1 }, arme: true, letal: true, manches: 2, causeMort: 'tombé·e d’un pont de corde en protégeant un médecin', succes: { texte: 'Le pont tangue sous les coups. Tu en fais tomber deux dans la rivière, le troisième recule. Vous passez. Au bourg, la vieille femme sauve quarante personnes en dix jours. Elle ne te remercie jamais. Elle te laisse juste porter sa sacoche, ce qui, chez elle, est une déclaration d’amitié.', effets: [{ mission: 'c_medecin', statut: 'reussie' }, { combatSur: ['taijutsu'] }, { stat: 'attributs.agilite', delta: 2 }] }, echec: { texte: 'La corde cède. Tu tombes avec deux bandits. Tu remontes la rivière à la nage, à moitié noyé·e, et retrouves le médecin qui a continué seule. Elle est arrivée. Toi, tu es arrivé·e deux jours après, avec la fièvre.', effets: [{ mission: 'c_medecin', statut: 'reussie' }, { blessure: { id: 'fievre', nom: 'Fièvre des marais', gravite: 2, jours: 30 } }] } } },
      { id: 'partager', texte: 'Lui demander de les soigner, eux aussi', effets: [{ mission: 'c_medecin', statut: 'reussie' }, { ethique: { compassion: 6 } }, { stat: 'attributs.charisme', delta: 2 }, { temps: 3 }], resultat: 'Elle te fixe comme si tu étais idiot·e. Puis elle grogne, pose sa sacoche, et soigne leur village en trois jours. Les bandits vous escortent ensuite jusqu’au bourg, et plus personne n’ose vous attaquer. « Trop tendre, toi », te dit-elle. Elle a les yeux humides.' },
    ],
  },
  {
    ...base,
    id: 'mg_tournoi',
    titre: 'Le garde du corps',
    lieu: 'route_commerce',
    si: en('c_tournoi'),
    texte: 'Le seigneur est gros, bavard et terrorisé. Le tournoi d’archers dure trois jours. Au troisième, pendant la finale, tu remarques un archer qui ne vise pas la cible : il vise la tribune. Il lui reste une demi-seconde avant de lâcher.',
    choix: [
      { id: 'intercepter', texte: 'Te jeter entre la flèche et le seigneur', test: { type: 'combat', difficulte: 56, attributs: { agilite: 3, perception: 1 }, maitrises: { taijutsu: 1, arme: 1 }, arme: true, letal: true, manches: 2, causeMort: 'tué·e par la flèche qui visait un seigneur, pendant un tournoi d’archers', succes: { texte: 'Ton kunai dévie la flèche à un pouce du visage du seigneur. L’archer saute de l’estrade et s’enfuit dans la foule ; tu le rattrapes au pied des écuries. C’est un ninja, payé par le frère du seigneur. Le seigneur te couvre d’or et pleure dans ton épaule. Tu aurais préféré l’or seul.', effets: [{ mission: 'c_tournoi', statut: 'reussie' }, { stat: 'jauges.ryo', delta: 80 }, { combatSur: ['taijutsu'] }, { stat: 'attributs.perception', delta: 2 }] }, echec: { texte: 'La flèche te traverse l’épaule au lieu de sa gorge. Le seigneur est vivant. Toi aussi, de justesse. L’archer, lui, a disparu.', effets: [{ mission: 'c_tournoi', statut: 'reussie' }, { blessure: { id: 'fleche_tournoi', nom: 'Flèche dans l’épaule', gravite: 2, jours: 35 } }, { stat: 'social.reputation', delta: 3 }] } } },
      { id: 'crier', texte: 'Crier pour faire baisser le seigneur', effets: [{ mission: 'c_tournoi', statut: 'reussie' }, { stat: 'attributs.perception', delta: 2 }, { stat: 'social.reputation', delta: 2 }], resultat: 'Le seigneur, terrorisé depuis trois jours, plonge sous la table avant même que tu aies fini ton cri. La flèche se plante dans son fauteuil. Les gardes prennent l’archer. Le seigneur te serre la main en tremblant. « Je savais que vous seriez utile. » Il ne le savait pas.' },
    ],
  },

  // ── Les bagarres du village ──────────────────────────────────────
  {
    chapitre: 1,
    chapitres: [1, 2, 3],
    arc: 'formation',
    id: 'vf_racket',
    titre: 'Le racket du marché',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 5,
    repetable: { delaiJours: 400, max: 2 },
    si: { tout: [ACTIF, { age: { min: 9, max: 15 } }] },
    texte: 'Quatre grands de la dernière année rackettent le vieux vendeur de brochettes. Ils renversent son étal pour rire. Personne ne bouge. Le vieux ramasse ses brochettes dans la poussière sans rien dire.',
    choix: [
      { id: 'foncer', texte: 'Foncer dans le tas', test: { type: 'combat', difficulte: 44, attributs: { force: 1, agilite: 2 }, maitrises: { taijutsu: 2 }, manches: 2, succes: { texte: 'Tu en fais mordre la poussière à deux. Le troisième trébuche dans l’étal. Le quatrième s’enfuit. Le vendeur te tend une brochette, puis une autre. « À vie, petit·e. Tu manges ici à vie. »', effets: [{ stat: 'attributs.force', delta: 2 }, { stat: 'social.reputation', delta: 2 }, { entrainer: 'taijutsu', jours: 10 }] }, echec: { texte: 'Tu prends une raclée mémorable. Mais tu te relèves à chaque fois, et à la cinquième, ils s’en vont, mal à l’aise. Le vendeur soigne ta lèvre avec de la sauce soja. Ça pique.', effets: [{ stat: 'jauges.sante', delta: -10 }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { stat: 'attributs.force', delta: -1 }] } } },
      { id: 'diversion', texte: 'Créer une diversion en renversant un tonneau d’eau', effets: [{ stat: 'attributs.intellect', delta: 1 }, { stat: 'attributs.agilite', delta: 1 }], resultat: 'L’eau inonde la rue, les grands glissent, le vendeur s’échappe avec sa caisse. Personne ne sait d’où est venu le tonneau. Malin vaut parfois mieux que fort.' },
      { id: 'adulte', texte: 'Aller chercher un chūnin', effets: [{ stat: 'attributs.charisme', delta: 1 }], resultat: 'Le chūnin de garde n’a même pas besoin de parler. Il regarde les quatre grands, et ils partent. Tu retiens la leçon : le bandeau, ça compte.' },
    ],
  },
  {
    chapitre: 1,
    chapitres: [1, 2, 3],
    arc: 'formation',
    id: 'vf_chien',
    titre: 'Le chien enragé',
    categorie: 'quotidien',
    lieu: '$village',
    poids: 4,
    si: { tout: [ACTIF, { age: { min: 8, max: 14 } }] },
    texte: 'Un cri dans la rue principale. Un chien errant, la bave aux lèvres, les yeux fous, fonce vers un groupe d’enfants qui jouent aux billes. Tu es le seul à avoir vu. Tu as trois secondes.',
    choix: [
      { id: 'intercepter', texte: 'L’intercepter', test: { type: 'combat', difficulte: 42, attributs: { agilite: 2, force: 1 }, maitrises: { taijutsu: 1, arme: 1 }, arme: true, succes: { texte: 'Tu le plaques au sol à deux pas des enfants. Il se débat, il mord dans le vide. Un chūnin arrive en courant et l’achève. Les enfants te regardent comme un héros. Toi, tu vérifies cent fois qu’il ne t’a pas mordu.', effets: [{ stat: 'attributs.agilite', delta: 2 }, { stat: 'social.reputation', delta: 3 }] }, echec: { texte: 'Il te mord le bras. Les enfants s’enfuient, sains et saufs. Toi, tu passes deux semaines chez le médecin, avec des piqûres dans le ventre tous les jours.', effets: [{ blessure: { id: 'morsure_chien', nom: 'Morsure', gravite: 2, jours: 20 } }, { stat: 'social.reputation', delta: 2 }] } } },
      { id: 'enfants', texte: 'Attraper les enfants et les hisser sur un muret', effets: [{ stat: 'attributs.force', delta: 1 }, { stat: 'attributs.agilite', delta: 1 }, { ethique: { compassion: 3 } }], resultat: 'Tu les soulèves un par un, comme des sacs de riz. Le chien passe sous le muret en grondant. Un chūnin s’en charge. Une des petites t’offre sa plus belle bille. Tu la gardes des années.' },
    ],
  },
  {
    chapitre: 1,
    chapitres: [1, 2, 3],
    arc: 'formation',
    id: 'vf_demonstration',
    titre: 'Le combat de démonstration',
    categorie: 'entrainement',
    lieu: '$terrain',
    poids: 4,
    repetable: { delaiJours: 365, max: 2 },
    si: { tout: [ACTIF, { age: { min: 10, max: 16 } }] },
    texte: 'Un chūnin de passage organise un combat de démonstration pour les élèves et les jeunes genin. Il cherche un adversaire « qui n’a pas peur ». Personne ne lève la main. Il te regarde. « Toi. Tu as les yeux de quelqu’un qui veut. »',
    choix: [
      { id: 'accepter', texte: 'Monter sur le terrain', test: { type: 'combat', difficulte: 50, attributs: { agilite: 1, force: 1, perception: 1, controleEmotionnel: 1 }, maitrises: { taijutsu: 2, ninjutsu: 1 }, manches: 3, succes: { texte: 'Tu ne gagnes pas. Personne ne gagne contre un chūnin. Mais tu le touches, une fois, à l’épaule, et la foule hurle. Il sourit et arrête le combat. « Trois ans, et tu seras là où je suis. » Il le dit à voix haute, pour que tout le monde entende.', effets: [{ entrainer: 'taijutsu', jours: 20 }, { stat: 'attributs.agilite', delta: 1 }, { stat: 'attributs.force', delta: 1 }, { stat: 'social.reputation', delta: 4 }] }, echec: { texte: 'Il te met à terre gentiment, trois fois, en expliquant chaque erreur à la foule. Humiliant. Instructif. Tu notes tout, le soir, dans un carnet.', effets: [{ entrainer: 'taijutsu', jours: 15 }, { stat: 'attributs.perception', delta: 2 }, { stat: 'attributs.controleEmotionnel', delta: -1 }] } } },
      { id: 'observer', texte: 'Refuser, et regarder un autre se faire battre', effets: [{ stat: 'attributs.perception', delta: 2 }, { stat: 'attributs.intellect', delta: 1 }], resultat: 'Un grand se porte volontaire et se fait démonter en dix secondes. Toi, tu as vu le pas d’appui avant chaque attaque du chūnin. La prochaine fois, tu sauras.' },
    ],
  },
  {
    chapitre: 1,
    chapitres: [1, 2, 3],
    arc: 'formation',
    id: 'vf_incendie',
    titre: 'L’incendie du quartier bas',
    categorie: 'civils',
    lieu: '$village',
    poids: 3,
    si: { tout: [ACTIF, { age: { min: 10, max: 16 } }] },
    personnages: ['@coequipierB'],
    texte: 'Le quartier bas brûle. Dans la fumée, pendant que tout le monde court avec des seaux, deux hommes masqués sortent d’une maison les bras chargés. Des pillards, qui profitent du feu. {@coequipierB} les a vus aussi.',
    choix: [
      { id: 'poursuivre', texte: 'Les poursuivre dans la fumée', test: { type: 'combat', difficulte: 48, attributs: { agilite: 2, perception: 1, force: 1 }, maitrises: { taijutsu: 2 }, manches: 2, allies: true, succes: { texte: 'Vous les rattrapez dans une ruelle, toussant tous les quatre. Le combat est bref et aveugle. Quand la fumée se dissipe, ils sont au sol, et les bijoux d’une vieille dame sont éparpillés autour. Elle vient les ramasser elle-même, et vous embrasse les mains.', effets: [{ stat: 'attributs.agilite', delta: 1 }, { stat: 'attributs.perception', delta: 1 }, { stat: 'social.reputation', delta: 4 }, { relation: '@coequipierB', delta: { confiance: 5 } }] }, echec: { texte: 'La fumée te prend à la gorge. Tu perds leur trace. {@coequipierB} te ramène à l’air libre, toussant autant que toi.', effets: [{ stat: 'jauges.sante', delta: -10 }, { relation: '@coequipierB', delta: { attachement: 4 } }] } } },
      { id: 'seaux', texte: 'Laisser les pillards : il y a des gens dans les maisons', effets: [{ ethique: { compassion: 5 } }, { stat: 'attributs.force', delta: 1 }, { stat: 'jauges.fatigue', delta: 20 }, { stat: 'social.reputation', delta: 3 }], resultat: 'Tu sors une grand-mère et un bébé d’une maison qui s’effondre derrière toi. Les pillards s’enfuient avec leur butin. Le soir, couvert·e de suie, tu te dis que tu as fait le bon choix. Tu te le diras longtemps.' },
    ],
  },
];
