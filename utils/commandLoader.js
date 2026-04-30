'use strict';

const fs   = require('fs');
const path = require('path');

/**
 * Charge toutes les commandes depuis le dossier /commands
 * @param {boolean} forceReload - Si true, invalide le cache require pour hot-reload
 * @returns {Map<string, object>} Map nom/alias → commande
 */
const loadCommands = (forceReload = false) => {
  const commands     = new Map();
  const commandsPath = path.join(__dirname, '..', 'commands');

  if (!fs.existsSync(commandsPath)) {
    console.error('[JESUS-MD][CommandLoader] Dossier commands introuvable :', commandsPath);
    return commands;
  }

  let categories;
  try {
    categories = fs.readdirSync(commandsPath);
  } catch (err) {
    console.error('[JESUS-MD][CommandLoader] Impossible de lire /commands :', err.message);
    return commands;
  }

  for (const category of categories) {
    const categoryPath = path.join(commandsPath, category);

    let stat;
    try {
      stat = fs.statSync(categoryPath);
    } catch {
      continue;
    }
    if (!stat.isDirectory()) continue;

    let files;
    try {
      files = fs.readdirSync(categoryPath).filter(f => f.endsWith('.js'));
    } catch (err) {
      console.error(`[JESUS-MD][CommandLoader] Erreur lecture catégorie "${category}":`, err.message);
      continue;
    }

    for (const file of files) {
      const filePath = path.join(categoryPath, file);
      try {
        if (forceReload) {
          const resolved = require.resolve(filePath);
          if (require.cache[resolved]) delete require.cache[resolved];
        }

        const loaded = require(filePath);

        // Support pour exports tableau (ex: premium_admin.js exports [cmd1, cmd2, ...])
        const commandList = Array.isArray(loaded) ? loaded : [loaded];

        for (const command of commandList) {
          if (!command || typeof command.name !== 'string' || !command.name.trim()) {
            if (!Array.isArray(loaded)) {
              console.warn(`[JESUS-MD][CommandLoader] "${file}" sans nom valide — ignoré`);
            }
            continue;
          }

          const name = command.name.trim().toLowerCase();
          commands.set(name, command);

          if (Array.isArray(command.aliases)) {
            for (const alias of command.aliases) {
              if (typeof alias === 'string' && alias.trim()) {
                commands.set(alias.trim().toLowerCase(), command);
              }
            }
          }
        }

      } catch (error) {
        console.error(`[JESUS-MD][CommandLoader] Erreur sur "${category}/${file}":`, error.message);
        // On continue — une commande cassée ne bloque pas les autres
      }
    }
  }

  global.commands = commands;
  return commands;
};

module.exports = { loadCommands };