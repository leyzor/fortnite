import { SlashCommandBuilder } from 'discord.js';
import { getAccount } from '../utils/oauth.js';
import { getAccountInfo, getMyStats, getMyVbucks } from '../utils/epicApi.js';
import { baseEmbed, errorEmbed, fmt, kd, winrate, getRankEmoji, COLORS } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('myaccount')
    .setDescription('👤 Affiche les infos de ton compte Epic Games lié'),

  async execute(interaction) {
    await interaction.deferReply({ ephemeral: false });

    const acc = await getAccount(interaction.user.id);
    if (!acc) {
      return interaction.editReply({
        embeds: [errorEmbed('Aucun compte lié. Utilise `/link connect` d\'abord.')]
      });
    }

    try {
      // Infos du compte + V-Bucks en parallèle
      const [info, vbucks] = await Promise.allSettled([
        getAccountInfo(acc.accessToken, acc.accountId),
        getMyVbucks(acc.accessToken, acc.accountId),
      ]);

      const accountData = info.status === 'fulfilled' ? info.value : null;
      const vb = vbucks.status === 'fulfilled' ? vbucks.value : 0;

      // Stats BR via fortnite-api.com (API publique, pas d'auth nécessaire)
      let statsFields = [];
      try {
        const { getPlayerStats } = await import('../utils/api.js');
        const stats = await getPlayerStats(acc.displayName, 'epic');
        const all = stats?.stats?.all?.overall;
        if (all) {
          const wins = all.wins ?? 0;
          statsFields = [
            {
              name: '📊 Stats Battle Royale',
              value: [
                `${getRankEmoji(wins)} **Victoires :** ${fmt(wins)}`,
                `🎯 **Kills :** ${fmt(all.kills)}`,
                `💀 **K/D :** ${kd(all.kills, all.deaths)}`,
                `📈 **Win Rate :** ${winrate(wins, all.matches)}`,
                `🎮 **Parties :** ${fmt(all.matches)}`,
                `⏱️ **Temps joué :** ${fmt(all.minutesPlayed)} min`,
              ].join('\n'),
              inline: false,
            }
          ];
        }
      } catch {}

      const embed = baseEmbed(`👤 ${acc.displayName}`, COLORS.gold)
        .addFields(
          {
            name: '🆔 Compte',
            value: [
              `**Display Name :** ${acc.displayName}`,
              `**Account ID :** \`${acc.accountId}\``,
              accountData?.email ? `**Email :** ||${accountData.email}||` : '',
              accountData?.tfaEnabled !== undefined
                ? `**2FA :** ${accountData.tfaEnabled ? '✅ Activé' : '❌ Désactivé'}`
                : '',
            ].filter(Boolean).join('\n'),
            inline: false,
          },
          {
            name: '💰 V-Bucks',
            value: `🔵 **${fmt(vb)} V-Bucks**`,
            inline: true,
          },
          ...statsFields
        );

      await interaction.editReply({ embeds: [embed] });

    } catch (err) {
      console.error('myaccount error:', err.response?.data || err.message);
      return interaction.editReply({
        embeds: [errorEmbed('Erreur lors de la récupération des données. Réessaie ou refais `/link connect`.')]
      });
    }
  }
};
