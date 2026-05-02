import axios from 'axios';

const EPIC_BASE = 'https://account-public-service-prod.ol.epicgames.com';
const FORTNITE_BASE = 'https://fortnite-public-service-prod11.ol.epicgames.com';

/**
 * Récupère les infos du compte Epic (email, 2FA, etc.)
 * @param {string} accessToken
 * @param {string} accountId
 */
export async function getAccountInfo(accessToken, accountId) {
  const { data } = await axios.get(
    `${EPIC_BASE}/account/api/public/account/${accountId}`,
    { headers: { Authorization: `bearer ${accessToken}` } }
  );
  return data;
}

/**
 * Récupère le solde de V-Bucks du compte
 * @param {string} accessToken
 * @param {string} accountId
 */
export async function getMyVbucks(accessToken, accountId) {
  try {
    const { data } = await axios.get(
      `${FORTNITE_BASE}/fortnite/api/game/v2/profile/${accountId}/client/QueryProfile`,
      {
        method: 'POST',
        headers: {
          Authorization: `bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        params: { profileId: 'common_core', rvn: -1 },
        data: {},
      }
    );

    // Chercher la quantité de V-Bucks dans le profil
    const items = data?.profileChanges?.[0]?.profile?.items ?? {};
    let vbucks = 0;
    for (const item of Object.values(items)) {
      if (item.templateId?.startsWith('Currency:MtxPurchased')) {
        vbucks += item.quantity ?? 0;
      }
    }
    return vbucks;
  } catch {
    return 0;
  }
}

/**
 * Récupère les stats BR via l'API Epic (authentifié)
 * @param {string} accessToken
 * @param {string} accountId
 */
export async function getMyStats(accessToken, accountId) {
  const { data } = await axios.get(
    `${FORTNITE_BASE}/fortnite/api/stats/accountId/${accountId}/bulk/window/alltime`,
    { headers: { Authorization: `bearer ${accessToken}` } }
  );
  return data;
}
