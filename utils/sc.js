// utils/sc.js — À CRÉER
'use strict';

const _N = 'abcdefghijklmnopqrstuvwxyz0123456789';
const _S = 'ᴀʙᴄᴅᴇғɢʜɪᴊᴋʟᴍɴᴏᴘǫʀsᴛᴜᴠᴡxʏᴢ0123456789';
const _M = Object.fromEntries([..._N].map((c, i) => [c, _S[i]]));

const SC = (t) =>
  !t ? '' : String(t).toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .split('').map(c => _M[c] ?? c).join('');

module.exports = { SC };