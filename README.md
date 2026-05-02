# 🎮 Fortnite Discord Bot

Bot Discord pour afficher des stats et infos Fortnite, utilisant l'API publique **fortnite-api.com**.

## ✅ Commandes disponibles

| Commande | Description |
|---|---|
| `/stats <pseudo> [plateforme]` | Stats complètes d'un joueur |
| `/shop` | Shop du jour avec prix |
| `/cosmetic <nom>` | Recherche un cosmétique |
| `/news` | Actualités Fortnite |
| `/map` | Carte actuelle + POIs |
| `/code <code>` | Vérifie un code créateur |
| `/help` | Liste des commandes |

---

## 🚀 Installation

### 1. Prérequis
- **Node.js v18+** : https://nodejs.org
- Un compte **Discord Developer** : https://discord.com/developers
- Une clé API **fortnite-api.com** (gratuite) : https://fortnite-api.com

---

### 2. Créer le bot Discord

1. Va sur https://discord.com/developers/applications
2. Clique **New Application** → donne un nom
3. Va dans **Bot** → clique **Reset Token** → copie le token
4. Active **"Server Members Intent"** et **"Message Content Intent"**
5. Va dans **OAuth2 > URL Generator** :
   - Coche `bot` + `applications.commands`
   - Permissions : `Send Messages`, `Embed Links`, `Use Slash Commands`
   - Copie l'URL générée et ouvre-la pour inviter le bot sur ton serveur

---

### 3. Obtenir la clé fortnite-api.com

1. Va sur https://fortnite-api.com
2. Crée un compte → Dashboard → **Generate API Key**
3. Copie la clé

---

### 4. Configurer le bot

```bash
# Clone / copie le dossier, puis :
cd fortnite-bot

# Installe les dépendances
npm install

# Copie le fichier d'exemple
cp .env.example .env
```

Ouvre `.env` et remplis :
```env
DISCORD_TOKEN=ton_token_discord
CLIENT_ID=ton_client_id          # Visible dans "General Information" sur le portail dev
GUILD_ID=ton_serveur_id          # (optionnel) Pour des commandes instantanées sur ton serveur
FORTNITE_API_KEY=ta_clé_api
```

**Trouver CLIENT_ID et GUILD_ID :**
- `CLIENT_ID` : Discord Developer Portal > ton app > General Information > **Application ID**
- `GUILD_ID` : Discord > ton serveur > clic droit sur le nom > **Copier l'identifiant du serveur** (mode développeur requis)

---

### 5. Déployer les commandes

```bash
# Déployer les slash commands (à faire une seule fois, ou après ajout d'une commande)
npm run deploy
```

Si tu as mis un `GUILD_ID`, les commandes apparaissent **instantanément**.
Sans `GUILD_ID`, il faut attendre jusqu'à 1 heure (déploiement global).

---

### 6. Lancer le bot

```bash
npm start
```

Tu devrais voir :
```
✅ Commande chargée : /stats
✅ Commande chargée : /shop
...
🎮 Fortnite Bot connecté en tant que TonBot#1234
📡 Sur 1 serveur(s)
```

---

## 📁 Structure du projet

```
fortnite-bot/
├── index.js              # Point d'entrée
├── deploy-commands.js    # Script de déploiement des slash commands
├── .env                  # Tes clés (ne jamais partager !)
├── .env.example          # Template de config
├── package.json
├── commands/
│   ├── stats.js          # /stats
│   ├── shop.js           # /shop
│   ├── cosmetic.js       # /cosmetic
│   ├── news.js           # /news
│   ├── map.js            # /map
│   ├── code.js           # /code
│   └── help.js           # /help
└── utils/
    ├── api.js            # Appels à fortnite-api.com
    └── embeds.js         # Helpers pour les embeds Discord
```

---

## ⚠️ Notes importantes

- Les **stats sont publiques** uniquement si le joueur n'a pas désactivé son profil dans les paramètres Fortnite
- L'API **fortnite-api.com** est gratuite et officieuse mais largement utilisée par la communauté
- Ce bot **ne stocke aucune donnée** des utilisateurs
- Ce bot **n'utilise pas** de Device Auth ou de mécanismes de capture de tokens

---

## 🔧 Hébergement 24/7 (optionnel)

Pour que le bot reste en ligne en permanence :

- **Railway** : https://railway.app (gratuit, simple)
- **Render** : https://render.com
- **VPS** : utilise `pm2` pour garder le bot actif (`npm install -g pm2` → `pm2 start index.js`)
