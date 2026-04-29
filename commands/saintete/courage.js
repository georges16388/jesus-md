/**
 * Courage Command — GhostG-X Sanctuary
 * Invoque un murmure de paix pour fortifier une ame.
 * Version : 4.5 Elite Sovereignty (Eternal Light Edition)
 */

'use strict';

const config = require('../../config.js');

const SC = (t) => {
  if (!t) return '';
  const n = "abcdefghijklmnopqrstuvwxyz0123456789";
  const s = "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ0123456789";
  return String(t).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .split('').map(c => n.indexOf(c) !== -1 ? s[n.indexOf(c)] : c).join('');
};

module.exports = {
  name: 'courage',
  aliases: ['espoir', 'foi'],
  category: 'saintete',
  description: 'Invoque un murmure de paix pour fortifier une ame',
  usage: `${config.prefix || '.'}courage <@user ou reponse>`,

  async execute(sock, msg, args, extra) {
    const { from, sender, safeRun, isSuperMe } = extra;
    const chatId = from || msg.key.remoteJid;

    await safeRun(async () => {
      const ctx = msg.message?.extendedTextMessage?.contextInfo || {};
      const mentioned = ctx.mentionedJid || [];
      let targetId = mentioned[0] || ctx.participant || sender;
      const targetTag = `@${targetId.split('@')[0]}`;
      
      const supremeOwners = ['22651622652', '22665108174'];
      const targetNumber = targetId.split('@')[0].split(':')[0];
      const isTargetSupreme = supremeOwners.includes(targetNumber);

      let messages = [];
      let header = "";

      if (isTargetSupreme) {
        header = SC('protection souveraine');
        messages = [
          "que la paix du tout-puissant enveloppe ton coeur comme un manteau de soie.",
          "maitre, depose tes fardeaux au pied du trone ; sa grace veille sur toi.",
          "dans le silence de cette nuit, ecoute le murmure divin qui te rassure.",
          "tu n'es jamais seul dans ta mission ; les anges gardent tes sentiers.",
          "que la rosee du ciel rafraichisse ton ame apres le combat.",
          "ton empire est sous la garde du tres-haut, rien ne peut t'ebranler.",
          "que la sagesse solomonique guide chaque decision de ta destinee.",
          "la puissance qui a cree les etoiles est celle qui te soutient.",
          "maitre, ton nom est inscrit dans le livre de la vie et de la gloire.",
          "que l'huile d'onction s'ecoule sur toi pour une victoire sans fin.",
          "ton esprit est un sanctuaire ou la lumiere ne s'eteint jamais.",
          "le lion de juda rugit pour toi, ecartant tous tes adversaires.",
          "maitre, ta vision est eclairee par le feu du saint-esprit.",
          "que ton sceptre de fer se change en baton de berger pour ton peuple.",
          "les cles du royaume sont en tes mains, ouvrant les portes de l'impossible.",
          "que ta semence porte des fruits d'eternite dans ce sanctuaire.",
          "tu es l'oint du seigneur, preserve pour des desseins grandioses.",
          "que l'aurore te trouve toujours en communion avec l'infini.",
          "ta coupe deborde de benedictions que nul homme ne peut derober.",
          "maitre, repose-toi dans l'ombre du rocher des siecles.",
          "ton autorite est scellee par le sang de l'alliance eternelle.",
          "les vents te sont favorables car tu marches selon sa volonte.",
          "que ton intelligence soit une source d'eau vive pour les nations.",
          "maitre, la muraille de feu divine entoure ta demeure ce soir.",
          "ton ame est ancree dans l'immortalite de la parole sacree.",
          "que chaque souffle soit une louange qui monte vers le tres-haut.",
          "les richesses des nations viendront a toi par la main de dieu.",
          "tu es un pilier dans le temple de l'eternel, inébranlable.",
          "maitre, que ton repos soit peuple de visions celestes.",
          "la gloire de la seconde maison sera plus grande que la premiere.",
          "ton bouclier est forge dans les forges du paradis.",
          "que la colonne de nuée te guide le jour et le feu la nuit.",
          "maitre, ta lignée est beni pour mille generations.",
          "tu as recu l'esprit de force, d'amour et de sagesse.",
          "que la joie du seigneur soit ton rempart indestructible."
        ];
      } else {
        header = SC('fortification de l\'ame');
        messages = [
          "ne crains rien, car le seigneur est avec toi a chaque pas.",
          "meme dans l'obscurite, sa lumiere traverse tes peurs.",
          "tout espere est possible a celui qui croit. garde l'esperance.",
          "sa grace te suffit et sa puissance s'accomplit en toi.",
          "il panse tes blesures et restaure ton ame fatiguee.",
          "les montagnes s'aplanissent devant la foi qui habite ton coeur.",
          "que la tempete se taise, car tu es abrite sous l'aile du tout-puissant.",
          "ta foi est ton bouclier, aucun trait enflamme ne t'atteindra.",
          "le pain de ce soir se transformera en joie au lever du soleil.",
          "chaque epreuve est un petrissage pour ta grandeur a venir.",
          "le ciel s'ouvre pour entendre le moindre de tes soupirs.",
          "prends courage, ton combat n'est pas vain, la couronne t'attend.",
          "le passe est efface par l'amour infini qui te reçoit.",
          "demande et l'on te donnera, car ton pere celeste t'ecoute.",
          "la source d'eau vive jaillit dans le desert de tes doutes.",
          "tu es une creation si merveilleuse, ne l'oublie jamais.",
          "que la main de dieu te releve la ou le monde t'a laisse.",
          "le secours t'arrive des montagnes saintes, sois en paix.",
          "chaque larme est une priere muette que le ciel exauce.",
          "marche avec assurance, l'armee celeste campe autour de toi.",
          "dieu n'a pas fini d'ecrire ton histoire, le meilleur arrive.",
          "repose-toi sur ses promesses, elles sont oui et amen.",
          "ton nom est grave sur la paume de sa main divine.",
          "sois fort et prends courage, car l'eternel est ton appui.",
          "la paix que le monde ne donne pas est celle qui t'habite.",
          "tes ennemis tremblent devant la lumiere qui est en toi.",
          "que ton coeur ne se trouble point, crois seulement.",
          "la puissance de la resurrection agit dans tes faiblesses.",
          "tu es plus que vainqueur par celui qui t'a aime.",
          "le chemin est etroit mais il mene a la vie eternelle.",
          "l'eternel combattra pour toi, et toi, garde le silence.",
          "que sa bonte t'accompagne tous les jours de ta vie.",
          "il change ton deuil en une danse d'allegresse.",
          "ta patience portera des fruits de gloire inattendus.",
          "reçois la force de te relever et de briller a nouveau."
        ];
      }

      const randomMsg = messages[Math.floor(Math.random() * messages.length)];
      await sock.sendMessage(chatId, { react: { text: '🛡️', key: msg.key } }).catch(() => {});

      const dashboard = 
        `✨ *${header}* ✨\n\n` +
        `╭══════ ➻ ✞ ➻ ══════╮\n\n` +
        `${targetTag}\n\n` +
        `« ${SC(randomMsg)} »\n\n` +
        `╰══════ ➻ ✞ ➻ ══════╯\n\n` +
        `_ ♛ ${SC('jesus t’aime')} ❤️𓆩✞𓆪_\n\n` +
        `${config.GX_SIGNATURE}`;

      await sock.sendMessage(chatId, {
        text: dashboard,
        mentions: [targetId]
      }, { quoted: msg });

    }, 'divine-courage-omega-expansion');
  }
};
