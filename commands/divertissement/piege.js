/**
 * ╔══════════════════════════════════════════╗
 * ║      GhostG-X Forge — Chaos Games       ║
 * ║  piege (Bombe) + morpion (TicTacToe)    ║
 * ║  Version : 4.5 Elite Sovereignty        ║
 * ╚══════════════════════════════════════════╝
 */

'use strict';

const config = require('../../config.js');

// ═══════════════════════════════════════════
//  SMALL CAPS HELPER
// ═══════════════════════════════════════════
const SC = (t) => {
  if (!t) return '';
  const n = "abcdefghijklmnopqrstuvwxyz0123456789";
  const s = "ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ0123456789";
  return String(t).toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, '')
    .split('').map(c => {
      const i = n.indexOf(c);
      return i !== -1 ? s[i] : c;
    }).join('');
};

// ═══════════════════════════════════════════
//  CONSTANTES PARTAGÉES
// ═══════════════════════════════════════════
const TIMEOUT_MS    = 180_000; // 3 minutes
const NUMBER_EMOJIS = ['1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣'];
const BOMB_EMOJI    = '💥';
const SAFE_EMOJI    = '✅';
const X_EMOJI       = '❌';
const O_EMOJI       = '⭕';
const BLANK_EMOJIS  = ['⬜','⬛']; // alternance pour grille morpion

// ═══════════════════════════════════════════
//  ÉTAT GLOBAL DES PARTIES
//  Structure commune :
//  { type, grid/board, currentTurn, timeoutId,
//    gameMsg, chatId, playerX?, playerO? }
// ═══════════════════════════════════════════
const gameState = new Map();

// ─── Nettoyage propre d'une partie ─────────
function clearGame(sender) {
  const game = gameState.get(sender);
  if (!game) return;
  clearTimeout(game.timeoutId);
  gameState.delete(sender);
}

// ─── Constructeur de timeout sécurisé ──────
function makeTimeout(sock, sender, chatId, gameMsg, onExpire) {
  return setTimeout(async () => {
    if (!gameState.has(sender)) return; // déjà terminée
    await onExpire().catch(e => console.error(`[GX Timeout] ${e.message}`));
    gameState.delete(sender);
  }, TIMEOUT_MS);
}

// ═══════════════════════════════════════════
//  BOMBE — LOGIQUE
// ═══════════════════════════════════════════

/** Génère une grille mélangée : 1 bombe + 8 sceaux sûrs */
function createBombGrid() {
  return [...Array(8).fill(SAFE_EMOJI), BOMB_EMOJI]
    .sort(() => Math.random() - 0.5)
    .map((emot, i) => ({
      emot,
      number: NUMBER_EMOJIS[i],
      position: i + 1,
      revealed: false
    }));
}

/** Rendu texte de la grille bombe (3×3) */
function renderBombGrid(grid) {
  let out = '';
  for (let i = 0; i < 9; i += 3) {
    out += '          ' + grid.slice(i, i + 3)
      .map(v => v.revealed ? v.emot : v.number)
      .join('') + '\n';
  }
  return out;
}

/** Dashboard principal bombe */
function buildBombDashboard(grid, safe, total = 8) {
  return (
    `💣 *${SC('le defi de la bombe')}* 💣\n\n` +
    `─────────────────\n` +
    `💡 *${SC('protocole')}* : → ${SC('envoie un chiffre [1-9]')}\n` +
    `🎯 *${SC('objectif')}* : → ${SC('ouvrir les sceaux sans perir')}\n` +
    `🔓 *${SC('sceaux surs')}* : → ${safe}/${total}\n` +
    `─────────────────\n\n` +
    renderBombGrid(grid) +
    `\n─────────────────\n` +
    `⏳ *${SC('temps')}* : → [ 3 ${SC('minutes')} ]\n` +
    `⚠️ *${SC('verdict')}* : → ${SC('evite la bombe ou subis l\'echec')}\n\n` +
    `_♛ ${SC('jesus t\'aime')} ❤️𓆩✞𓆪_\n\n` +
    `${config.GX_SIGNATURE}`
  );
}

// ═══════════════════════════════════════════
//  MORPION — LOGIQUE
// ═══════════════════════════════════════════

const WIN_LINES = [
  [0,1,2],[3,4,5],[6,7,8], // lignes
  [0,3,6],[1,4,7],[2,5,8], // colonnes
  [0,4,8],[2,4,6]           // diagonales
];

/** Vérifie gagnant + ligne gagnante */
function checkWinner(board) {
  for (const [a, b, c] of WIN_LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { mark: board[a], line: [a, b, c] };
    }
  }
  return null;
}

/** true si grille pleine */
const isFull = (board) => board.every(Boolean);

/** Rendu grille morpion (3×3 emojis) */
function renderTTTGrid(board, winLine = null) {
  const cells = board.map((cell, i) => {
    if (winLine?.includes(i)) {
      return cell === 'X' ? '🔴' : '🔵'; // surbrillance ligne gagnante
    }
    if (cell === 'X') return X_EMOJI;
    if (cell === 'O') return O_EMOJI;
    return NUMBER_EMOJIS[i];
  });
  let out = '';
  for (let i = 0; i < 9; i += 3) {
    out += '     ' + cells.slice(i, i + 3).join('') + '\n';
  }
  return out;
}

/** Dashboard morpion */
function buildTTTDashboard(game, winResult = null) {
  const { board, playerX, playerO, currentTurn } = game;
  const winLine = winResult?.line ?? null;
  const grid    = renderTTTGrid(board, winLine);

  let statusLine;
  if (winResult) {
    const winner = winResult.mark === 'X' ? playerX : playerO;
    statusLine = `🏆 *${SC('victoire')} !* → @${winner.split('@')[0]}`;
  } else if (isFull(board)) {
    statusLine = `🤝 *${SC('match nul')} !* → ${SC('personne ne gagne')}`;
  } else {
    const emoji = currentTurn === playerX ? X_EMOJI : O_EMOJI;
    statusLine = `${emoji} *${SC('tour de')}* → @${currentTurn.split('@')[0]}`;
  }

  return (
    `🎮 *${SC('morpion — ghostg-x')}* 🎮\n\n` +
    `─────────────────\n` +
    `${X_EMOJI} : @${playerX.split('@')[0]}\n` +
    `${O_EMOJI} : @${playerO.split('@')[0]}\n` +
    `─────────────────\n\n` +
    grid +
    `\n─────────────────\n` +
    statusLine + `\n\n` +
    `_♛ ${SC('jesus t\'aime')} ❤️𓆩✞𓆪_\n\n` +
    `${config.GX_SIGNATURE}`
  );
}

// ═══════════════════════════════════════════
//  HANDLER ENTRANT — appelé par handler.js
//  pour tout message numérique en cours de
//  partie (bombe ou morpion)
// ═══════════════════════════════════════════
async function handleGameInput(sock, msg, sender) {
  if (!gameState.has(sender)) return false;

  const game    = gameState.get(sender);
  const chatId  = game.chatId;
  const text    = (msg.message?.conversation
                || msg.message?.extendedTextMessage?.text || '').trim();

  // ── BOMBE ────────────────────────────────
  if (game.type === 'bomb') {
    const choice = parseInt(text, 10);
    if (isNaN(choice) || choice < 1 || choice > 9) return false;

    const cell = game.grid[choice - 1];
    if (cell.revealed) {
      await sock.sendMessage(chatId, {
        text: `⚠️ *${SC('sceau deja ouvert')} !* ${SC('choisis un autre.')}`,
      }, { quoted: msg }).catch(() => {});
      return true;
    }

    // Révèle la case
    cell.revealed = true;

    if (cell.emot === BOMB_EMOJI) {
      // 💥 EXPLOSION
      game.grid.forEach(c => c.revealed = true); // révèle tout
      clearGame(sender);
      await sock.sendMessage(chatId, {
        text:
          `💥 *${SC('booom')} !*\n\n` +
          `> ${SC('tu as touche la bombe sous le sceau')} ${cell.number} !\n\n` +
          renderBombGrid(game.grid) +
          `\n*${SC('tu as echoue, maitre.')}*\n\n` +
          `${config.GX_SIGNATURE}`,
      }, { quoted: msg }).catch(() => {});
      return true;
    }

    // Case sûre
    const safeCount = game.grid.filter(c => c.revealed && c.emot === SAFE_EMOJI).length;

    if (safeCount === 8) {
      // 🏆 VICTOIRE
      clearGame(sender);
      await sock.sendMessage(chatId, {
        text:
          `🏆 *${SC('victoire absolue')} !*\n\n` +
          `> ${SC('tu as ouvert tous les sceaux sans perir')} !\n\n` +
          renderBombGrid(game.grid) +
          `\n_♛ ${SC('le chaos t\'a epargne, maitre.')}_\n\n` +
          `${config.GX_SIGNATURE}`,
      }, { quoted: msg }).catch(() => {});
      return true;
    }

    // Partie continue — mise à jour du dashboard
    const updated = buildBombDashboard(game.grid, safeCount);
    await sock.sendMessage(chatId, { text: updated }, { quoted: msg }).catch(() => {});
    return true;
  }

  // ── MORPION ──────────────────────────────
  if (game.type === 'ttt') {
    // Seul le joueur dont c'est le tour peut jouer
    if (game.currentTurn !== sender) return false;

    const choice = parseInt(text, 10);
    if (isNaN(choice) || choice < 1 || choice > 9) return false;

    const idx = choice - 1;
    if (game.board[idx]) {
      await sock.sendMessage(chatId, {
        text: `⚠️ *${SC('case deja prise')} !* ${SC('choisis une autre.')}`,
      }, { quoted: msg }).catch(() => {});
      return true;
    }

    const mark = sender === game.playerX ? 'X' : 'O';
    game.board[idx] = mark;

    const winResult = checkWinner(game.board);
    const draw      = !winResult && isFull(game.board);

    if (winResult || draw) {
      clearGame(sender);
      // Aussi nettoyer depuis la perspective de l'adversaire
      const other = sender === game.playerX ? game.playerO : game.playerX;
      if (gameState.has(other) && gameState.get(other).type === 'ttt') {
        clearGame(other);
      }
      const finalText = buildTTTDashboard(game, winResult);
      await sock.sendMessage(chatId, {
        text: finalText,
        mentions: [game.playerX, game.playerO],
      }, { quoted: msg }).catch(() => {});
      return true;
    }

    // Passe le tour
    game.currentTurn = sender === game.playerX ? game.playerO : game.playerX;
    const updatedText = buildTTTDashboard(game);
    await sock.sendMessage(chatId, {
      text: updatedText,
      mentions: [game.playerX, game.playerO],
    }, { quoted: msg }).catch(() => {});
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════
//  MODULE EXPORT
// ═══════════════════════════════════════════
module.exports = {
  gameState,
  handleGameInput,

  // ── COMMANDE PIEGE (BOMBE) ───────────────
  piege: {
    name: 'piege',
    aliases: ['bomb', 'bombe'],
    category: 'divertissement',
    description: 'Invoque le chaos : evite la bombe cachee sous les sceaux',
    usage: `${config.prefix || '.'}piege`,

    async execute(sock, msg, args, extra) {
      const { from, sender, isSuperMe } = extra;
      const chatId = from || msg.key.remoteJid;

      // Vérif session — AVANT tout await pour éviter race condition
      if (gameState.has(sender)) {
        return sock.sendMessage(chatId, {
          text:
            `*⚠️ ${SC('tu as deja un defi en cours, maitre')} !*\n\n` +
            `> ${SC('termine ton epreuve ou attends le sablier.')}\n\n` +
            `${config.GX_SIGNATURE}`,
        }, { quoted: msg }).catch(e => console.error(`[piege] ${e.message}`));
      }

      // Réservation immédiate pour bloquer race condition
      gameState.set(sender, { type: 'bomb', __pending: true });

      try {
        const grid = createBombGrid();

        if (!isSuperMe) {
          await sock.sendMessage(chatId, {
            react: { text: '💣', key: msg.key },
          }).catch(() => {});
        }

        const dashboard = buildBombDashboard(grid, 0);
        const gameMsg = await sock.sendMessage(chatId, {
          text: dashboard,
          contextInfo: {
            externalAdReply: {
              title: "ɢʜᴏsᴛɢ-x : ᴄʜᴀᴏs ɢᴀᴍᴇ",
              body: "Survivez a l'epreuve des sceaux numerotes",
              thumbnailUrl: "https://telegra.ph/file/b3138928493e78b55526f.jpg",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: msg });

        const timeoutId = makeTimeout(sock, sender, chatId, gameMsg, async () => {
          const game = gameState.get(sender);
          const bombBox = game?.grid?.find(v => v.emot === BOMB_EMOJI);
          game?.grid?.forEach(c => c.revealed = true);
          await sock.sendMessage(chatId, {
            text:
              `*⏳ ${SC('le sablier est vide')} !*\n\n` +
              `> ${SC('la bombe se trouvait sous le sceau')} ${bombBox?.number ?? '?'}.\n` +
              `*${SC('tu as echoue, maitre.')}*\n\n` +
              (game?.grid ? renderBombGrid(game.grid) : '') +
              `${config.GX_SIGNATURE}`,
          }, { quoted: gameMsg });
        });

        // Mise en mémoire définitive (remplace le placeholder)
        gameState.set(sender, { type: 'bomb', grid, gameMsg, chatId, timeoutId });

      } catch (err) {
        console.error(`[piege execute] ${err.message}`);
        gameState.delete(sender); // libère le slot en cas d'erreur
      }
    }
  },

  // ── COMMANDE MORPION ─────────────────────
  morpion: {
    name: 'morpion',
    aliases: ['ttt', 'tictactoe'],
    category: 'divertissement',
    description: 'Defie un adversaire au morpion classique',
    usage: `${config.prefix || '.'}morpion @adversaire`,

    async execute(sock, msg, args, extra) {
      const { from, sender } = extra;
      const chatId = from || msg.key.remoteJid;

      // Récupère la mention
      const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                     || msg.message?.buttonsResponseMessage?.contextInfo?.mentionedJid?.[0];

      if (!mentioned) {
        return sock.sendMessage(chatId, {
          text:
            `⚠️ *${SC('mentionne un adversaire')} !*\n` +
            `> ${SC('usage')} : \`${config.prefix || '.'}morpion @pseudo\`\n\n` +
            `${config.GX_SIGNATURE}`,
        }, { quoted: msg }).catch(() => {});
      }

      if (mentioned === sender) {
        return sock.sendMessage(chatId, {
          text: `⚠️ *${SC('tu ne peux pas jouer contre toi-meme, maitre.')}*\n\n${config.GX_SIGNATURE}`,
        }, { quoted: msg }).catch(() => {});
      }

      // Vérifie que ni l'un ni l'autre n'est déjà en partie
      for (const player of [sender, mentioned]) {
        if (gameState.has(player)) {
          return sock.sendMessage(chatId, {
            text:
              `⚠️ *${SC('un joueur est deja en partie')} !*\n` +
              `> @${player.split('@')[0]} ${SC('doit terminer son defi actuel.')}\n\n` +
              `${config.GX_SIGNATURE}`,
            mentions: [player],
          }, { quoted: msg }).catch(() => {});
        }
      }

      // Réservation immédiate des deux slots
      const pendingEntry = { type: 'ttt', __pending: true };
      gameState.set(sender,   pendingEntry);
      gameState.set(mentioned, pendingEntry);

      try {
        const board = Array(9).fill(null);
        // X = initiateur, O = adversaire (aléatoire optionnel)
        const [playerX, playerO] = Math.random() < 0.5
          ? [sender, mentioned]
          : [mentioned, sender];

        const gameData = {
          type: 'ttt',
          board,
          playerX,
          playerO,
          currentTurn: playerX,
          chatId,
          gameMsg: null,
          timeoutId: null,
        };

        const dashboard = buildTTTDashboard(gameData);
        const gameMsg = await sock.sendMessage(chatId, {
          text: dashboard,
          mentions: [playerX, playerO],
          contextInfo: {
            externalAdReply: {
              title: "ɢʜᴏsᴛɢ-x : ᴍᴏʀᴘɪᴏɴ",
              body: "Que le meilleur gagne",
              thumbnailUrl: "https://telegra.ph/file/b3138928493e78b55526f.jpg",
              mediaType: 1,
              renderLargerThumbnail: true
            }
          }
        }, { quoted: msg });

        const timeoutId = makeTimeout(sock, playerX, chatId, gameMsg, async () => {
          // Nettoie les deux joueurs
          gameState.delete(playerX);
          gameState.delete(playerO);
          await sock.sendMessage(chatId, {
            text:
              `*⏳ ${SC('temps ecoule')} !*\n\n` +
              `> ${SC('la partie est annulee par manque d\'activite.')}\n\n` +
              `${config.GX_SIGNATURE}`,
            mentions: [playerX, playerO],
          }, { quoted: gameMsg });
        });

        gameData.gameMsg   = gameMsg;
        gameData.timeoutId = timeoutId;

        // Mise en mémoire définitive pour les deux joueurs
        // (même référence d'objet partagée)
        gameState.set(playerX, gameData);
        gameState.set(playerO, gameData);

      } catch (err) {
        console.error(`[morpion execute] ${err.message}`);
        gameState.delete(sender);
        gameState.delete(mentioned);
      }
    }
  }
};