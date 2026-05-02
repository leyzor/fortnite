import { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { generateAuthURL, isLinked, unlinkAccount } from '../utils/oauth.js';
import { baseEmbed, COLORS } from '../utils/embeds.js';

export default {
  data: new SlashCommandBuilder()
    .setName('link')
    .setDescription('🔗 Connecte ton compte Epic Games au bot')
    .addSubcommand(sub =>
      sub.setName('connect').setDescription('Lier mon compte Epic Games'))
    .addSubcommand(sub =>
      sub.setName('disconnect').setDescription('Délier mon compte Epic Games')),

  async execute(interaction) {
    const sub = interaction.options.getSubcommand();

    // ── Déconnexion ───────────────────────────────────────────────────────────
    if (sub === 'disconnect') {
      const ok = await unlinkAccount(interaction.user.id);
      const embed = baseEmbed(ok ? '✅ Compte délié' : '❌ Aucun compte lié', ok
        ? 'Ton compte Epic Games a été déconnecté. Tes tokens ont été révoqués.'
        : 'Tu n\'as aucun compte Epic Games lié.',
        ok ? COLORS.green : COLORS.red
      );
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ── Connexion ─────────────────────────────────────────────────────────────
    if (isLinked(interaction.user.id)) {
      const embed = baseEmbed('✅ Déjà connecté', 'Ton compte Epic Games est déjà lié.\nUtilise `/myaccount` pour voir tes infos, ou `/link disconnect` pour délier.', COLORS.green);
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    const url = generateAuthURL(interaction.user.id);

    const embed = baseEmbed('🔗 Connexion Epic Games', COLORS.blue)
      .setDescription([
        '**Clique le bouton ci-dessous** pour te connecter à ton compte Epic Games.',
        '',
        '🔒 **Sécurité :**',
        '• Tu te connectes directement sur le site officiel **epicgames.com**',
        '• Le bot reçoit un token temporaire (expire en ~8h)',
        '• Rien n\'est stocké sur disque',
        '• Tu peux délier à tout moment avec `/link disconnect`',
        '',
        '⏳ Ce lien expire dans **10 minutes**.',
      ].join('\n'));

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setLabel('Se connecter à Epic Games')
        .setURL(url)
        .setStyle(ButtonStyle.Link)
        .setEmoji('🎮')
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  }
};
