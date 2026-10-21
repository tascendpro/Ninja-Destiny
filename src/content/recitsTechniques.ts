// Récits des attaques spéciales — ce que devient chaque technique sur le terrain, face à un seul adversaire ou à un groupe.
// La portée décide de l'efficacité contre une escouade et du risque de toucher un allié dans la mêlée.

import type { Affrontement, ElementId, RecitTechnique, TechniqueAdverse } from '../engine/types';

const r = (portee: RecitTechnique['portee'], duel: string, escouade: string): RecitTechnique => ({ portee, duel, escouade });

export const RECITS_TECHNIQUES: Record<string, RecitTechnique> = {
  // ── Ninjutsu de base ──
  bunshin: r('cible', 'Trois silhouettes identiques jaillissent autour de toi. Il hésite une fraction de seconde, et tu frappes depuis le seul angle qu’il ne surveillait pas.', 'Tes clones se dispersent entre les ennemis. Ils frappent dans le vide, mais attirent les regards ; dans la confusion, tu choisis ta cible.'),
  kawarimi: r('cible', 'Son coup s’abat sur toi… et fend une bûche. Tu es déjà dans son dos.', 'Une bûche prend ta place sous la volée de kunai ; tu réapparais au milieu de leur groupe, là où personne ne t’attend.'),
  shunshin: r('cible', 'Tu disparais. Tu réapparais à sa gauche, déjà en train de frapper.', 'Tu passes de l’un à l’autre plus vite que leurs yeux ; chacun reçoit un coup sans savoir d’où il vient.'),
  kage_bunshin: r('zone', 'Dix de toi, puis vingt. Il ne peut pas tous les surveiller, et un seul suffit.', 'Une marée de clones déferle sur eux : vous êtes soudain plus nombreux qu’eux.'),
  paume_vide: r('cible', 'Une poussée de chakra pur, paume ouverte, à bout portant. Il décolle du sol.', 'Tu repousses le premier qui s’approche d’une paume vide ; il emporte les deux suivants dans sa chute.'),
  hyoton_miroirs: r('cible', 'Des miroirs de glace l’encerclent. Tu passes de l’un à l’autre, et chaque reflet lance une aiguille.', 'Tu enfermes le plus dangereux d’entre eux dans un dôme de miroirs ; les autres ne peuvent que regarder.'),

  // ── Katon ──
  katon_braises: r('zone', 'Une volée de braises crachées en éventail. Il les esquive presque toutes. Presque.', 'Des dizaines de braises s’abattent sur eux en éventail, et le feu prend sur leurs vêtements.'),
  katon_boule: r('zone', 'Tu gonfles la poitrine et craches une boule de feu grande comme une maison. Il n’a que deux choix : brûler, ou sauter là où tu l’attends.', 'La grande boule de feu roule sur leur formation et les force à se disperser. Ceux qui sautent trop tard en sortent fumants.'),
  katon_phenix: r('zone', 'Une gerbe de petites flammes guidées, et dans chacune un shuriken. Il esquive le feu ; pas l’acier.', 'Les fleurs de phénix pleuvent sur eux, chacune cachant une lame. Impossible de toutes les suivre.'),
  katon_tempete: r('large', 'Tu exhales un torrent de flammes qui dévore tout le terrain. Il n’y a plus nulle part où se cacher.', 'Un mur de flammes avance, large comme une rue, et dévore leurs rangs. Il ne choisit pas ses victimes.'),

  // ── Suiton ──
  suiton_bulles: r('zone', 'Une nuée de bulles lui éclate au visage. Aveuglé, il frappe là où tu n’es plus.', 'Les bulles crèvent au milieu d’eux ; pendant un instant, plus personne n’y voit clair.'),
  suiton_projectile: r('cible', 'Tu craches un jet d’eau comprimée, dur comme un poing de pierre, droit vers sa poitrine.', 'Un jet d’eau comprimée, en ligne droite : tu vises celui qui mène les autres.'),
  suiton_prison: r('cible', 'Une sphère d’eau se referme sur lui. Il se débat, et chaque seconde lui coûte de l’air.', 'Tu enfermes leur chef dans une prison d’eau. Sans lui, les autres hésitent.'),
  suiton_dragon: r('zone', 'L’eau se lève derrière toi et prend la forme d’un dragon. Il fond sur lui avec le poids d’une rivière entière.', 'Le dragon aqueux s’abat au milieu de leur groupe et balaie ceux qui ne s’accrochent à rien.'),
  suiton_cataracte: r('large', 'Une vague haute comme un toit se lève et l’emporte.', 'La grande cataracte déferle sur tout le champ de bataille. Elle emporte tout ce qui n’a pas de racines.'),

  // ── Fūton ──
  fuuton_rafale: r('zone', 'Un souffle brutal le soulève du sol et le jette en arrière.', 'La rafale balaie leur ligne et fait voler poussière, feuilles et ninjas mal ancrés.'),
  fuuton_lame: r('cible', 'Tu tranches l’air de la main ; une lame de vent invisible file vers lui. Il ne la voit qu’au moment où sa manche se déchire.', 'Une lame de vent fend leur ligne et fauche les jambes du plus proche.'),
  fuuton_vide: r('cible', 'Tu comprimes l’air dans ta bouche et le craches comme un boulet. L’impact le plie en deux.', 'Des balles d’air, l’une après l’autre, sur ceux qui tentent de te contourner.'),
  fuuton_tranchant: r('large', 'Une lame d’air immense part de ta main et fend la pierre derrière lui.', 'Le grand tranchant du vent fauche leur ligne entière, et les arbres derrière.'),

  // ── Raiton ──
  raiton_etincelles: r('cible', 'Une décharge brève au bout des doigts, au moment où vos bras se croisent. Sa main s’engourdit.', 'Tu fais claquer des étincelles sous le nez du plus proche ; il recule en lâchant son arme.'),
  raiton_decharge: r('zone', 'La foudre crépite dans tes paumes. Au contact, ses muscles se tétanisent un instant.', 'Tu frappes le sol : la décharge court sur la terre humide et mord les chevilles de tous ceux qui s’approchent.'),
  raiton_lance: r('cible', 'Tu étires la foudre en une lance blanche et la projettes. Elle perce sa garde avant qu’il ait fini de lever le bras.', 'Une lance de foudre traverse leur formation en ligne droite ; celui qui se tenait derrière n’a pas vu qu’elle ne s’arrêtait pas.'),
  raiton_tonnerre: r('cible', 'La foudre se concentre dans ta main avec un cri d’oiseaux. Tu traverses la distance et frappes au cœur de sa garde.', 'Tu fonces à travers leurs rangs, la main chargée de foudre, droit vers le plus fort d’entre eux.'),

  // ── Doton ──
  doton_boue: r('zone', 'Le sol se liquéfie sous ses pieds. Il s’enfonce jusqu’aux chevilles, et ta frappe arrive.', 'Tout le terrain devant toi devient boue ; leur charge s’enlise.'),
  doton_mur: r('cible', 'Un mur de roche jaillit entre vous. Il frappe la pierre ; toi, tu passes par-dessus.', 'Un rempart de terre se dresse et coupe leur charge en deux. Tu n’as plus que la moitié d’entre eux en face.'),
  doton_lances: r('zone', 'Le sol se hérisse de pointes de roche sous ses pas. Il saute ; tu l’attendais là-haut.', 'Une forêt de lances de pierre jaillit sous leurs pieds et brise leur formation.'),
  doton_geant: r('large', 'Un colosse de roche se lève du sol et abat son poing là où il se tient.', 'Le géant de terre avance au milieu d’eux, et chacun de ses pas fait trembler le sol sous les tiens aussi.'),

  // ── Taijutsu ──
  tai_tourbillon: r('cible', 'Un coup de pied circulaire, de toute ta hanche, qui vise la tempe.', 'Tu tournes sur toi-même, jambe tendue, et ceux qui t’encerclaient reculent d’un pas.'),
  tai_poing: r('cible', 'Trois coups, toujours au même point, jusqu’à ce que sa garde cède.', 'Tu choisis un adversaire et tu ne le lâches plus : trois coups, au même endroit.'),
  tai_danse: r('cible', 'Tu te glisses dans son angle mort et frappes de bas en haut, sous le menton.', 'Tu passes sous leurs bras comme une ombre et frappes celui qui se croyait à l’abri derrière les autres.'),
  tai_portes: {
    ...r('zone', 'Tu ouvres la première porte, celle de l’Ouverture. Tes muscles se libèrent de leurs verrous, et tu frappes plus vite que tu ne penses.', 'La première porte ouverte, tu traverses leur groupe comme une bourrasque. Tu ne sais plus très bien qui tu touches.'),
    paliers: [
      { min: 2, duel: 'Troisième porte, celle de la Vie : ta peau vire au rouge et de la vapeur monte de ton corps. Il te voit disparaître, et sent le coup avant de comprendre d’où il vient.', escouade: 'La troisième porte s’ouvre ; ta peau rougit, la vapeur monte. Tu passes de l’un à l’autre en laissant le sol fendu derrière toi.' },
      { min: 3, duel: 'Cinquième porte. L’air se fend autour de toi. Tu l’envoies en l’air d’un coup de pied, tu le rattrapes, tu le renvoies au sol : une danse dont il ne touche jamais terre.', escouade: 'Cinquième porte : tu deviens un tourbillon rouge. Ceux qui sont pris dedans ne retouchent pas le sol avant que tu l’aies décidé.' },
      { min: 4, duel: 'Septième porte, celle de l’Émerveillement. Une aura bleue t’entoure ; chaque coup de poing enflamme l’air et forme un tigre de pression qui fond sur lui. Il n’a jamais vu ça. Personne ne l’a jamais vu.', escouade: 'Septième porte : le tigre du soir. Un seul coup de poing, et l’air comprimé rugit à travers leur formation entière.' },
      { min: 5, duel: 'Tu ouvres la huitième porte, celle de la Mort. Une vapeur rouge sang jaillit de ton corps comme des ailes. Il recule, livide : il sait ce que ça veut dire. Toi aussi. Tu frappes une fois, et le monde se tait.', escouade: 'La huitième porte. Des ailes de vapeur écarlate. Ce que tu frappes n’existe plus. Ce que ça te coûte, tu le sauras plus tard, si tu as un plus tard.' },
    ],
  },

  // ── Genjutsu ──
  gen_brume: r('zone', 'Tu tisses une peur sans visage. Ses mains tremblent, son regard cherche quelque chose derrière toi.', 'Une brume de terreur se répand sur eux ; les plus jeunes lâchent leurs armes.'),
  gen_reflet: r('cible', 'Il frappe ton reflet, encore et encore. Toi, tu frappes une fois.', 'Tu glisses un faux reflet dans l’esprit du plus proche ; il attaque son propre camarade.'),
  gen_etreinte: r('cible', 'Des branches imaginaires sortent du sol et l’immobilisent le temps d’un coup.', 'Tu enfermes leur meneur dans l’étreinte d’un arbre qui n’existe pas ; il hurle, figé, sous les yeux des autres.'),

  // ── Armes ──
  arme_pluie: r('zone', 'Dix kunai, lancés comme un seul. Il en pare neuf.', 'Une pluie de kunai s’abat sur leur groupe ; il n’y a pas assez de parades pour tout le monde.'),
  arme_senbon: r('cible', 'Trois aiguilles, trois points où le corps cède. Son bras retombe, inerte.', 'Tu vises le cou du plus rapide d’entre eux. Il s’effondre sans comprendre.'),
  arme_fils: r('zone', 'Tu tends un réseau de fils d’acier en un éclair ; il s’y prend en voulant te charger.', 'Les fils se tendent entre les arbres et fauchent leur charge à hauteur de genou.'),
  arme_croissant: r('cible', 'Ta lame décrit un croissant et revient sur elle-même. Il pare le premier passage, pas le second.', 'Une coupe en croissant qui ouvre la garde de deux adversaires à la fois.'),
  arme_tornade: r('zone', 'Ton bō tourne si vite qu’il devient un mur ; quand il s’arrête, c’est sur sa tempe.', 'Le bâton tournoie autour de toi et tient tout le groupe à distance. Malheur à qui s’approche, ami ou ennemi.'),
  arme_pieges: r('large', 'Le terrain est semé de parchemins. Tu le pousses à reculer dessus, et tu claques des doigts.', 'Tu les laisses avancer sur le terrain piégé, puis tout explose en chaîne.'),
  arme_aube: r('cible', 'Un seul geste, du fourreau à la gorge. Il ne voit que la fin du mouvement.', 'Tu dégaines en passant entre deux d’entre eux. Ils ne tombent qu’après ton passage.'),

  // ── Médecine et sceaux ──
  med_scalpel: r('cible', 'Ta main l’effleure à peine. Sous la peau, un muscle vient d’être tranché net.', 'Tu effleures les jambes du premier, le bras du deuxième ; aucun ne saigne, aucun ne tient debout.'),
  fuin_explosif: r('zone', 'Le sceau collé à son épaule pendant l’échange s’embrase à ton signal.', 'Le sceau explose au milieu de leur groupe ; le souffle couche tout le monde, à commencer par les plus proches.'),

  // ── Fusions ──
  yoton_riviere: r('large', 'Un flot de roche en fusion coule vers lui ; le sol lui-même devient son ennemi.', 'La rivière de lave se répand sur le champ de bataille, et rien ne l’arrête.'),
  futton_brume: r('zone', 'Une vapeur acide l’enveloppe ; son armure fond, puis sa peau.', 'La brume acide roule sur eux et ronge métal, cuir et chair. Le vent, lui, ne t’obéit qu’à moitié.'),
  shakuton_sphere: r('cible', 'Une sphère ardente se colle à lui et boit l’eau de son corps.', 'Les sphères ardentes filent vers les plus dangereux et les dessèchent sur place.'),
  jiton_sable: r('zone', 'Le sable de fer frappe comme un fouet, puis se referme en bouclier devant toi.', 'Un nuage de sable de fer tournoie et lacère tous ceux qui s’y trouvent.'),
  ranton_faisceau: r('cible', 'Un rayon de lumière se courbe autour de sa garde et le touche dans le dos.', 'Le faisceau zigzague entre eux et frappe trois cibles d’une seule courbe.'),
  bakuton_argile: r('zone', 'Une petite araignée d’argile court sur son bras. Tu fermes le poing.', 'Tes créatures d’argile se glissent entre leurs pieds ; l’explosion fait trembler le sol.'),

  // ── Bijū ──
  biju_manteau: {
    ...r('large', 'Un voile de chakra rouge t’enveloppe comme une seconde peau. Tes ongles s’allongent, tes yeux se fendent. Tu frappes, et la terre se fend sous le coup.', 'Dans le voile de la bête, tu fonds sur eux à quatre pattes. La bête, elle, ne fait pas la différence entre les uniformes.'),
    paliers: [
      { min: 2, duel: 'Une queue de chakra se dresse derrière toi, puis deux. Elles fouettent l’air comme des fouets de feu. Il recule d’un pas, puis d’un autre : il a compris ce qu’il a en face.', escouade: 'Deux, trois queues de chakra jaillissent de ton dos et balaient leurs rangs avant même que tu bouges.' },
      { min: 3, duel: 'Quatre queues. Ta peau se craquelle et le chakra noircit autour de toi, prend la forme d’une bête miniature. Tu ouvres la gueule : une sphère noire se forme, et il voit sa mort dedans.', escouade: 'Le chakra prend la forme de la bête autour de toi. Tu ouvres la gueule et une sphère noire part vers leur formation. Le cratère se voit depuis les montagnes.' },
      { min: 5, duel: 'Tu laisses sortir la bête tout entière. Elle s’élève au-dessus des arbres, et lui, minuscule, lève les yeux. Il ne se bat pas. Il prie.', escouade: 'La bête se dresse, entière, plus haute que les arbres. Une armée entière s’arrête de courir pour la regarder. Puis elle ouvre la gueule.' },
    ],
  },

  // ── Sannin ──
  marque_maudite: {
    paliers: [
      { min: 3, duel: 'Niveau 2. Ta peau devient grise, tes cheveux s’allongent et blanchissent, et deux ailes de chair en forme de mains jaillissent de ton dos. Il recule en te voyant. Tu n’es plus tout à fait quelqu’un de sa race.', escouade: 'Niveau 2 : peau grise, ailes de chair. Tu t’élèves au-dessus d’eux et tu plonges. Ils ne savent plus contre quoi ils se battent.' },
      { min: 5, duel: 'La marque t’obéit enfin. Ailes repliées, peau grise striée de noir, tu restes immobile, et c’est ton calme qui le terrifie. Un seul coup, d’une puissance qu’Orochimaru lui-même t’envierait.', escouade: 'La marque maîtrisée, tu ne te jettes plus sur eux : tu choisis. Le chakra noir file vers chacun comme un serpent qui sait où mordre.' },
    ],
    ...r('zone', 'Les virgules noires s’étendent sur ta peau comme de l’encre dans l’eau. Ton chakra devient lourd, violent ; tu frappes avec une force qui n’est pas tout à fait la tienne.', 'La marque s’embrase. Tu fonds sur eux, plus vite qu’ils ne peuvent suivre, et tu ne t’arrêtes pas pour regarder qui tombe.'),
  },
  mode_ermite: {
    paliers: [
      { min: 3, duel: 'Une seconde d’immobilité suffit. Tes yeux deviennent ceux d’un crapaud, des pupilles en barre ; tu sens l’énergie de la montagne entière couler dans tes bras. Ton coup le manque de dix centimètres, et le frappe quand même : l’air lui-même porte ta force.', escouade: 'En mode ermite, tu ne vois plus leurs corps : tu sens leurs chakras, comme des lanternes dans le noir. Tu éteins les plus brillantes, une par une.' },
      { min: 5, duel: 'Deux crapauds anciens se posent sur tes épaules et chantent avec toi. Le monde ralentit. Il attaque, et tu sais déjà où, quand, comment. Tu lui laisses finir son geste, par politesse.', escouade: 'Les deux crapauds ancestraux sur tes épaules, tu entres en résonance avec la terre entière. Leurs techniques se dissolvent avant de t’atteindre. Tu marches à travers eux.' },
    ],
    ...r('cible', 'Tu t’immobilises une seconde de trop pour lui, assez pour toi. Tes paupières se cernent d’orange : tu sens son chakra avant qu’il bouge, et ton poing frappe avec le poids de la montagne.', 'En mode ermite, tu sens chacun d’eux, même ceux qui se cachent. Tu frappes le plus dangereux, puis le suivant, sans jamais être où ils t’attendent.'),
  },
  byakugo: {
    paliers: [
      { min: 4, duel: 'Création-Renaissance. Il te transperce le ventre ; la plaie se referme sur sa lame. Tu souris avec du sang plein les dents, et ton talon descend sur lui comme une montagne.', escouade: 'Ils te frappent tous ensemble. Tu les laisses faire. Chaque plaie se ferme avant la suivante. Puis tu frappes le sol, et le sol n’existe plus.' },
    ],
    ...r('cible', 'Le losange s’ouvre sur ton front. Des marques violettes courent sur ta peau ; tes blessures se referment pendant que ton poing fend le sol sous ses pieds.', 'Le sceau libéré, tu avances à travers leurs coups : chaque plaie se referme aussitôt ouverte, et ton talon brise le sol sous leur formation.'),
  },

  // ── Techniques de clan ──
  hyuga_kusho: r('cible', 'Tu frappes le vide à trois pas de lui. L’onde de chakra, elle, ne rate pas : il est soulevé de terre.', 'Une paume dans le vide, et le plus proche est projeté contre les deux suivants.'),
  hyuga_kaiten: r('zone', 'Il frappe ; tu tournes. Une sphère de chakra bleu naît autour de toi et le renvoie loin, avec son propre élan.', 'Ils t’encerclent et frappent ensemble. Tu tournes sur toi-même, et le Tourbillon divin les rejette tous en arrière, comme des feuilles.'),
  hyuga_64: r('cible', '« Huit trigrammes, soixante-quatre paumes. » Deux, quatre, huit, seize, trente-deux, soixante-quatre : à chaque coup, un point de chakra se ferme. Il tombe à genoux, vide.', 'Tu traverses leur ligne en comptant les points : deux, quatre, huit. Le premier tombe vidé de chakra ; le suivant n’a pas compris ce qui l’attend.'),
  hyuga_128: r('cible', 'Cent vingt-huit paumes, si vite que tes mains semblent immobiles. Quand tu t’arrêtes, il ne peut même plus lever un doigt.', 'Tu passes de l’un à l’autre sans jamais rompre le rythme : cent vingt-huit points fermés, partagés entre eux comme une sentence.'),
  nara_kubi: r('cible', 'Ton ombre a rejoint la sienne. Une main noire remonte le long de son corps, lentement, jusqu’à sa gorge.', 'Ton ombre se divise et file vers chacun d’eux ; des mains noires remontent le long de leurs jambes.'),
  nara_nui: r('cible', 'Des aiguilles d’ombre jaillissent du sol, se solidifient et le transpercent. Il ne tombe même pas : elles le tiennent debout.', 'Ton ombre se hérisse en dizaines d’aiguilles qui cousent leurs corps sur place, l’un à l’autre.'),
  yamanaka_shinranshin: r('cible', 'Ton chakra se glisse dans ses nerfs. Il lève son kunai… et se l’enfonce dans la cuisse, sans comprendre pourquoi.', 'Le plus fort d’entre eux se retourne et frappe son voisin. Il ne sait pas pourquoi. Toi, si.'),
  akimichi_nikudan: r('zone', 'Ton corps gonfle, tu rentres la tête et les bras : un rocher de chair qui roule vers lui et ne s’arrête pas.', 'Tu dévales leur formation en Char de chair, et ceux qui n’ont pas sauté à temps sont aplatis.'),
  akimichi_hari: r('zone', 'Le même char, hérissé de kunai. S’il l’esquive, les lames le rattrapent.', 'Ta boule hérissée traverse leur groupe comme une herse de guerre.'),
  akimichi_chodan: r('large', 'Tout ton chakra dans un seul poing, qui grandit jusqu’à la taille d’une colline, et retombe sur lui.', 'Ton poing géant s’abat au milieu d’eux, et le terrain entier devient un cratère.'),
  akimichi_papillon: {
    ...r('large', 'La pilule rouge. Des ailes de chakra de papillon s’ouvrent dans ton dos ; tu maigris à vue d’œil, mais ton poing a la force d’un dieu. Il ne voit pas venir le coup.', 'Les ailes de papillon déployées, tu fonds sur eux en un éclair doré. Chaque coup en emporte un. Ton corps brûle comme une bougie.'),
  },
  inuzuka_gatsuga: r('cible', 'Ton chien et toi devenez deux vrilles grises qui percent l’air. Il en esquive une ; l’autre le touche.', 'Deux tornades de crocs traversent leurs rangs, se croisent, reviennent.'),
  inuzuka_garoga: r('cible', 'Ton chien et toi ne faites plus qu’un : un loup géant à deux têtes, lancé en une seule vrille dévastatrice.', 'Le loup bicéphale fond sur eux et creuse un sillon à travers leur formation.'),
  aburame_essaim: r('zone', 'Une nuée noire sort de tes manches et le recouvre. Il se débat ; les insectes boivent son chakra.', 'Tes insectes se répartissent sur eux comme une pluie noire. Ils s’affaiblissent tous en même temps.'),
  aburame_kabe: r('cible', 'Son attaque s’écrase sur un mur d’insectes, qui se referme ensuite sur son bras.', 'Un mur grouillant se dresse devant toi, encaisse leur volée, puis s’effondre sur le premier rang.'),
  kaguya_tsubaki: r('cible', 'Tu tires un os de ton épaule comme on dégaine un sabre. Il pare avec son kunai ; l’acier casse.', 'Ton épée d’os taille un passage à travers eux.'),
  kaguya_karamatsu: r('zone', 'Des os jaillissent de tes bras, de ton dos, de tes genoux. Il te frappe et s’empale.', 'Tu te jettes au milieu d’eux hérissé·e d’os : chaque coup qu’ils te portent leur coûte du sang.'),
  kaguya_tessenka: r('cible', 'Tu arraches ta propre colonne vertébrale comme un fouet et l’enroules autour de lui, puis ton bras devient un foret d’os.', 'Ta colonne d’os fouette leur ligne, puis le foret de ton bras perce le plus dangereux.'),
  kaguya_sawarabi: r('large', 'Tu poses la main au sol. Une forêt d’os géants jaillit sous ses pieds, à perte de vue.', 'Le terrain entier se hérisse d’os blancs gigantesques. Pas un endroit où se tenir.'),
  yuki_sensatsu: r('zone', 'L’humidité de l’air se fige en mille aiguilles de glace autour de lui, puis se referme d’un coup.', 'Mille aiguilles de glace naissent dans l’air au-dessus d’eux, puis tombent.'),
  yuki_haryu: r('large', 'Un tigre de glace grand comme une maison se forme derrière toi et bondit sur lui.', 'Le tigre de glace traverse leur formation et laisse derrière lui un champ gelé de statues.'),
  uzumaki_kongo: r('cible', 'Des chaînes dorées jaillissent de ton dos et s’enroulent autour de lui. Il ne bouge plus. Même une bête à queues ne bougerait plus.', 'Tes chaînes adamantines se déploient et enchaînent leurs chefs au sol.'),
  shiki_fujin: r('cible', 'Derrière toi apparaît une silhouette spectrale, un poignard entre les dents. Sa main traverse ton corps et arrache l’âme de ton adversaire. Il tombe. Toi, tu sens déjà le froid.', 'Le dieu de la mort se tient derrière toi, gigantesque. Sa main traverse ton ventre et arrache leurs âmes, une à une.'),
  hozuki_suika: r('cible', 'Ton bras devient eau, s’étire sur trois mètres et le frappe en pleine face avant de reprendre forme.', 'Tes bras liquéfiés fouettent leurs rangs comme des cordes d’eau.'),
  hozuki_teppodama: r('cible', 'Tu gonfles les joues et craches une balle d’eau comprimée qui perce son armure.', 'Une rafale de balles d’eau part de ta bouche et troue leur formation.'),
  mokuton_jukai: r('large', 'Le sol se soulève : une forêt entière naît en quelques secondes et l’enserre de toutes parts.', 'Une forêt jaillit sous leurs pieds et les engloutit, branche après branche.'),
  mokuton_mokuryu: r('cible', 'Un dragon de bois sort de terre, s’enroule autour de lui et boit son chakra jusqu’à la dernière goutte.', 'Le dragon de bois serpente à travers leurs rangs et les étouffe un à un.'),
  mokuton_kajukai: r('large', 'Des arbres en fleurs poussent partout. Leur pollen descend sur lui comme une neige douce, et il s’endort debout.', 'Le monde se couvre d’arbres en fleurs. Leur pollen fait tomber les armées endormies, en silence.'),
  shirakaze_rideau: r('zone', 'Tu souffles, et un rideau de sable se dresse, l’aveugle et l’écorche.', 'Le rideau des dunes avance sur eux et les avale.'),
  raiko_charge: r('cible', 'L’armure de foudre s’embrase autour de toi. Tu disparais et réapparais à travers lui.', 'Tu charges à travers leur ligne en armure de foudre ; ceux que tu frôles restent tétanisés.'),
  ishikawa_poing: r('cible', 'Ta peau devient roche, puis ton poing devient une montagne. Il pare, et son bras cède.', 'Ton poing de roche s’abat sur le sol au milieu d’eux, et les éclats font le reste.'),
  raiton_chidori: r('cible', 'La foudre crépite dans ta main, au bruit de mille oiseaux. Tu traverses la distance en ligne droite et la plantes dans sa poitrine.', 'Mille oiseaux chantent dans ta main. Tu fonces à travers leurs rangs, droit sur leur chef.'),
  rasengan: r('cible', 'Une sphère de chakra pur tourne dans ta paume, de plus en plus vite. Tu la lui enfonces dans le ventre : il part en vrille contre un arbre.', 'Tu traverses leur groupe, l’orbe tourbillonnant dans la paume, et frappes le plus fort d’entre eux.'),
  futton_gokamugen: r('large', 'Un mur de vapeur bouillante avance vers lui, sans fin. Il recule jusqu’à ne plus pouvoir reculer.', 'La vapeur infinie roule sur leurs rangs et cuit tout ce qui respire.'),
  ranton_reiza: r('zone', 'Des dizaines de rayons d’orage jaillissent de tes doigts, se courbent autour de sa garde et le frappent dans le dos.', 'Le cirque de lasers se déploie : chaque rayon choisit sa cible et la poursuit.'),
  yoton_yokai: r('zone', 'Tu craches une boue de lave acide. Là où elle touche, la roche fond, et lui avec.', 'Une vague de lave acide coule vers eux et dissout ce qu’elle touche.'),
  jiton_kinsa: r('cible', 'De la poussière d’or se lève et s’abat sur lui, plus lourde que le sable de fer, jusqu’à l’écraser au sol.', 'Une pluie d’or s’abat sur leur formation et les cloue sous son poids.'),
  shakuton_kajosatsu: r('cible', 'Une sphère de chaleur se colle à lui. En quelques secondes, il n’a plus une goutte d’eau dans le corps.', 'Les sphères ardentes se répartissent sur eux et les dessèchent sur place.'),
  bakuton_c0: r('large', 'Tu avales l’argile. Ta peau se couvre de veines noires qui grossissent. Tu le regardes droit dans les yeux, et tu souris : l’art est une explosion.', 'Tu avales l’argile et marches vers eux, le corps couvert de veines noires. Ils comprennent trop tard. Le ciel devient blanc.'),
  edo_tensei: r('cible', 'Un cercueil sort de terre. Le couvercle tombe : un mort que tu as rappelé se tient là, le teint de papier, et frappe sans hésiter.', 'Trois cercueils jaillissent du sol. Les morts que tu as rappelés avancent sur eux sans peur et sans douleur.'),
  izanami: r('cible', 'Il revit le même instant, encore et encore, à chaque fois un peu différent. Il ne sortira de la boucle qu’en acceptant ce qu’il est. Ton œil se ferme.', 'Tu enfermes leur chef dans une boucle de destin. Les autres le voient refaire le même geste, encore et encore, et fuient.'),

  biju_version2: r('large', 'Une queue, deux, quatre. Ta peau se craquelle et le chakra rouge prend la forme d’une bête miniature autour de toi. Il voit sa mort dans tes yeux fendus.', 'Le chakra de la bête prend forme autour de toi, queues dressées. Tu fonds sur eux à quatre pattes, et ils ne savent plus contre quoi ils se battent.'),
  biju_mode: r('large', 'Tu prends la forme entière de la bête, plus haute que les arbres. Il lève les yeux, minuscule, et ne se bat plus : il prie.', 'La bête entière se dresse au-dessus du champ de bataille. Une armée cesse de courir pour la regarder. Puis elle frappe.'),
  biju_dama: r('large', 'Le chakra noir et blanc se condense dans ta gueule, tu l’avales, et tu le recraches. L’horizon derrière lui disparaît.', 'Une sphère noire part de ta gueule vers leur formation. Quand la lumière retombe, il n’y a plus de formation, ni de colline derrière.'),

  // ── Transformations et techniques qui n'existent que transformé ──
  raiton_yoroi: r('cible', 'L’armure de foudre te porte jusqu’à lui en un éclair, et ton poing arrive avant qu’il ait fini de cligner des yeux.', 'Sous l’armure de foudre, tu passes de l’un à l’autre plus vite que leurs regards.'),
  raiton_lariat: r('cible', 'Bras tendu, tu fonces à travers lui, la foudre au coude. Il est fauché net.', 'Tu traverses leur ligne bras tendu ; ils tombent en rangée, comme des épis.'),
  raiton_guillotine: r('cible', 'Un saut, puis ton talon chargé de foudre tombe sur sa nuque comme un couperet.', 'Tu bondis au-dessus d’eux, et ton talon foudroyant s’abat sur leur chef, le sol s’ouvrant tout autour.'),
  sennin_rasengan: r('cible', 'Un Rasengan grand comme un homme tourne dans ta paume, nourri par la montagne. Tu le lui enfonces dans le ventre.', 'Tu traverses leur groupe, l’orbe géant dans la main, et frappes le plus dangereux.'),
  kawazu_kumite: r('cible', 'Tu frappes à côté. L’énergie naturelle, elle, ne rate pas : il est projeté contre un arbre sans que ton poing l’ait touché.', 'Tes coups prolongés par l’énergie naturelle les frappent à distance, l’un après l’autre.'),
  tai_ura_renge: r('cible', 'Tu le projettes en l’air d’un coup de pied, tu le rattrapes, tu le frappes encore, puis tu le ramènes au sol en vrille.', 'Tu prends le plus fort, le projettes au ciel, et le renvoies au milieu des autres comme une météorite.'),
  tai_sekizo: r('large', 'Cinq coups de poing qui frappent l’air comme les pattes d’un éléphant. Le cinquième l’emporte, lui et la colline.', 'Les coups d’air comprimé tombent sur leur formation l’un après l’autre, jusqu’au cinquième.'),
  byakugo_okasho: r('zone', 'Ton poing chargé de chakra rate son visage et touche le sol. La terre se fend en étoile sous ses pieds.', 'Ton poing frappe le sol au milieu d’eux, et le terrain explose en éclats de roche.'),
  marque_ailes: r('cible', 'Tes ailes de chair te portent au-dessus de lui, puis tu plonges, griffes en avant.', 'Tu t’élèves au-dessus d’eux et tu plonges sur le plus faible, puis sur le suivant.'),
  katon_manteau: r('cible', 'Couvert·e de braises, tu fonds sur lui ; chaque coup laisse une brûlure.', 'Ton manteau de braises traverse leurs rangs, et le feu prend sur ceux que tu frôles.'),
  katon_phenix_avatar: r('large', 'Le phénix déploie ses ailes et s’abat sur lui. L’herbe se change en verre.', 'Le phénix plonge sur leur formation, et le champ de bataille s’embrase.'),
  katon_plongeon: r('cible', 'Tu montes jusqu’aux nuages, puis tu plonges, comète de flammes, droit sur lui.', 'Tu tombes du ciel au milieu d’eux comme une comète ; le cratère fume longtemps.'),
  suiton_maree: r('cible', 'L’eau qui t’enveloppe frappe avec toi, chaque coup doublé d’une vague.', 'Ta marée se déverse sur eux et les déséquilibre tous.'),
  suiton_leviathan: r('large', 'Le requin d’eau dont tu es le cœur fond sur lui, gueule ouverte.', 'Le léviathan traverse leurs rangs comme une vague vivante.'),
  suiton_maelstrom: r('zone', 'Un tourbillon d’eau l’aspire, le fait tourner, le broie.', 'Le maelström s’ouvre sous leurs pieds et les avale un à un.'),
  fuuton_voile: r('cible', 'Ta spirale de vent tranchant l’entaille à chaque fois que vous vous croisez.', 'Tu passes au milieu d’eux, et le voile de lames les entaille tous.'),
  fuuton_ouragan_forme: r('large', 'L’ouragan dont tu es le cœur l’arrache du sol et le relâche de haut.', 'L’ouragan traverse leur formation et la disperse comme de la paille.'),
  fuuton_mille_lames: r('zone', 'Mille lames de vent partent de toi en même temps. Il en pare une dizaine.', 'Mille lames de vent s’abattent sur leur groupe ; il n’y a pas assez de place pour les esquiver.'),
  doton_granit: r('cible', 'Ta peau de granit encaisse son coup, et ton poing de pierre le renvoie au sol.', 'Ils frappent, et leurs lames s’ébrèchent sur toi. Tu avances.'),
  doton_titan: r('large', 'Le titan de pierre abat son poing sur lui ; la terre s’ouvre en étoile.', 'Le titan avance au milieu d’eux, et chacun de ses pas renverse une rangée.'),
  doton_seisme: r('zone', 'Un seul pas : la terre se fend de toi jusqu’à lui et l’avale à moitié.', 'Ton pied frappe le sol ; une faille court sous leur formation et s’ouvre.'),
  raiton_kirin_eclair: r('cible', 'Tu ne cours plus : tu deviens un éclair noir, qui le traverse de part en part.', 'Un éclair noir zigzague entre eux ; quand il s’arrête, ils sont tous à terre.'),
  hyoton_armure: r('cible', 'Ton poing de glace le touche, et le givre gagne son bras jusqu’à l’épaule.', 'Ceux qui te frappent voient leurs armes geler jusqu’au manche.'),
  yoton_cuirasse: r('cible', 'Ta cuirasse de lave le frappe ; son armure fond au contact.', 'Tu avances au milieu d’eux, et leurs lames fondent sur ta cuirasse.'),
  jiton_carapace: r('cible', 'Ta carapace de fer se déplace pour parer, puis se déploie en griffes.', 'Les écailles de fer se détachent de toi et fusent vers eux comme des shuriken.'),
  susanoo_yasaka: r('zone', 'Le Susanoo lance une volée de magatama de chakra, grosses comme des rochers. Il en esquive deux.', 'Une pluie de magatama s’abat sur leur formation.'),

  // ── Combinaisons ──
  combo_tempete_feu: r('large', 'Ton Fūton fait naître une tornade ; tu y craches tes flammes, et elle devient une colonne de feu hurlante qui l’aspire.', 'Tu fais tourner ton Fūton jusqu’à lever une tornade, puis tu y craches tes flammes : une immense tornade enflammée avance et rafle tout sur son passage.'),
  combo_eau_foudre: r('zone', 'Tu le trempes d’un jet d’eau, puis la foudre suit le chemin de l’eau jusqu’à son cœur.', 'Tu noies le terrain, puis la foudre court dans chaque flaque. Ceux qui ont les pieds mouillés tombent les premiers, quel que soit leur camp.'),
  combo_meteores: r('large', 'Des blocs de roche arrachés au sol s’enflamment et retombent sur lui comme une pluie de météores.', 'Une pluie de météores s’abat sur leur formation. Où qu’ils courent, le ciel leur tombe dessus.'),
  combo_orage_ardent: r('zone', 'Un éclair qui s’embrase en chemin : il pare la foudre, mais pas le feu qui la suit.', 'L’orage ardent saute de branche en branche et met le feu partout où il frappe.'),
  combo_typhon: r('large', 'Une trombe d’eau que ton vent fait tourner comme une vrille, droit sur lui.', 'Le typhon se lève au milieu d’eux et les emporte comme des fétus de paille.'),
  combo_tempete_sable: r('large', 'Un mur de sable et de gravier qui l’écorche et l’aveugle.', 'La tempête de poussière avale tout le champ de bataille ; plus personne n’y voit, ni eux ni les tiens.'),
  combo_vapeur: r('zone', 'Le feu et l’eau se détruisent en un voile de vapeur brûlante qui l’enveloppe. Tu frappes à travers le brouillard.', 'Un voile de vapeur brûlante roule sur leurs rangs et cuit la peau de ceux qui le respirent.'),
  combo_coulee: r('zone', 'Une coulée de boue l’ensevelit jusqu’à la taille.', 'Une coulée lourde déferle sur eux et les retient prisonniers de la boue.'),
  combo_ouragan: r('large', 'Une rafale chargée de foudre ; même toi, tu ne sais pas exactement où elle va frapper.', 'L’ouragan électrique balaie leurs rangs. Le vent rend la foudre presque impossible à guider.'),
  combo_pointes: r('zone', 'Des lances de pierre jaillissent sous ses pieds, chargées de foudre.', 'Un champ de pointes foudroyantes jaillit sous leur formation.'),

  // ── Dōjutsu ──
  tsukuyomi: r('cible', 'Tes yeux croisent les siens. Pour toi, un battement de cils ; pour lui, trois jours de supplice.', 'Tu captes le regard de leur chef. Il hurle et s’effondre, et les autres ne comprennent pas ce qu’ils viennent de voir.'),
  amaterasu: {
    ...r('zone', 'Ton œil saigne. Des flammes noires naissent sur son épaule. Il les frappe, elles passent sur sa main. Elles ne s’éteindront pas.', 'Les flammes noires s’allument partout où se pose ton regard, et ton regard ne peut pas tout surveiller.'),
    paliers: [
      { min: 4, duel: 'Les flammes noires t’obéissent désormais : tu les façonnes en lances, en murs, en cage autour de lui. Il cherche une sortie. Il n’y en a pas.', escouade: 'Tu façonnes les flammes noires en une vague qui se plie autour des tiens et se referme sur eux seulement. Ton œil saigne. Ton contrôle, lui, est parfait.' },
    ],
  },
  kamui: r('cible', 'Ses coups traversent ton corps comme de la fumée. Puis c’est lui qui disparaît, aspiré par ton œil.', 'L’espace se tord : leurs lames te traversent, et le plus proche d’entre eux disparaît dans le vide.'),
  kotoamatsukami: r('cible', 'Tu ne le frappes pas. Tu réécris ce qu’il veut, et il baisse sa garde de lui-même.', 'Leur chef se retourne contre les siens, persuadé d’avoir toujours été de ton côté.'),
  izanagi: r('cible', 'Sa lame te transperce. Puis la réalité se réécrit : elle n’a touché qu’un rêve, et tu es dans son dos.', 'Ils te croient à terre. L’instant d’après, tu te tiens derrière eux sans une égratignure, et ton œil se ferme pour toujours.'),
  susanoo: {
    ...r('large', 'Des côtes de chakra pourpre jaillissent autour de toi, puis un bras de squelette, puis un crâne. Il voit le géant sortir de toi os par os et tombe à genoux, avant même que la main d’os ne s’abatte sur lui.', 'Un squelette de chakra se dresse autour de toi, haut comme une maison. Leurs kunai rebondissent sur ses côtes. La main osseuse balaie la première ligne.'),
    paliers: [
      { min: 2, duel: 'Le squelette se couvre de muscles de chakra, puis d’un visage aux yeux vides. Un géant à mi-corps se dresse au-dessus de lui, et il tombe à la renverse, livide, avant que le poing ne descende.', escouade: 'Le Susanoo prend chair : un géant à mi-corps, au visage de démon. Ils reculent tous en même temps, et le poing tombe au milieu d’eux.' },
      { min: 3, duel: 'Le Susanoo se dresse en entier, armuré, plus haut que les arbres. Dans sa main naît {armeSusanoo}. Il lève les yeux, tremble, tombe de peur… et l’arme s’abat.', escouade: 'Le Susanoo entier se lève, armure et visage de guerrier, et dans sa main naît {armeSusanoo}. D’un seul geste, la colline entière est tranchée en deux, eux avec.' },
      { min: 5, duel: 'Le Susanoo parfait : un dieu guerrier de chakra, ailé, haut comme une montagne, {armeSusanoo} à la main. Il ne se bat même pas. Il s’agenouille. Tu abaisses l’arme, et l’horizon derrière lui se fend.', escouade: 'Le Susanoo parfait déploie ses ailes au-dessus du champ de bataille. Une armée entière s’arrête. Dans sa main, {armeSusanoo}. Un seul coup, et les montagnes derrière eux portent la cicatrice pour mille ans.' },
    ],
  },
  shinra_tensei: r('large', 'Tu repousses tout : l’air, la terre, et lui avec.', 'Une onde invisible part de toi et rase tout ce qui t’entoure, les tiens compris s’ils sont trop près.'),
  bansho_tenin: r('cible', 'Tu tends la main ; il est arraché du sol et vient droit sur ton coup.', 'Tu attires à toi le plus dangereux d’entre eux, loin de la protection des autres.'),
  chibaku_tensei: r('large', 'Une sphère noire monte dans le ciel et arrache la terre autour de lui pour l’emprisonner.', 'Une sphère noire aspire roches, arbres et ninjas vers le ciel. Le sol se soulève sous tous les pieds.'),
  rinne_amenotejikara: r('cible', 'Il frappe là où tu étais. Tu as échangé ta place avec une pierre, juste derrière lui.', 'Tu échanges ta place avec un caillou au cœur de leur groupe ; ils se frappent entre eux en voulant t’atteindre.'),
  rinne_limbo: r('cible', 'Des ombres invisibles le frappent depuis un monde qu’il ne peut pas voir.', 'Tes ombres invisibles se répartissent entre eux ; ils tombent un à un sans jamais voir leur ennemi.'),
};

/** Quand une technique de zone touche un des tiens : une ligne par nature, sinon par famille. */
export const TIRS_AMIS: Record<string, string> = {
  katon: 'Les flammes débordent sur ton flanc : un des tiens doit plonger à terre, les vêtements en feu. Tu retiens ton geste trop tard.',
  suiton: 'L’eau emporte aussi un des tiens, qui roule dans la boue au lieu de couvrir ta gauche.',
  fuuton: 'La bourrasque déséquilibre un des tiens ; son kunai part dans le vide, et ta position se découvre.',
  raiton: 'La foudre ne choisit pas : un des tiens reçoit la décharge et s’effondre, tétanisé.',
  doton: 'Le sol se dérobe aussi sous un des tiens, qui tombe à genoux en pleine mêlée.',
  genjutsu: 'L’illusion déborde : un des tiens voit des ombres partout et frappe à côté.',
  armes: 'Une de tes lames file trop près d’un allié et lui entaille le bras.',
  taijutsu: 'Emporté·e par l’élan, tu percutes un des tiens de plein fouet.',
  fusion: 'Ta fusion t’échappe un instant et frôle un des tiens, qui hurle.',
  biju: 'La bête ne fait pas la différence : un des tiens est projeté contre un arbre.',
  dojutsu: 'Ton pouvoir dépasse ta cible : un des tiens est pris dans son souffle.',
  transformation: 'Transformé·e, tu ne reconnais plus les visages : un des tiens prend un coup qui ne lui était pas destiné.',
  defaut: 'Le souffle de ta technique renverse un des tiens.',
};

const D: Affrontement = { forme: 'duel' };
const DA: Affrontement = { forme: 'duel', allies: true };
const E: Affrontement = { forme: 'escouade' };
const EA: Affrontement = { forme: 'escouade', allies: true };
// À ta merci après la victoire : l'achever, l'épargner, ou le ramener.
const DV: Affrontement = { forme: 'duel', verdict: true };
const DAV: Affrontement = { forme: 'duel', allies: true, verdict: true };
const EAV: Affrontement = { forme: 'escouade', allies: true, verdict: true };

/** Chaque combat du jeu : duel ou escouade, et y a-t-il des alliés ou des civils dans la mêlée ? Absent : duel. */
export const AFFRONTEMENTS: Record<string, Affrontement> = {
  'o_clan_kaguya/furie': D,
  'a_intimidation/intervenir': EA,
  'a_rival_defi/accepter': D,
  'e6_gonta/tenir': D,
  'e6_gonta_revanche/combattre': E,
  'e6_daichi/duel': D,
  'e6_daichi_revanche/duel': D,
  'e6_bagarre_ami/intervenir': EA,
  'a11_kaede/duel': D,
  'x_sho_route/arreter': E,
  'j17_kaede/duel': D,
  'hl_col/attaquer': EA,
  'hl_partage/defier': D,
  'hl_chasseurs/combattre': E,
  'hl_traqueurs/combattre': E,
  'hl_raid/kage': D,
  'v_rival_nuit/combattre': D,
  'vc_clan_rival/duel': D,
  'vc_embuscade/combattre': E,
  'a_examen_kiri/combattre': D,
  'a_examen_kiri/revolte': DA,
  'a_examen_kumo/frontal': D,
  'a_examen_kumo/strategie': D,
  'g_equipe/seul': D,
  'g_rival_retour/combattre': D,
  'g_traque_yuki/rester': EA,
  'md_messager/refuser': D,
  'md_marchand/combat': EA,
  'mc_caravane/eau': EA,
  'mc_frontiere_seul/liberer': EA,
  'mc_frontiere_embuscade/front': EA,
  'mc_frontiere_embuscade/proteger': EA,
  'mc_frontiere_embuscade/piege': EA,
  'y_epreuve/combattre': D,
  'y_epreuve_combat/combattre': D,
  'e_dojo/defier': D,
  'e_arene/sang': D,
  'e_arene/mort': DV,
  'e_duel/accepter': D,
  'e_duel_fin/epargner': D,
  'e_chasseurs/combattre': E,
  'e_reintegration/epreuve': D,
  'c2_foret/affronter_doton': EA,
  'c2_foret/affronter_raiton': EA,
  'c2_foret/affronter_katon': EA,
  'c2_tournoi/frontal': D,
  'c2_tournoi/pouvoir': D,
  'c2_seconde_chance/duel': D,
  'c2_crise_kumo/mission': EA,
  'c2_crise_iwa/defendre': EA,
  'c2_frontiere/tenir_doton': EA,
  'c2_frontiere/tenir_raiton': EA,
  'c2_frontiere/tenir_katon': EA,
  'mb_daimyo/intercepter': DAV,
  'mb_mines/combattre': D,
  'c2r_contrat/duel': D,
  'c2r_kusa/defendre': EAV,
  'c3_premier_front/charger_doton': EA,
  'c3_premier_front/charger_raiton': EA,
  'c3_premier_front/charger_katon': EA,
  'c3_as/duel_doton': DA,
  'c3_as/duel_raiton': DA,
  'c3_as/duel_katon': DA,
  'c3_guerre_kiri/rebelles': EA,
  'c3_guerre_kumo/avantgarde': EA,
  'c3_paix/proteger': EA,
  'c3_jonin/mission': E,
  'ma_ravitaillement/forcer': EAV,
  'c3r_bataille/combattre': EA,
  'c4_lame/chercher_shinboku': D,
  'c4_lame/chercher_yunagi': D,
  'c4_lame/chercher_samehada': D,
  'c4_lame/chercher_narukami': D,
  'c4_lame/chercher_ganseki': D,
  'c4_traitre/affronter': E,
  'ms_otage/assaut': EAV,
  'ma_nord/liberer': EA,
  'c4r_epreuve/defendre': EA,
  'x_jeune_insolent/lecon': D,
  'c5v_cmd_frontiere/force': EA,
  'c5v_ombre_complot/mener': EA,
  'c5v_dip_otage/evasion': E,
  'c5vr_epreuve/combattre': E,
  'c5_menace/amiral': DA,
  'c5_rival/combat': D,
  'c5_releve/partir': EA,
  'c5r_navire/villages': EA,
  'm_jinchuriki_arme/liberer': E,
  'm_chasseurs_biju/combattre': E,
  'x_epargne_vengeance/combattre': DV,
  'sn_orochimaru/attaquer': D,
  'sn_tsunade/defier': D,
  'ak_recrutement/refuser': E,
  'ak_prime/chasser': DV,
  'ak_jinchuriki/obeir': EA,
  'ak_chef/defier': D,
  'ak_traque/combattre': E,
  'f_quartier/enfant': EA,
  'f_quartier/conjoint': EA,
  'f_quartier/ami': EA,
  'f_quartier/tous': EA,
  'f_vengeance/combattre': DV,
  'f_enlevement/seul': EAV,
  'cm_deux_camarades/ami': EA,
  'cm_eleves/daichi': EA,
  'cm_eleves/mio': DA,
  'cm_eleves_suite/chercher': EAV,
  'm4_assassinat/attendre': E,
  'm4_escorte/daimyo': EA,
  'm4_deserteur/combattre': DV,
  'm4_negociation/denoncer': DA,
  'm4_sceau/combattre': D,
  'm4_pont/tenir': EA,
  'm4_forteresse/prisonniers': EAV,
  'm4_forteresse/camarade': EA,
  'm4_sabotage/reveiller': EA,
  'x_fille_ministre/combattre': DV,
  'r_terrain_rival/duel': D,
  'r_foret_poursuite/poursuivre': D,
  'r_village_attaque/combattre': EA,
  'r_base_secrete/prisonnier': DV,
  'r_vallee_fin/duel': D,
  'b_dechainement/laisser': EA,
  'b_accord/force': D,
};

const adv = (id: string, nom: string, rang: TechniqueAdverse['rang'], puissance: number, element: ElementId | undefined, duel: string, escouade: string): TechniqueAdverse => ({ id, nom, rang, puissance, element, duel, escouade });

/**
 * Ce que lancent les adversaires quand ils prennent l'initiative : de leur nature si on la connaît,
 * sinon des techniques sans nature, jamais au-dessus de leur rang (1 genin … 4 jōnin d'élite).
 */
export const TECHNIQUES_ADVERSES: TechniqueAdverse[] = [
  adv('adv_kunai', 'Volée de kunai', 1, 6, undefined, 'Il lance une volée de kunai, puis une seconde, cachée dans l’ombre de la première.', 'Une pluie de kunai part de leurs rangs, de trois directions à la fois.'),
  adv('adv_corps', 'Assaut au corps à corps', 1, 5, undefined, 'Il fond sur toi, poings et genoux, un enchaînement qui ne te laisse pas respirer.', 'Deux d’entre eux te chargent ensemble, l’un haut, l’autre bas.'),
  adv('adv_clones', 'Clones d’ombre', 2, 8, undefined, 'Quatre de lui jaillissent des fourrés. Un seul est réel, et il est déjà dans ton dos.', 'Leurs clones se mêlent à eux ; tu ne sais plus combien ils sont, ni lequel frappe.'),
  adv('adv_genjutsu', 'Genjutsu', 2, 9, undefined, 'Le monde se met à fondre autour de toi : un genjutsu. Quelque part dans l’illusion, sa lame avance.', 'Leur sensoriel compose des signes et le sol se dérobe sous ton regard, pendant que les autres frappent.'),
  adv('adv_parchemins', 'Parchemins explosifs', 2, 10, undefined, 'Des parchemins explosifs s’ouvrent tout autour de toi, et il claque des doigts.', 'Ils ont piégé le terrain : les parchemins s’allument en chaîne et la ligne de feu court vers toi.'),
  adv('adv_sabre', 'Coupe au sabre', 3, 12, undefined, 'Son sabre sort du fourreau trop vite pour l’œil : une coupe à hauteur de gorge.', 'Leur épéiste se détache du groupe, lame basse, et vise tes jambes.'),
  adv('adv_poison', 'Aiguilles empoisonnées', 3, 11, undefined, 'Une aiguille empoisonnée, soufflée depuis sa manche, droit vers ton cou.', 'Une nuée de senbon empoisonnés part des arbres.'),
  adv('adv_secret', 'Technique secrète', 4, 16, undefined, 'Il compose une suite de signes que tu n’as jamais vue. Une technique secrète, la sienne, et elle est pour toi.', 'Ils joignent leurs signes : une technique de groupe, préparée pour toi seul·e.'),

  adv('adv_katon_boule', 'Katon : Boule de feu', 1, 7, 'katon', 'Il gonfle la poitrine et crache une boule de feu qui avale tout le chemin entre vous.', 'Trois boules de feu partent de leur ligne et se rejoignent sur toi.'),
  adv('adv_katon_phenix', 'Katon : Fleurs de phénix', 2, 10, 'katon', 'Une gerbe de flammes guidées fond sur toi, et chacune cache un shuriken.', 'Les fleurs de phénix pleuvent de toutes parts, et le feu prend dans l’herbe autour de toi.'),
  adv('adv_katon_dragon', 'Katon : Dragon de feu', 3, 14, 'katon', 'Un dragon de flammes jaillit de sa bouche et se tord dans l’air pour te suivre.', 'Un dragon de flammes sort de leurs rangs et balaie le terrain, ne laissant qu’un seul couloir libre.'),
  adv('adv_suiton_projectile', 'Suiton : Projectile d’eau', 1, 7, 'suiton', 'Un jet d’eau comprimée, dur comme la pierre, file vers ta poitrine.', 'Des jets d’eau croisés te prennent en tenaille.'),
  adv('adv_suiton_dragon', 'Suiton : Dragon aqueux', 2, 10, 'suiton', 'La rivière se lève derrière lui et prend la forme d’un dragon qui fond sur toi.', 'Un dragon aqueux s’abat sur ta position, le poids d’un fleuve entier.'),
  adv('adv_suiton_requin', 'Suiton : Requin géant', 3, 14, 'suiton', 'Une vague prend la forme d’un requin, gueule ouverte, et charge.', 'Une vague de requins d’eau déferle de leurs lignes et ne s’arrête pas.'),
  adv('adv_fuuton_lame', 'Fūton : Lame de vent', 1, 7, 'fuuton', 'Il tranche l’air de la main ; une lame invisible siffle vers toi.', 'Des lames de vent se croisent au-dessus du terrain, à hauteur de cou.'),
  adv('adv_fuuton_vide', 'Fūton : Balle de vide', 2, 10, 'fuuton', 'Il crache de l’air comprimé comme un boulet de canon.', 'Une salve de balles d’air laboure le sol vers toi.'),
  adv('adv_fuuton_tranchant', 'Fūton : Grand tranchant', 3, 14, 'fuuton', 'Une lame d’air immense fend tout ce qui se trouve entre lui et toi, arbres compris.', 'Le grand tranchant du vent part de leurs rangs et fauche la colline.'),
  adv('adv_raiton_decharge', 'Raiton : Décharge', 1, 7, 'raiton', 'La foudre crépite dans ses paumes ; il vise ta poitrine.', 'La foudre court sur le sol mouillé depuis leurs pieds jusqu’aux tiens.'),
  adv('adv_raiton_lance', 'Raiton : Lance de foudre', 2, 10, 'raiton', 'Il étire la foudre en une lance blanche et la projette.', 'Des lances de foudre partent ensemble de leur ligne.'),
  adv('adv_raiton_armure', 'Raiton : Armure de foudre', 3, 14, 'raiton', 'La foudre l’enveloppe tout entier. Il disparaît, et réapparaît devant toi, le poing levé.', 'Leur chef s’entoure de foudre et traverse ses propres rangs pour te frapper.'),
  adv('adv_doton_boue', 'Doton : Sol de boue', 1, 6, 'doton', 'Le sol se liquéfie sous tes pieds, et il attend que tu t’enfonces.', 'Tout le terrain devient boue sous toi pendant qu’ils te contournent.'),
  adv('adv_doton_lances', 'Doton : Lances de pierre', 2, 10, 'doton', 'Des pointes de roche jaillissent sous tes pieds, l’une après l’autre, vers toi.', 'Une forêt de lances de pierre pousse sous ta position.'),
  adv('adv_doton_dragon', 'Doton : Dragon de terre', 3, 14, 'doton', 'Un dragon de terre sort du sol et crache des projectiles de boue durcie.', 'La colline elle-même se soulève en dragon et s’abat sur toi.'),
];
