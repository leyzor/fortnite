/**
 * Génère une image grille de cosmétiques (style locker Fortnite)
 * comme sur les screenshots avec les skins disposés en rangées
 */

import { createCanvas, loadImage } from 'canvas';
import axios from 'axios';

const RARITY = {
  legendary:  { top: '#e3a21a', bot: '#9c6300' },
  epic:       { top: '#9b42c8', bot: '#5c1f82' },
  rare:       { top: '#2d9cff', bot: '#0052a3' },
  uncommon:   { top: '#37c954', bot: '#1a7a2e' },
  common:     { top: '#9a9a9a', bot: '#5a5a5a' },
  marvel:     { top: '#e8192c', bot: '#7a0010' },
  dc:         { top: '#1a75ff', bot: '#003bb5' },
  icon:       { top: '#00d4ff', bot: '#007a99' },
  gaminglegends: { top: '#7dff6b', bot: '#3a8f30' },
  starwars:   { top: '#ffe81a', bot: '#8a7800' },
  default:    { top: '#888888', bot: '#444444' },
};

const COLS = 10;
const CELL = 90;
const PAD  = 12;
const HEADER = 70;
const FOOTER = 40;

/**
 * Génère une image grille de cosmétiques
 * @param {Array} items - [{name, rarity, imageUrl}]
 * @param {string} title - Titre affiché en haut
 * @param {string} subtitle - Sous-titre (ex: "107 Skins")
 * @returns {Buffer} PNG buffer
 */
export async function generateLockerGrid(items, title = 'Locker', subtitle = '') {
  const rows = Math.ceil(items.length / COLS);
  const W = COLS * CELL + PAD * 2;
  const H = HEADER + rows * CELL + PAD + FOOTER;

  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext('2d');

  // ── Fond ──────────────────────────────────────────────────────────────────
  const bgGrad = ctx.createLinearGradient(0, 0, 0, H);
  bgGrad.addColorStop(0, '#0a0a1a');
  bgGrad.addColorStop(1, '#0d1a2e');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // ── Titre ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(title, PAD, 38);

  ctx.fillStyle = '#aaaaaa';
  ctx.font = '16px sans-serif';
  ctx.fillText(subtitle, PAD, 58);

  // ── Cellules ──────────────────────────────────────────────────────────────
  for (let i = 0; i < items.length; i++) {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    const x = PAD + col * CELL;
    const y = HEADER + row * CELL;
    await drawCell(ctx, items[i], x, y, CELL - 2);
  }

  // ── Footer ────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#555555';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('Fortnite Bot • fortnite-api.com', W - PAD, H - 12);

  return canvas.toBuffer('image/png');
}

// ── Dessine une cellule cosmétique ────────────────────────────────────────────
async function drawCell(ctx, item, x, y, size) {
  const rarity = (item.rarity || 'common').toLowerCase();
  const colors = RARITY[rarity] || RARITY.default;
  const radius = 8;

  // Fond dégradé rareté
  const grad = ctx.createLinearGradient(x, y, x, y + size);
  grad.addColorStop(0, colors.top);
  grad.addColorStop(1, colors.bot);

  ctx.beginPath();
  ctx.roundRect(x, y, size, size, radius);
  ctx.fillStyle = grad;
  ctx.fill();

  // Bordure subtile
  ctx.strokeStyle = colors.top + '99';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Image du cosmétique
  if (item.imageUrl) {
    try {
      const imgBuffer = await fetchImage(item.imageUrl);
      const img = await loadImage(imgBuffer);
      const imgSize = size * 0.82;
      const offset = (size - imgSize) / 2;
      ctx.drawImage(img, x + offset, y + offset - 4, imgSize, imgSize);
    } catch {
      // Si l'image fail : point d'interrogation
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.font = `${size * 0.4}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.fillText('?', x + size / 2, y + size / 2 + size * 0.1);
    }
  }

  // Bande de nom en bas
  const nameHeight = 18;
  const nameY = y + size - nameHeight;
  ctx.fillStyle = 'rgba(0,0,0,0.65)';
  ctx.beginPath();
  ctx.roundRect(x, nameY, size, nameHeight, [0, 0, radius, radius]);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${size > 70 ? 9 : 8}px sans-serif`;
  ctx.textAlign = 'center';
  const name = truncate(item.name || '', size < 80 ? 10 : 13);
  ctx.fillText(name, x + size / 2, nameY + 13);
}

// ── Cache d'images pour éviter de re-télécharger ──────────────────────────────
const imgCache = new Map();

async function fetchImage(url) {
  if (imgCache.has(url)) return imgCache.get(url);
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 5000 });
  const buf = Buffer.from(res.data);
  if (imgCache.size > 500) imgCache.clear(); // éviter les fuites mémoire
  imgCache.set(url, buf);
  return buf;
}

function truncate(str, max) {
  return str.length > max ? str.slice(0, max - 1) + '…' : str;
}

// ── Génère une grille pour UNE catégorie depuis les données fortnite-api ───────
export function formatCosmeticsForGrid(cosmetics) {
  return cosmetics.map(c => ({
    name: c.name,
    rarity: c.rarity?.value || 'common',
    imageUrl: c.images?.smallIcon || c.images?.icon || null,
  }));
}
