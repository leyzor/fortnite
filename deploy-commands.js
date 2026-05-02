import { REST, Routes } from 'discord.js';
import { config } from 'dotenv';
import { readdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

config();
const __dirname = dirname(fileURLToPath(import.meta.url));

const commands = [];
const commandFiles = readdirSync(join(__dirname, 'commands')).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
  const command = await import(`./commands/${file}`);
  if (command.default?.data) {
    commands.push(command.default.data.toJSON());
    console.log(`✅ /${command.default.data.name}`);
  }
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('\n📡 Déploiement des slash commands...');
  const route = process.env.GUILD_ID
    ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
    : Routes.applicationCommands(process.env.CLIENT_ID);

  await rest.put(route, { body: commands });
  console.log(`✅ ${commands.length} commande(s) déployée(s) !\n`);
} catch (err) {
  console.error('❌ Erreur deploy:', err);
}
