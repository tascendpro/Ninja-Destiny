import type { EventDef } from '../../engine/types';
import { segmentsParVillage } from './outils';

const DEPART6 = { ageDepart: 6 } as const;

export const ORIGINES: EventDef[] = [
  // ───────── Premier matin, un par village ─────────
  {
    id: 'o_village_konoha',
    titre: 'Le jour des feuilles',
    chapitre: 1,
    arc: 'origines',
    categorie: 'quotidien',
    lieu: '$village',
    priorite: 100,
    si: { tout: [{ village: 'konoha' }, DEPART6] },
    personnages: ['@parent'],
    texte:
      'Le printemps de l’an 52 recouvre Konoha d’une odeur de cèdre et de poussière chaude. Du haut de la falaise, les visages sculptés des Hokage veillent sur des rues où l’on parle encore de la dernière guerre à voix basse.\n\nTu as six ans, et {parent} t’emmène inscrire ton nom à l’Académie. Sur la place, une patrouille de la police militaire Uchiha encercle un marchand accusé de vol. L’homme jure qu’il est innocent. La foule regarde. Personne ne dit rien.',
    choix: [
      {
        id: 'demander',
        texte: 'Demander à {parent} pourquoi personne ne l’aide',
        effets: [
          { ethique: { compassion: 6 } },
          { relation: '@parent', delta: { confiance: 4 } },
          { drapeau: 'question_injustice' },
          { decouvrir: 'organisation:police_uchiha' },
        ],
        resultat:
          '{Parent} se penche vers toi. « Parce qu’ici, la police appartient à un clan, et que tout le monde a peur de ce clan — et que ce clan a peur du village. » {Il:@parent} te serre la main. « Retiens ça. Et ne le répète pas. »',
      },
      {
        id: 'fixer',
        texte: 'Fixer les policiers sans baisser les yeux',
        effets: [{ ethique: { honneur: 6 } }, { drapeau: 'regard_police' }, { decouvrir: 'organisation:police_uchiha' }],
        resultat: [
          { texte: 'L’un des policiers croise ton regard. Ses yeux s’allument brièvement de rouge — puis il détourne la tête, comme amusé.' },
          { si: { clan: 'uchiha' }, texte: '« L’enfant de la maison d’à côté », murmure-t-il à son collègue. « Déjà le regard du clan. »' },
        ],
      },
      {
        id: 'academie',
        texte: 'Tirer {parent} par la manche : tu veux voir l’Académie',
        effets: [{ ethique: { ambition: 6 } }, { stat: 'attributs.controleEmotionnel', delta: 1 }],
        resultat:
          'Tu ne te retournes pas. L’Académie est plus grande que dans tes rêves, et le bruit de la place s’efface derrière toi. Bien plus tard, tu te demanderas ce qu’est devenu le marchand.',
      },
    ],
  },
  {
    id: 'o_village_suna',
    titre: 'L’eau du matin',
    chapitre: 1,
    arc: 'origines',
    categorie: 'civils',
    lieu: '$village',
    priorite: 100,
    si: { tout: [{ village: 'suna' }, DEPART6] },
    personnages: ['@coequipierA'],
    texte:
      'À Suna, la journée commence par la file d’eau. Chaque famille reçoit sa ration au puits du quartier, sous l’œil d’un chūnin qui note tout. Le daimyō a encore réduit le budget du village ; cette saison, les rations ont baissé d’un quart.\n\nDevant toi, une fillette maigre tousse à s’en plier en deux. Sa gourde est vide : elle a renversé sa ration en tombant. Elle s’appelle {@coequipierA}, et elle entre à l’Académie demain, comme toi.',
    choix: [
      {
        id: 'donner',
        texte: 'Lui donner la moitié de ta ration',
        effets: [
          { relation: '@coequipierA', delta: { amitie: 15, confiance: 10 } },
          { ethique: { compassion: 8 } },
          { stat: 'jauges.sante', delta: -5 },
          { souvenir: 'Tu lui as donné ton eau, le premier jour.', pnj: '@coequipierA' },
        ],
        resultat: 'La journée est longue et ta gorge brûle. Mais le soir, {@coequipierA} te retrouve et te glisse une figue sèche dans la main sans un mot.',
      },
      {
        id: 'signaler',
        texte: 'Prévenir le chūnin qui tient le registre',
        effets: [{ stat: 'social.loyaute', delta: 4 }, { relation: '@coequipierA', delta: { amitie: 4 } }, { drapeau: 'confiance_institutions' }],
        resultat: 'Le chūnin soupire, vérifie son registre et accorde une demi-ration supplémentaire. « Une seule fois », dit-il. Le système fonctionne — pour cette fois.',
      },
      {
        id: 'garder',
        texte: 'Garder ta ration : ta famille en a besoin',
        effets: [{ ethique: { compassion: -5 } }, { stat: 'attributs.controleEmotionnel', delta: 2 }, { drapeau: 'pragmatisme_desert' }],
        resultat: 'Au désert, on apprend tôt que l’eau donnée ne revient pas. Tu ne la regardes pas en passant. Elle, si.',
      },
    ],
  },
  {
    id: 'o_village_kiri',
    titre: 'La brume qui emporte',
    chapitre: 1,
    arc: 'origines',
    categorie: 'politique',
    lieu: '$village',
    priorite: 100,
    si: { tout: [{ village: 'kiri' }, DEPART6] },
    texte: [
      {
        texte:
          'À Kiri, la brume ne se lève jamais tout à fait. Ce matin, elle avale le bruit des pas des chasseurs masqués qui remontent ta ruelle. Ils emmènent une famille entière — accusée de porter un kekkei genkai. La mère ne crie pas. Elle sait que crier ne sert à rien.\n\nDans l’ombre d’un porche, un garçon de ton âge s’est caché. Il te regarde. Il a compris que tu l’avais vu.',
      },
      { si: { clan: 'yuki' }, texte: 'Tu reconnais la famille : ce sont des cousins éloignés de ta mère. C’est ta lignée qu’on traque.' },
    ],
    choix: [
      {
        id: 'cacher',
        texte: 'Lui faire signe de se taire et détourner l’attention des chasseurs',
        effets: [
          { ethique: { compassion: 10, honneur: 4 } },
          { stat: 'social.suspicion', delta: 8 },
          { secret: 'enfant_cache' },
          { drapeau: 'protege_enfant_brume' },
        ],
        resultat:
          'Tu fais tomber un panier de poissons au milieu de la ruelle. Les chasseurs t’injurient, te bousculent — et passent. Quand tu te retournes, le porche est vide. Un des masques, pourtant, t’a regardé un peu trop longtemps.',
      },
      {
        id: 'denoncer',
        texte: 'Le montrer du doigt aux chasseurs',
        effets: [
          { stat: 'social.loyaute', delta: 8 },
          { ethique: { compassion: -12 } },
          { stat: 'attributs.controleEmotionnel', delta: -3 },
          { drapeau: 'a_denonce_enfant' },
        ],
        resultat:
          'Un chasseur hoche la tête et t’ébouriffe les cheveux. « Bon réflexe. » Le garçon ne se débat pas. Cette nuit-là, tu ne dors pas, et tu ne sais pas pourquoi.',
      },
      {
        id: 'detourner',
        texte: 'Détourner les yeux et rentrer chez toi',
        effets: [{ ethique: { honneur: -4 } }, { stat: 'attributs.discretion', delta: 2 }, { drapeau: 'silence_brume' }],
        resultat: 'Tu rentres. La brume se referme derrière toi, et Kiri t’enseigne sa première leçon : ne rien voir, c’est survivre.',
      },
    ],
  },
  {
    id: 'o_village_kumo',
    titre: 'Le vent des falaises',
    chapitre: 1,
    arc: 'origines',
    categorie: 'politique',
    lieu: '$village',
    priorite: 100,
    si: { tout: [{ village: 'kumo' }, DEPART6] },
    personnages: ['@coequipierB'],
    texte:
      'Les ponts de Kumo tremblent sous le vent, et tu as appris à marcher au milieu sans regarder le vide. Ce matin, une patrouille revient du col avec un enfant étranger, poignets liés, bandeau d’un autre village arraché. Un « invité diplomatique », dit le capitaine en riant.\n\nUne bande d’enfants le suit en lui jetant des cailloux. Parmi eux, {@coequipierB}, le grand garçon timide de ta rue, qui lance sans viser — pour faire comme les autres.',
    choix: [
      {
        id: 'partager',
        texte: 'Glisser ton pain à l’enfant étranger',
        effets: [{ ethique: { compassion: 8 } }, { drapeau: 'otage_aide' }, { secret: 'otages_kumo' }, { stat: 'social.suspicion', delta: 3 }],
        resultat:
          'L’enfant te regarde comme on regarde une ruse. Puis il mange. Le capitaine t’observe sans rien dire. Le soir, {parent} t’explique à voix basse que Kumo « collectionne » les enfants des lignées étrangères. Et que tu ne dois jamais en parler.',
      },
      {
        id: 'suivre',
        texte: 'Ramasser un caillou et suivre la bande',
        effets: [
          { ethique: { compassion: -6, ambition: 4 } },
          { relation: '@coequipierB', delta: { amitie: 6 } },
          { stat: 'social.reputation', delta: 2 },
        ],
        resultat: 'Tu lances. Tu rates, exprès ou non. {@coequipierB} te sourit, soulagé de ne plus être le seul à le faire à contrecœur.',
      },
      {
        id: 'observer',
        texte: 'Observer le capitaine de la patrouille',
        effets: [{ stat: 'attributs.perception', delta: 3 }, { drapeau: 'observe_patrouille' }],
        resultat:
          'Le capitaine porte une lame qui crépite de foudre au repos, et il compte les enfants de la rue du regard — pas l’étranger : vous. Tu comprends qu’il ne cherche pas seulement des otages, mais des recrues.',
      },
    ],
  },
  {
    id: 'o_village_iwa',
    titre: 'La carrière',
    chapitre: 1,
    arc: 'origines',
    categorie: 'civils',
    lieu: 'carrieres_terre',
    priorite: 100,
    si: { tout: [{ village: 'iwa' }, DEPART6] },
    personnages: ['@coequipierA'],
    texte:
      'Iwa vit au rythme des carrières. Ce matin, tu accompagnes {parent} jusqu’aux galeries de l’est quand le sol gronde. Un pan de roche s’effondre sur une entrée. Des cris montent de dessous.\n\nUn garçon couvert de poussière, {@coequipierA}, s’est jeté sur les pierres à mains nues. Son oncle est là-dessous.',
    choix: [
      {
        id: 'creuser',
        texte: 'Creuser avec lui',
        test: {
          type: 'competence',
          difficulte: 38,
          attributs: { force: 2, controleEmotionnel: 1 },
          maitrises: { taijutsu: 1 },
          succes: {
            texte: 'Vos mains saignent, mais vous dégagez une poche d’air avant l’arrivée des ninjas. L’oncle de {@coequipierA} respire encore. Les mineurs se souviendront de ton nom.',
            effets: [
              { relation: '@coequipierA', delta: { amitie: 15, confiance: 10 } },
              { stat: 'social.reputation', delta: 4 },
              { ethique: { compassion: 5 } },
            ],
          },
          echec: {
            texte: 'Une pierre roule et t’écrase la main. Tu continues malgré tout, jusqu’à ce qu’un adulte te tire en arrière. {@coequipierA} ne t’oubliera pas.',
            effets: [
              { blessure: { id: 'main_ecrasee', nom: 'Main écrasée', gravite: 1, jours: 40 } },
              { relation: '@coequipierA', delta: { amitie: 12 } },
            ],
          },
        },
      },
      {
        id: 'courir',
        texte: 'Courir chercher les ninjas de garde',
        effets: [{ stat: 'social.loyaute', delta: 4 }, { stat: 'attributs.agilite', delta: 2 }, { relation: '@coequipierA', delta: { amitie: 5 } }],
        resultat: 'Tu cours plus vite que jamais. Un chūnin de la famille Ishikawa soulève la roche d’un seul geste, comme si elle était faite de pain. Tu comprends ce jour-là ce qu’est un ninja.',
      },
      {
        id: 'rassurer',
        texte: 'Parler à l’homme enseveli pour qu’il ne perde pas courage',
        effets: [{ stat: 'attributs.charisme', delta: 3 }, { ethique: { compassion: 6 } }, { relation: '@coequipierA', delta: { amitie: 8 } }],
        resultat: 'Tu colles ta bouche contre une fente et tu parles, de tout, de rien, pendant une heure. Quand on le sort, il demande à voir « la petite voix ».',
      },
    ],
  },

  // ───────── Départ à 10 ans : les souvenirs ─────────
  {
    id: 'o_souvenirs',
    titre: 'Quatre années',
    chapitre: 1,
    arc: 'origines',
    categorie: 'enfance',
    lieu: '$village',
    priorite: 100,
    si: { ageDepart: 10 },
    personnages: ['@coequipierA'],
    texte: [
      ...segmentsParVillage({
        konoha: 'Quatre années ont passé depuis ton entrée à l’Académie de Konoha. Tu connais chaque latte du parquet des salles de classe et chaque cicatrice des poteaux d’entraînement.',
        suna: 'Quatre années ont passé depuis ton entrée à l’Académie de Suna. Tu as appris à t’entraîner à l’aube, avant que le soleil ne rende le sable brûlant.',
        kiri: 'Quatre années ont passé depuis ton entrée à l’Académie de Kiri. Tu as appris à ne pas te faire remarquer — ni trop faible, ni trop fort.',
        kumo: 'Quatre années ont passé depuis ton entrée à l’Académie de Kumo. Tes muscles se souviennent de chaque punition collective.',
        iwa: 'Quatre années ont passé depuis ton entrée à l’Académie d’Iwa. Tu as porté plus de pierres que tu ne pourrais en compter.',
      }),
      { texte: 'Ton amitié avec {@coequipierA} est devenue la plus solide de ta vie. Mais au moment d’entrer dans ta dernière année, un souvenir revient sans cesse — celui qui t’a fait.' },
    ],
    choix: [
      {
        id: 'injustice',
        texte: 'Une injustice que tu n’as jamais oubliée',
        effets: [
          { ethique: { compassion: 10 } },
          { drapeau: 'question_injustice' },
          { relation: '@coequipierA', delta: { amitie: 15 } },
          { si: { clan: 'inuzuka' }, alors: [{ role: 'ninken', pnj: 'ninken_kuro' }, { tenterEveil: 'ninken_lien', intensite: 100 }, { relation: 'ninken_kuro', delta: { amitie: 40, confiance: 40 } }] },
        ],
        resultat:
          'Un jour, tu as vu des adultes regarder ailleurs pendant qu’on écrasait quelqu’un de plus faible. Ce jour-là, tu t’es promis de ne jamais devenir comme eux. La promesse tient encore.',
      },
      {
        id: 'aine',
        texte: 'Un soir où {aine} t’a appris à lancer',
        effets: [
          { relation: '@aine', delta: { amitie: 15, confiance: 10 } },
          { entrainer: 'famille_kunai', jours: 40, mentor: true },
          { relation: '@coequipierA', delta: { amitie: 15 } },
          { si: { clan: 'inuzuka' }, alors: [{ role: 'ninken', pnj: 'ninken_hayate' }, { tenterEveil: 'ninken_lien', intensite: 100 }, { relation: 'ninken_hayate', delta: { amitie: 40, confiance: 40 } }] },
        ],
        resultat: '{AineNom} riait de tes lancers ratés, puis corrigeait ton poignet avec une patience qu’{aine_il} n’a pour personne d’autre. Tu lances encore exactement comme ce soir-là.',
      },
      {
        id: 'clan',
        texte: 'Le jour où tu as compris ce que {clanOuFamille} attendait de toi',
        effets: [
          { stat: 'social.confianceClan', delta: 10 },
          { ethique: { honneur: 6 } },
          { relation: '@coequipierA', delta: { amitie: 15 } },
          { si: { clan: 'inuzuka' }, alors: [{ role: 'ninken', pnj: 'ninken_tsumugi' }, { tenterEveil: 'ninken_lien', intensite: 100 }, { relation: 'ninken_tsumugi', delta: { amitie: 40, confiance: 40 } }] },
        ],
        resultat: 'On t’a regardé·e, ce jour-là, comme on regarde un investissement. Tu as décidé d’en être digne. Ou de le leur faire payer. Tu ne sais toujours pas laquelle des deux.',
      },
    ],
  },

  // ───────── Enfance partagée ─────────
  {
    id: 'o_famille_soir',
    titre: 'Le soir où {aineNom} est rentré{aine_e} tard',
    chapitre: 1,
    arc: 'origines',
    categorie: 'enfance',
    lieu: '$maison',
    enchaine: true,
    si: { pnj: '@aine', etat: ['vivant', 'blesse'] },
    personnages: ['@aine', '@parent'],
    texte:
      '{AineNom} rentre longtemps après la nuit tombée, la lèvre fendue et le bandeau d’élève de travers. {Parent} ne crie pas : {parent_il} se tait, et c’est pire.\n\nPlus tard, dans la chambre, {aine} s’assoit au bord de ton futon. « Ils m’ont mis contre trois aînés à l’entraînement. Pour voir si je tenais. » {Aine_il} hésite. « Promets-moi un truc. »',
    choix: [
      {
        id: 'proteger',
        texte: 'Promettre de devenir assez fort·e pour {le:@aine} protéger',
        effets: [
          { promesse: 'proteger_aine', pnj: '@aine', texte: 'Devenir assez fort·e pour protéger {aineNom}.' },
          { relation: '@aine', delta: { amitie: 8, attachement: 10 } },
          { ethique: { ambition: 4 } },
          { planifier: 'o_ami', dansJours: 120 },
        ],
        resultat: '{Aine} rit doucement. « C’est moi qui suis censé{aine_e} te protéger, idiot·e. » Mais {aine_il} ne dit pas non.',
      },
      {
        id: 'rester_soi',
        texte: 'Promettre de ne jamais devenir comme les adultes qui font ça',
        effets: [
          { promesse: 'rester_soi', pnj: '@aine', texte: 'Ne jamais devenir comme les adultes qui envoient des enfants au combat.' },
          { ethique: { compassion: 8 } },
          { relation: '@aine', delta: { confiance: 10 } },
          { planifier: 'o_ami', dansJours: 120 },
        ],
        resultat: '{Aine} te regarde longtemps. « Garde-la, celle-là. C’est la plus dure à tenir. »',
      },
      {
        id: 'denoncer',
        texte: 'Aller dire la vérité à {parent}',
        effets: [
          { relation: '@parent', delta: { confiance: 8 } },
          { relation: '@aine', delta: { confiance: -12 } },
          { stat: 'social.loyaute', delta: 3 },
          { planifier: 'o_ami', dansJours: 120 },
        ],
        resultat: '{Parent} t’écoute, puis va voir l’instructeur le lendemain. Les entraînements truqués cessent. {AineNom} ne te parle plus pendant deux semaines.',
      },
    ],
  },
  {
    id: 'o_ami',
    titre: 'La cabane',
    chapitre: 1,
    arc: 'origines',
    categorie: 'amitie',
    lieu: 'foret_feu',
    enchaine: true,
    si: { pnj: '@coequipierA', etat: ['vivant', 'blesse'] },
    personnages: ['@coequipierA'],
    texte: [
      { texte: '{@coequipierA} t’entraîne loin des rues, jusqu’à un abri de planches et de toile tendu entre des rochers. « Personne ne connaît cet endroit. Personne. Maintenant, toi. »' },
      { si: { village: 'suna' }, texte: 'L’abri est creusé dans un repli de falaise, à l’ombre ; on y entend le vent chanter.' },
      { si: { village: 'kiri' }, texte: 'L’abri est une barque échouée, cachée par les roseaux, où la brume n’entre pas.' },
    ],
    choix: [
      {
        id: 'jurer',
        texte: 'Jurer de ne jamais en parler',
        effets: [
          { promesse: 'cabane', pnj: '@coequipierA', texte: 'Garder le secret de la cabane.' },
          { relation: '@coequipierA', delta: { amitie: 10, confiance: 10 } },
        ],
        resultat: 'Vous gravez vos initiales dans le bois. C’est ridicule, et c’est la chose la plus sérieuse que tu aies jamais faite.',
      },
      {
        id: 'aine',
        texte: 'Proposer d’y emmener {aine}',
        effets: [{ relation: '@coequipierA', delta: { confiance: -6 } }, { relation: '@aine', delta: { amitie: 6 } }, { stat: 'attributs.charisme', delta: 1 }],
        resultat: '{@coequipierA} se renfrogne. « C’était à nous. » {Il:@coequipierA} finit par accepter. {Aine} vient une fois, s’ennuie, et ne revient plus. Le mal est fait.',
      },
      {
        id: 'entrainer',
        texte: 'En faire votre terrain d’entraînement secret',
        effets: [
          { entrainer: 'taijutsu', jours: 25 },
          { relation: '@coequipierA', delta: { amitie: 6, respect: 6 } },
          { stat: 'jauges.fatigue', delta: 10 },
        ],
        resultat: 'Des après-midi entiers à vous battre, à tomber, à recommencer. Vous ne le savez pas encore, mais c’est là que tout commence.',
      },
    ],
  },
];
