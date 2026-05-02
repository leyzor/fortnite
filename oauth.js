/**
 * OAuth Epic Games - tokens temporaires en mémoire uniquement
 * Flux standard OAuth2 Authorization Code d'Epic Games
 */

import axios from 'axios';
import express from 'express';
import crypto from 'crypto';

// Stockage EN MÉMOIRE uniquement (jamais sur disque)
// Map<discordUserId, { accessToken, refreshToken, expiresAt, displayName, accountId }>
const linkedAccounts = new Map();
const pendingStates = new Map(); // state → discordUserId

const EPIC_AUTH_URL   = 'https://www.epicgames.com/id/authorize';
const EPIC_TOKEN_URL  = 'https://account-public-service-prod.ol.epicgames.com/account/api/oauth/token';

// Client Epic Games Launcher (public, utilisé par la communauté pour apps perso)
const CLIENT_ID     = process.env.EPIC_CLIENT_ID     || 'ec684b8c687f479fadea3cb2ad83f5c6';
const CLIENT_SECRET = process.env.EPIC_CLIENT_SECRET || 'e1f31c211f28413186262d37a13fc84d';
const REDIRECT_URI  = process.env.REDIRECT_URI       || 'http://localhost:3000/callback';

let discordClient = null;

// ─── Démarrage du serveur Express pour le callback ────────────────────────────
export function startOAuthServer(client) {
  discordClient = client;
  const app = express();

  // Page d'accueil simple
  app.get('/', (_, res) => res.send(html(
    'Fortnite Bot',
    '🎮 Utilise <code>/link</code> dans Discord pour connecter ton compte Epic Games.'
  )));

  // Callback OAuth
  app.get('/callback', async (req, res) => {
    const { code, state, error } = req.query;

    if (error) return res.send(html('Annulé', '❌ Tu as annulé la connexion.', false));
    if (!code || !state) return res.status(400).send(html('Erreur', '❌ Lien invalide.', false));

    const discordUserId = pendingStates.get(state);
    if (!discordUserId) return res.send(html('Expiré', '⏳ Le lien a expiré. Refais <code>/link</code>.', false));
    pendingStates.delete(state);

    try {
      const { data } = await axios.post(
        EPIC_TOKEN_URL,
        new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: REDIRECT_URI }),
        { headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' } }
      );

      linkedAccounts.set(discordUserId, {
        accessToken:  data.access_token,
        refreshToken: data.refresh_token,
        expiresAt:    Date.now() + data.expires_in * 1000,
        displayName:  data.displayName,
        accountId:    data.account_id,
      });

      // DM Discord
      try {
        const user = await discordClient?.users.fetch(discordUserId);
        await user?.send(`✅ Compte **${data.displayName}** lié ! Utilise \`/myaccount\` ou \`/locker\`.`);
      } catch {}

      return res.send(html(
        '✅ Connecté !',
        `Ton compte Epic <strong>${data.displayName}</strong> est lié.<br>Tu peux fermer cette page. 🎮`,
        true
      ));
    } catch (err) {
      console.error('OAuth callback error:', err.response?.data || err.message);
      return res.send(html('Erreur', '❌ Impossible d\'échanger le code. Réessaie avec /link.', false));
    }
  });

  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🌐 OAuth server → http://localhost:${port}`));
}

// ─── Générer l'URL de connexion pour un utilisateur Discord ──────────────────
export function generateAuthURL(discordUserId) {
  const state = crypto.randomBytes(16).toString('hex');
  pendingStates.set(state, discordUserId);
  setTimeout(() => pendingStates.delete(state), 10 * 60 * 1000); // expire en 10 min

  return `${EPIC_AUTH_URL}?` + new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  REDIRECT_URI,
    response_type: 'code',
    scope:         'basic_profile openid',
    state,
  });
}

// ─── Récupérer le token (avec refresh auto) ───────────────────────────────────
export async function getAccount(discordUserId) {
  const acc = linkedAccounts.get(discordUserId);
  if (!acc) return null;

  // Refresh si expire dans < 5 min
  if (Date.now() > acc.expiresAt - 5 * 60 * 1000) {
    try {
      const { data } = await axios.post(
        EPIC_TOKEN_URL,
        new URLSearchParams({ grant_type: 'refresh_token', refresh_token: acc.refreshToken }),
        { headers: { Authorization: basicAuth(), 'Content-Type': 'application/x-www-form-urlencoded' } }
      );
      acc.accessToken  = data.access_token;
      acc.refreshToken = data.refresh_token;
      acc.expiresAt    = Date.now() + data.expires_in * 1000;
      linkedAccounts.set(discordUserId, acc);
    } catch {
      linkedAccounts.delete(discordUserId);
      return null;
    }
  }
  return acc;
}

export function isLinked(id) { return linkedAccounts.has(id); }

export async function unlinkAccount(discordUserId) {
  const acc = linkedAccounts.get(discordUserId);
  if (!acc) return false;
  try {
    await axios.delete(
      `https://account-public-service-prod.ol.epicgames.com/account/api/oauth/sessions/kill/${acc.accessToken}`,
      { headers: { Authorization: `bearer ${acc.accessToken}` } }
    );
  } catch {}
  linkedAccounts.delete(discordUserId);
  return true;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function basicAuth() {
  return `Basic ${Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')}`;
}

function html(title, message, success = null) {
  const color = success === true ? '#2ecc71' : success === false ? '#e74c3c' : '#00bfff';
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8">
  <title>${title} — Fortnite Bot</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',sans-serif;background:#0d0d1a;color:white;
         display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#16213e;border:2px solid ${color};border-radius:20px;
          padding:50px 40px;text-align:center;max-width:450px;
          box-shadow:0 20px 60px rgba(0,0,0,0.5)}
    h1{color:${color};font-size:26px;margin-bottom:16px}
    p{color:#bbb;line-height:1.7;font-size:15px}
    code{background:#0d0d1a;padding:2px 8px;border-radius:6px;color:#00bfff}
    strong{color:white}
  </style></head><body>
  <div class="card"><h1>${title}</h1><p>${message}</p></div>
  </body></html>`;
}
