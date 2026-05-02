import { EmbedBuilder } from 'discord.js';

export const COLORS = {
  blue:   0x2d9cff,
  green:  0x37c954,
  red:    0xe74c3c,
  gold:   0xf1c40f,
  purple: 0x9b42c8,
  grey:   0x95a5a6,
};

export function baseEmbed(title, colorOrDesc, color) {
  // Supporte baseEmbed(title, color) ou baseEmbed(title, description, color)
  if (typeof colorOrDesc === 'number') {
    return new EmbedBuilder().setTitle(title).setColor(colorOrDesc).setTimestamp();
  }
  return new EmbedBuilder()
    .setTitle(title)
    .setDescription(colorOrDesc)
    .setColor(color ?? COLORS.blue)
    .setTimestamp();
}

export function errorEmbed(message) {
  return new EmbedBuilder()
    .setTitle('❌ Erreur')
    .setDescription(message)
    .setColor(COLORS.red)
    .setTimestamp();
}

/** Formate un nombre avec séparateur milliers */
export function fmt(n) {
  if (n == null || isNaN(n)) return '—';
  return Number(n).toLocaleString('fr-FR');
}

/** Calcule le K/D */
export function kd(kills, deaths) {
  if (!deaths || deaths === 0) return kills ? fmt(kills) : '—';
  return (kills / deaths).toFixed(2);
}

/** Calcule le winrate */
export function winrate(wins, matches) {
  if (!matches || matches === 0) return '—';
  return ((wins / matches) * 100).toFixed(1) + '%';
}

/** Emoji selon le nombre de victoires */
export function getRankEmoji(wins) {
  if (wins >= 1000) return '👑';
  if (wins >= 500)  return '🏆';
  if (wins >= 100)  return '🥇';
  if (wins >= 50)   return '🥈';
  if (wins >= 10)   return '🥉';
  return '🎮';
}
