import type { TexteTechnique } from './impacts';

/**
 * Techniques de clan, dōjutsu, fusions et bijū : ce qu'elles font de loin, au contact, et à la troisième fois
 * dans un combat où l'on peut tuer. {il}, {Il}, {lui}, {e} s'accordent à l'adversaire.
 */
export const TEXTES_TECHNIQUES_CLANS: Record<string, TexteTechnique> = {
  // ── Hyūga ──
  hyuga_kusho: {
    loin: ['Ta paume frappe l’air, et l’air le frappe à dix pas. {Il} part en arrière comme poussé par un mur invisible.'],
    proche: ['À bout portant, la paume d’air lui enfonce la poitrine. {Il} crache tout son souffle d’un coup.'],
    sombre: ['Troisième paume, au même point du thorax. Quelque chose cède à l’intérieur. {Il} tousse rouge, et ne s’arrête plus de tousser.'],
  },
  hyuga_kaiten: {
    proche: ['Tu tournes sur toi-même, et le dôme de chakra le rejette comme un caillou contre une meule.'],
    sombre: ['Le troisième tourbillon le prend de plein fouet. {Il} est projeté si fort que tu entends son épaule sortir de son logement.'],
  },
  hyuga_128: {
    proche: ['Cent vingt-huit coups. Le dernier ferme la porte de chakra au-dessus de son cœur. {Il} tombe à genoux, vide.'],
    sombre: ['Tu refermes ses portes une troisième fois, et tu forces. Elles ne se rouvriront jamais. Il n’y aura plus jamais de chakra dans ce corps.'],
  },
  // ── Nara ──
  nara_kubi: {
    loin: ['Ton ombre rampe sur le sol jusqu’à la sienne. Une main d’ombre remonte le long de son corps et se referme sur son cou.'],
    proche: ['Si près, l’ombre n’a pas besoin de ramper : elle saute de la tienne à la sienne et lui serre la gorge.'],
    sombre: ['Troisième étreinte. Tu ne desserres pas. Ses doigts griffent une ombre qu’ils ne peuvent pas saisir. Son visage passe du rouge au violet.'],
  },
  nara_nui: {
    loin: ['Des aiguilles d’ombre jaillissent du sol et le transpercent aux épaules et aux cuisses.'],
    sombre: ['Les aiguilles d’ombre le traversent une troisième fois et restent. {Il} est cloué{e} debout, comme un papillon dans une boîte.'],
  },
  // ── Yamanaka ──
  yamanaka_shinranshin: {
    loin: ['Ton esprit file jusqu’au sien. Pendant trois secondes, son bras frappe son propre camarade.'],
    proche: ['Tu entres dans sa tête par la porte de devant. {Il} se gifle lui-même, deux fois, sans comprendre.'],
    sombre: ['Troisième intrusion. En ressortant, tu emportes quelque chose sans le vouloir. {Il} ne sait plus qui {il} est. {Il} regarde ses mains comme celles d’un inconnu.'],
  },
  // ── Akimichi ──
  akimichi_hari: {
    proche: ['Le char hérissé lui passe dessus. Les kunai pris dans tes cheveux ressortent rouges.'],
    sombre: ['Troisième passage hérissé. Ce qui reste au sol a plus de trous que de peau.'],
  },
  akimichi_chodan: {
    proche: ['Ton poing grandit jusqu’à la taille d’une maison et retombe sur {lui}. Le sol se creuse en cratère.'],
    sombre: ['Le troisième poing géant tombe là où {il} est déjà enfoncé{e}. Tu ne le soulèves pas pour regarder.'],
  },
  // ── Inuzuka ──
  inuzuka_garoga: {
    proche: ['Le loup à deux têtes le prend entre ses mâchoires de chakra et le secoue comme un chiffon.'],
    sombre: ['Troisième morsure du loup. Ton chien lâche quelque chose qui tombe dans l’herbe avec un bruit mou. Tu ne regardes pas ce que c’était.'],
  },
  // ── Aburame ──
  aburame_kabe: {
    proche: ['Le mur d’insectes se referme sur {lui}. On n’entend plus que le bruissement, et ses cris étouffés dessous.'],
    sombre: ['Troisième fois, tu laisses le mur se refermer et tu attends. Quand les insectes repartent, ce qu’ils laissent ne bouge plus et n’a plus de chakra du tout.'],
  },
  // ── Kaguya ──
  kaguya_karamatsu: {
    proche: ['Des os jaillissent de tes coudes, de tes genoux, de ta colonne. Il se jette sur toi et s’empale dessus tout seul.'],
    sombre: ['Troisième étreinte d’os. Tu le serres contre toi. Il ne se dégage pas. Il ne peut plus.'],
  },
  kaguya_tessenka: {
    proche: ['Ta colonne vertébrale sort de ton dos comme un fouet d’os et le fouette au visage.'],
    sombre: ['Le fouet d’os passe une troisième fois et lui arrache un pan de joue. Il te reste un bout de lui accroché aux vertèbres.'],
  },
  kaguya_sawarabi: {
    loin: ['La forêt d’os jaillit du sol sur cent pas. {Il} saute de pointe en pointe, et l’une finit par le trouver.'],
    sombre: ['Troisième forêt d’os. Cette fois, {il} ne saute plus. {Il} reste là-haut, embroché{e} sur une pointe blanche, les jambes dans le vide.'],
  },
  // ── Yuki ──
  yuki_sensatsu: {
    loin: ['Mille aiguilles de glace se forment dans l’air humide et pleuvent sur {lui}. Son manteau devient une pelote.'],
    sombre: ['Troisième pluie d’aiguilles. Elles restent dans ses yeux, dans sa gorge. Le froid arrête le saignement. Rien d’autre.'],
  },
  yuki_haryu: {
    loin: ['Le dragon de glace fond sur {lui} et le fige à moitié dans un bloc blanc.'],
    sombre: ['Le troisième dragon le gèle entier. Ses yeux bougent encore derrière la glace. Puis ils ne bougent plus.'],
  },
  hyoton_miroirs: {
    proche: ['Les miroirs se referment ; chaque reflet lance une aiguille, et toutes le trouvent.'],
    sombre: ['Troisième dôme de miroirs. Les aiguilles ne s’arrêtent plus. Quand tu sors du dôme, il est assis, couvert de givre et de rouge.'],
  },
  // ── Uzumaki ──
  uzumaki_kongo: {
    loin: ['Des chaînes d’or jaillissent de ton dos et le ligotent de loin, bras contre le corps.'],
    proche: ['Les chaînes le serrent contre toi. Tu sens ses côtes plier sous le métal de chakra.'],
    sombre: ['Troisième fois, les chaînes serrent sans s’arrêter. Le bruit de ses os qui cèdent couvre le cliquetis des maillons.'],
  },
  // ── Hōzuki ──
  hozuki_suika: {
    proche: ['Son coup traverse ton corps devenu eau. Ta main ressort de ton ventre liquide et l’attrape à la gorge.'],
    sombre: ['Troisième fois, tu l’attires dans ton corps d’eau et tu le gardes la tête dedans.'],
  },
  hozuki_teppodama: {
    loin: ['La goutte d’eau part de ton doigt comme une balle et lui troue l’épaule.'],
    sombre: ['La troisième goutte entre par l’œil. Elle ne ressort pas.'],
  },
  // ── Senju (Mokuton) ──
  mokuton_jukai: {
    loin: ['La forêt naît du sol en une seconde ; les racines l’attrapent aux chevilles et le hissent dans les branches.'],
    sombre: ['Troisième forêt. Les racines poussent à travers {lui}, cette fois. L’arbre qui en sort fleurira au printemps.'],
  },
  mokuton_mokuryu: {
    loin: ['Le dragon de bois s’enroule autour de {lui} et boit son chakra par la peau.'],
    sombre: ['Le troisième dragon le serre jusqu’à ce que le bois et ses os craquent en même temps.'],
  },
  mokuton_kajukai: {
    loin: ['Des fleurs géantes s’ouvrent autour de {lui} et lâchent un pollen lourd. Ses paupières tombent.'],
    sombre: ['Troisième floraison. {Il} s’endort dans le pollen et ne se réveille plus. Les fleurs se referment sur {lui}.'],
  },
  // ── Clans mineurs ──
  shirakaze_rideau: {
    proche: ['Le rideau de vent blanc le prend de face et lui arrache les cils, les sourcils, la peau des lèvres.'],
    sombre: ['Troisième rideau. Le vent blanc le décape comme le sable décape la pierre. Ce qui reste de son visage ne se reconnaît plus.'],
  },
  raiko_charge: {
    proche: ['Tu charges dans un éclair et ton épaule le percute à la vitesse de la foudre.'],
    sombre: ['Troisième charge. Tu le traverses presque. Il reste debout un instant, puis s’effondre comme un pantin dont on a coupé tous les fils.'],
  },
  ishikawa_poing: {
    proche: ['Ton poing de roche lui écrase la pommette. Tu sens l’os céder sous la pierre.'],
    sombre: ['Le troisième poing de roche tombe sur la même pommette. Son œil ne regarde plus dans la même direction que l’autre.'],
  },
  // ── Dōjutsu ──
  amaterasu: {
    loin: ['Tu le regardes, et des flammes noires naissent sur son épaule. Elles ne s’éteignent pas. {Il} hurle en arrachant sa veste.'],
    proche: ['À un pas, tes yeux saignent et le feu noir prend sur sa poitrine. {Il} se roule par terre ; la terre brûle avec {lui}.'],
    sombre: ['Troisième regard. Le feu noir le recouvre entier et ne le lâche pas. Tu fermes ton œil. Ça ne s’arrête pas pour autant. Ça s’arrête quand il n’y a plus rien à brûler.'],
  },
  tsukuyomi: {
    proche: ['Tes yeux entrent dans les siens. Pour {lui}, trois jours passent, attaché{e} à une croix, sous une lune rouge. Pour toi, une seconde.'],
    sombre: ['Troisième Tsukuyomi. Trois jours de plus, et encore trois. Quand {il} revient, {il} ne revient pas vraiment. {Il} sourit au vide et ne parle plus.'],
  },
  kamui: {
    loin: ['L’espace se tord autour de son bras ; le bras disparaît dans un tourbillon, puis revient, tordu.'],
    sombre: ['Troisième torsion. Tu n’en rends que la moitié. L’autre moitié est quelque part dans un monde de cubes gris, pour toujours.'],
  },
  kotoamatsukami: {
    proche: ['Tu réécris une seule chose dans son esprit : te combattre lui semble soudain absurde. {Il} baisse les mains.'],
    sombre: ['Troisième fois. Tu réécris trop. {Il} ne sait plus aimer, ne sait plus craindre. {Il} obéira à n’importe qui, désormais.'],
  },
  susanoo: {
    loin: ['Le géant de chakra qui t’entoure abat son arme. Le sol se fend sur vingt pas.'],
    proche: ['La main du Susanoo le saisit et le serre. Ses pieds battent dans le vide.'],
    sombre: ['Troisième étreinte du géant. La main se referme, et elle ne se rouvre que quand il n’y a plus rien de dur dedans.'],
  },
  susanoo_yasaka: {
    loin: ['Les magatama de chakra pleuvent sur {lui}, chacun gros comme un rocher.'],
    sombre: ['Troisième volée. Le terrain n’est plus qu’un champ de cratères, et l’un d’eux a sa forme.'],
  },
  shinra_tensei: {
    loin: ['Tout est repoussé d’un coup : {lui}, les arbres, les pierres. {Il} disparaît dans un nuage de débris.'],
    proche: ['À bout portant, la répulsion le colle au sol si fort que la terre se creuse sous son dos.'],
    sombre: ['Troisième répulsion. Le sol garde l’empreinte de son corps, et son corps garde celle du sol : plat.'],
  },
  bansho_tenin: {
    loin: ['Tu tends la main, et {il} est arraché du sol et attiré vers toi, sans rien pour se retenir.'],
    sombre: ['Tu l’attires une troisième fois, droit sur un pieu de roche que tu as fait jaillir entre vous.'],
  },
  chibaku_tensei: {
    loin: ['La sphère noire monte dans le ciel et arrache la terre autour de {lui} ; {il} est aspiré{e} avec les rochers.'],
    sombre: ['Troisième sphère. Elle se referme. Quelque part au cœur de la lune de pierre qui flotte au-dessus de vous, {il} est encore vivant{e}, peut-être.'],
  },
  rinne_limbo: {
    proche: ['Des ombres qu’il ne peut pas voir le frappent de quatre côtés à la fois.'],
    sombre: ['Troisième fois, les ombres invisibles ne frappent plus : elles tiennent. Et tu prends ton temps.'],
  },
  izanami: {
    proche: ['Tu l’enfermes dans la boucle : la même seconde, encore et encore, jusqu’à ce qu’{il} accepte.'],
    sombre: ['Troisième boucle. {Il} n’accepte pas. {Il} reste dedans. Son corps est là, devant toi, qui répète le même geste, sans fin.'],
  },
  // ── Fusions (kekkei genkai) ──
  yoton_riviere: {
    loin: ['La lave coule vers {lui} comme une rivière lente ; quand {il} saute, ses semelles fondent.'],
    sombre: ['Troisième coulée. Ses jambes s’enfoncent dans la lave jusqu’aux genoux. Quand {il} les retire, il n’y a plus de pieds.'],
  },
  futton_brume: {
    loin: ['La brume acide le recouvre ; sa peau se met à fumer, ses vêtements à se défaire.'],
    sombre: ['Troisième brume. Elle dissout ce qu’elle touche. Ses doigts d’abord.'],
  },
  shakuton_sphere: {
    loin: ['Les sphères de chaleur le touchent et boivent l’eau de son corps. Sa peau se ride comme celle d’un vieillard.'],
    sombre: ['Troisième sphère. Il ne reste qu’une momie sèche qui respire encore, très lentement.'],
  },
  jiton_sable: {
    loin: ['Le sable de fer se referme sur {lui} en mille petites lames.'],
    sombre: ['Le troisième nuage de fer entre dans sa bouche, son nez, ses oreilles. Et serre.'],
  },
  ranton_faisceau: {
    loin: ['Le faisceau d’orage traverse le terrain en ligne droite et lui perce l’épaule.'],
    sombre: ['Le troisième faisceau lui traverse le ventre et ressort en grésillant. Le trou est propre, net, cautérisé.'],
  },
  bakuton_argile: {
    loin: ['L’oiseau d’argile se pose sur son épaule. Tu claques des doigts.'],
    proche: ['Tu lui colles l’argile dans la main en le frappant. {Il} la regarde une demi-seconde de trop.'],
    sombre: ['Troisième argile, avalée cette fois. Tu claques des doigts. Tu ne regardes pas.'],
  },
  // ── Bijū ──
  biju_dama: {
    loin: ['La boule de chakra noir part de ta gueule ouverte. L’horizon derrière {lui} explose.'],
    sombre: ['Troisième Bijū Dama. Il n’y a plus de colline, plus de forêt, plus de {lui}. Juste un cratère qui fume.'],
  },
  biju_version2: {
    proche: ['Ta peau a disparu sous le chakra de la bête ; ta griffe le traverse de part en part.'],
    sombre: ['La bête frappe une troisième fois, et elle ne lâche pas. Tu entends ta propre voix rire, et ce n’est pas toi.'],
  },

  sennin_rasengan: {
    proche: ['L’énergie naturelle grossit la sphère jusqu’à la taille d’un rocher. Elle l’emporte à travers trois arbres.'],
    sombre: ['Le troisième Rasengan d’ermite le broie contre la roche. Quand la sphère s’éteint, la roche est creusée, et {lui} dedans.'],
  },
  raiton_guillotine: {
    proche: ['Ta jambe chargée de foudre tombe sur sa nuque comme une hache.'],
    sombre: ['Troisième guillotine. Sa tête part d’un côté, son corps reste agenouillé de l’autre.'],
  },
  raiton_kirin_eclair: {
    loin: ['Tu fais tomber l’orage sur {lui}. Le ciel entier devient un dragon blanc qui s’abat.'],
    sombre: ['Le troisième dragon du ciel le frappe. Il ne reste qu’une silhouette noire sur le sol vitrifié.'],
  },

  tai_ura_renge: {
    proche: ['La porte ouverte, tu l’envoies en l’air, tu le rattrapes, tu le renvoies au sol. Il ne touche jamais terre avant la fin.'],
    sombre: ['Troisième lotus. Au retour au sol, son corps fait un bruit de sac de bois mort.'],
  },
  tai_sekizo: {
    proche: ['Le Tigre du soir s’abat sur {lui} : l’air comprimé par ton poing frappe avant ton poing.'],
    sombre: ['Troisième tigre. L’air le broie si fort que ses tympans éclatent. {Il} n’entendra plus jamais rien.'],
  },
  byakugo_okasho: {
    proche: ['Ton poing chargé de cent ans de chakra lui fend la garde, puis le sternum.'],
    sombre: ['Troisième poing. Tu sens son cœur cesser de battre sous tes phalanges, puis repartir, de travers.'],
  },
  kawazu_kumite: {
    proche: ['L’énergie naturelle prolonge ton poing d’une coudée invisible. Il esquive ton poing, pas le reste.'],
    sombre: ['Troisième frappe de crapaud. L’énergie de la nature entre en {lui}, et commence à le changer en pierre, par les doigts.'],
  },
  marque_ailes: {
    proche: ['Tes ailes de chair te portent sur {lui} ; ta main noircie le frappe au visage.'],
    sombre: ['La marque frappe une troisième fois à travers toi. Elle aime le goût de ce qu’elle touche. Lui ne goûte plus rien.'],
  },
  // ── Trinités (trois natures) ──
  trinite_orage_solaire: {
    loin: ['Le second soleil tombe sur {lui}. Le feu, le vent, la foudre : son corps ne sait pas contre quoi se protéger d’abord.'],
    sombre: ['Le troisième soleil tombe. Il ne reste au sol qu’une ombre noire, imprimée dans la pierre vitrifiée.'],
  },
  trinite_coeur_volcan: {
    loin: ['La lave explose sous {lui} ; des éclats de pierre fondue s’incrustent dans sa peau en grésillant.'],
    sombre: ['Troisième éruption. La lave l’engloutit jusqu’à la poitrine, et la foudre fait le reste. Quand le sol refroidit, {il} en fait partie.'],
  },
  trinite_pluie_cendres: {
    loin: ['Les cendres lui brûlent les yeux et la gorge ; {il} tousse des braises.'],
    sombre: ['Troisième pluie. {Il} a respiré la cendre trop longtemps. Ses poumons sont pleins de feu ; {il} se noie à l’air libre.'],
  },
  trinite_geyser_lave: {
    proche: ['Le geyser jaillit sous ses pieds. Ses jambes sont prises dans la pierre qui fond.'],
    sombre: ['Le troisième geyser l’emporte en l’air. Ce qui retombe est encore en feu.'],
  },
  trinite_mousson: {
    loin: ['La pluie le trempe, et l’éclair suit l’eau jusqu’à son cœur. {Il} tombe, fumant.'],
    sombre: ['Troisième mousson. La foudre suit l’eau dans sa bouche, dans ses poumons. {Il} ne respire plus que des étincelles.'],
  },
  trinite_sable_foudre: {
    loin: ['Le sable électrique lui écorche la peau en mille points, et chaque point brûle.'],
    sombre: ['Troisième tempête. Il ne reste de sa peau que du rouge à vif, et le sable continue de tourner.'],
  },
  trinite_ouragan_vapeur: {
    loin: ['La vapeur le cuit à travers ses vêtements. Sa peau rougit, puis blanchit.'],
    sombre: ['Troisième ouragan de vapeur. Ses yeux ont blanchi comme ceux d’un poisson cuit.'],
  },
  trinite_tonnerre_bouillant: {
    proche: ['L’eau bouillante lui monte aux genoux, et la foudre y plonge. {Il} hurle en dansant sur place.'],
    sombre: ['Troisième fois. L’eau bout, la foudre court, et {il} cesse de danser.'],
  },
  trinite_glissement: {
    loin: ['La boue l’emporte et le roule sur cent pas avant de le recracher, à moitié enseveli{e}.'],
    sombre: ['Troisième glissement. La montagne le recouvre. Tu ne creuses pas.'],
  },
  trinite_marais: {
    proche: ['Le marais l’aspire jusqu’aux cuisses ; la foudre le fige dans la boue.'],
    sombre: ['Troisième fois, la boue se referme au-dessus de sa tête, et la foudre éclaire le marais de l’intérieur.'],
  },
};
