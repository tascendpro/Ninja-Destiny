/**
 * Quand on relance la même technique dans un combat (§11.2, §11.3) : le récit change, et l'adversaire réagit.
 * « deux » : la deuxième fois ; « trois » : la troisième et au-delà. {tech} est la technique, {il}/{Il} l'adversaire.
 * Les clés sont les natures de chakra, puis les familles de technique ; « ninjutsu » sert de repli.
 */
export const REPETITIONS: Record<string, { deux: string[]; trois: string[] }> = {
  katon: {
    deux: ['{tech}, encore. {Il} a déjà reculé une fois devant ce feu : cette fois, {il} sait où se mettre.', 'Le même feu, la même trajectoire. {Il} recule exactement de la distance qu’il faut.', 'Tu relances {tech}. {Il} n’a plus l’air surpris : {il} a déjà mesuré la chaleur.'],
    trois: ['{tech}, une troisième fois. {Il} n’attend même plus de voir les flammes : {il} bouge dès ton premier signe.', 'Encore le feu. Tes signes, {il} les connaît par cœur maintenant. Ta gorge, elle, commence à brûler.', 'Tu craches {tech} pour la troisième fois. {Il} soupire presque en s’écartant.'],
  },
  suiton: {
    deux: ['{tech}, de nouveau. {Il} plie les genoux avant même que l’eau parte.', 'La même eau, le même angle. {Il} a appris à l’encaisser de biais.'],
    trois: ['Encore {tech}. {Il} lève le bras et laisse l’eau glisser dessus, comme sous une averse qu’{il} connaît.', 'L’eau part une troisième fois. {Il} sait déjà où elle tombera.'],
  },
  fuuton: {
    deux: ['{tech}, encore. {Il} se baisse un instant avant que le vent tranche.', 'La même lame de vent. {Il} a compris d’où elle part.'],
    trois: ['Une troisième {tech}. {Il} sent le vent tourner avant toi.', 'Tu relances le vent. {Il} se tourne de profil, juste assez pour qu’il passe.'],
  },
  raiton: {
    deux: ['{tech}, encore. {Il} reconnaît la trajectoire et pivote : l’éclair effleure sa veste. {Il} a compris ton rythme.', 'Le même éclair. {Il} ne regarde plus ta main, {il} regarde ton épaule.'],
    trois: ['Encore la foudre. {Il} a planté un kunai dans le sol à côté de {lui} : l’éclair y file.', '{tech}, une troisième fois. Tes doigts te picotent ; {lui} n’a même plus peur du bruit.'],
  },
  doton: {
    deux: ['{tech}, encore. Cette fois, {il} saute avant que la terre bouge.', 'La même roche, au même endroit. {Il} frappe la fissure du premier choc.'],
    trois: ['Une troisième fois la terre. {Il} reste en l’air, de rocher en rocher : ta technique n’a plus de sol sous {lui}.', 'Encore {tech}. Le terrain est tellement retourné qu’il te gêne autant que {lui}.'],
  },
  taijutsu: {
    deux: ['Le même coup. {Il} lève les bras au bon endroit, cette fois.', 'Tu recommences le même enchaînement. {Il} recule d’un demi-pas, juste ce qu’il faut.'],
    trois: ['{Il} lève encore les bras, et cette fois au bon endroit : ton coup trouve sa garde, pas son ventre.', 'Encore le même geste. {Il} l’attend, presque avec ennui.'],
  },
  genjutsu: {
    deux: ['Les pétales tombent à nouveau. {Il} ferme les yeux à demi : {il} sait ce qui arrive.', '{tech}, une deuxième fois. {Il} se mord la lèvre pour rester éveillé.'],
    trois: ['Les pétales tombent encore. {Il} ferme les yeux et sourit : « Pas trois fois. »', 'Ton illusion se forme pour la troisième fois. {Il} la traverse comme un rideau.'],
  },
  armes: {
    deux: ['La même attaque à la lame. {Il} ne pare plus en haut : {il} attend ta feinte.', 'Tu relances {tech}. Sa lame est déjà là où la tienne arrive.'],
    trois: ['Encore {tech}. {Il} écarte ta lame d’un geste las, comme on chasse une mouche.', 'Une troisième fois le même angle. Sa garde ne bouge même plus.'],
  },
  fuinjutsu: {
    deux: ['Le même sceau. {Il} recule hors du cercle avant qu’il se referme.'],
    trois: ['Encore {tech}. {Il} efface du pied le tracé que tu prépares.'],
  },
  medical: {
    deux: ['{tech}, encore. {Il} a vu ta main briller la première fois : {il} garde ses distances.'],
    trois: ['Ta main brille une troisième fois. {Il} ne te laisse plus approcher.'],
  },
  dojutsu: {
    deux: ['Tes yeux brûlent pour la deuxième fois. {Il} détourne le regard, juste à temps.'],
    trois: ['{tech}, encore. {Il} ne te regarde plus en face : {il} fixe tes pieds.'],
  },
  biju: {
    deux: ['Le chakra de la bête monte encore. {Il} recule : la première fois lui a suffi.'],
    trois: ['Encore la bête. Ton corps fume ; {il} attend que tu t’épuises.'],
  },
  ninjutsu: {
    deux: ['{tech}, encore. Cette fois, {il} a reconnu tes signes avant la fin.', 'Tu relances {tech}. {Il} n’a plus l’air surpris.'],
    trois: ['{tech}, une troisième fois. {Il} connaît la séquence par cœur.', 'Encore {tech}. {Il} a eu tout le temps d’y penser.'],
  },
};

/** Ce que dit l'adversaire quand on lui ressert la même technique. */
export const REACTIONS_REPETITION: { deux: string[]; trois: string[] } = {
  deux: ['Encore ça ?', 'Tu n’as rien d’autre ?', 'Je l’ai déjà vue, celle-là.', 'Deux fois la même. Tu me facilites la tâche.'],
  trois: ['Tu crois vraiment que ça va marcher une troisième fois ?', 'Je pourrais la faire à ta place, maintenant.', 'Tu te répètes. Tu as peur d’essayer autre chose ?', 'Encore ! Tu n’apprends donc jamais ?'],
};
