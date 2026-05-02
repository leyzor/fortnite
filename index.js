import { Client, GatewayIntentBits, Collection } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { startOAuthServer } from './utils/oauth.js';

config();
const __dirname = dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.DirectMessages],
});
client.commands = new Collection();

// Charger les commandes
const commandFiles = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'));
for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (command.default?.data && command.default?.execute) {
    client.commands.set(command.default.data.name, command.default);
    console.log(`✅ /${command.default.data.name}`);
  }
}

client.once('ready', () => {
  console.log(`\n🎮 Connecté : ${client.user.tag}`);
  console.log(`📡 ${client.guilds.cache.size} serveur(s)\n`);
  client.user.setActivity('Fortnite | /stats /locker /link', { type: 0 });
  startOAuthServer(client);
});

client.on('interactionCreate', async (interaction) => {
  // Boutons locker (changement de catégorie)
  if (interaction.isButton() && interaction.customId.startsWith('locker_')) {
    const parts = interaction.customId.replace('locker_', '').split('_');
    const category = parts[0];
    const pseudo = parts.slice(1).join('_') || null;
    await interaction.deferUpdate();
    const lockerCmd = client.commands.get('locker');
    if (lockerCmd) {
      interaction.options = {
        getString: (key) => key === 'categorie' ? category : key === 'pseudo' ? pseudo : null
      };
      try { await lockerCmd.execute(interaction); } catch (e) { console.error(e); }
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(`Erreur /${interaction.commandName}:`, error);
    const msg = { content: '❌ Une erreur est survenue.', ephemeral: true };
    if (interaction.replied || interaction.deferred) await interaction.followUp(msg);
    else await interaction.reply(msg);
  }
});

client.login(process.env.DISCORD_TOKEN);
