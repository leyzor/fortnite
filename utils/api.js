import axios from 'axios';

const BASE = 'https://fortnite-api.com';
const headers = () => ({ Authorization: process.env.FORTNITE_API_KEY });

/**
 * Récupère les stats d'un joueur via fortnite-api.com
 * @param {string} name - Pseudo du joueur
 * @param {string} accountType - 'epic' | 'psn' | 'xbl'
 */
export async function getPlayerStats(name, accountType = 'epic') {
  const { data } = await axios.get(`${BASE}/v2/stats/br/v2`, {
    headers: headers(),
    params: { name, accountType },
  });
  return data.data;
}

/**
 * Récupère le shop du jour
 */
export async function getShop() {
  const { data } = await axios.get(`${BASE}/v2/shop/br`, {
    headers: headers(),
    params: { language: 'fr' },
  });
  return data.data;
}

/**
 * Recherche un cosmétique par nom
 * @param {string} name
 */
export async function searchCosmetic(name) {
  const { data } = await axios.get(`${BASE}/v2/cosmetics/br/search`, {
    headers: headers(),
    params: { name, language: 'fr', matchMethod: 'contains' },
  });
  return data.data;
}

/**
 * Récupère les news Fortnite
 */
export async function getNews() {
  const { data } = await axios.get(`${BASE}/v2/news`, {
    headers: headers(),
    params: { language: 'fr' },
  });
  return data.data;
}

/**
 * Récupère la map actuelle
 */
export async function getMap() {
  const { data } = await axios.get(`${BASE}/v1/map`, {
    headers: headers(),
    params: { language: 'fr' },
  });
  return data.data;
}

/**
 * Vérifie un code créateur
 * @param {string} slug
 */
export async function getCreatorCode(slug) {
  const { data } = await axios.get(`${BASE}/v2/creatorcode`, {
    headers: headers(),
    params: { slug },
  });
  return data.data;
}

/**
 * Récupère tous les cosmétiques BR
 */
export async function getAllCosmetics() {
  const { data } = await axios.get(`${BASE}/v2/cosmetics/br`, {
    headers: headers(),
    params: { language: 'fr' },
  });
  return data.data ?? [];
}
