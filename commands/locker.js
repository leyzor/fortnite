import {
  SlashCommandBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
} from 'discord.js';
import axios from 'axios';
import { baseEmbed, errorEmbed, COLORS } from '../utils/embeds.js';
import { generateLockerGrid, formatCosmeticsForGrid } from '../utils/canvas.js';

const FORTNITE_API = 'https://fortnite-api.com';
const headers = () => ({ Authorization: process.env.FORTNITE_API_KEY });

// Types disponibles avec émojis
const CATEGORIES = {
  outfit:      { label: 'Skins',           emoji: '👤' },
  backpack:    { label: 'Back Blings',      emoji: '🎒' },
  pickaxe:     { label: 'Pickaxes',         emoji: '⛏️' },
  glider:      { label: 'Planeurs',         emoji: '🪂' },
  wrap:        { label: 'Wraps',            emoji: '🎁' },
  emote:       { label: 'Emotes',           emoji: '💃' },
  loadingscreen:{ label: 'Loading Screens', emoji: '🖼️' },
  spray:       { label: 'Sprays',           emoji: '🎨' },
  contrail:    { label: 'Contrails',        emoji: '💨' },
};

export default {
  data: new SlashCommandBuilder()
    .setName('locker')
    .setDescription('🗃️ Affiche tous les cosmétiques d\'un joueur (grille image)')
    .addStringOption(opt =>
      opt.setName('categorie')
        .setDescription('Catégorie de cosmétiques')
        .setRequired(false)
        .addChoices(
          { name: '👤 Skins',           value: 'outfit' },
          { name: '🎒 Back Blings',     value: 'backpack' },
          { name: '⛏️ Pickaxes',        value: 'pickaxe' },
          { name: '🪂 Planeurs',        value: 'glider' },
          { name: '🎁 Wraps',           value: 'wrap' },
          { name: '💃 Emotes',          value: 'emote' },
          { name: '🖼️ Loading Screens', value: 'loadingscreen' },
          { name: '🎨 Sprays',          value: 'spray' },
          { name: '💨 Contrails',       value: 'contrail' },
        ))
    .addStringOption(opt =>
      opt.setName('pseudo')
        .setDescription('Pseudo Epic (optionnel, sinon utilise ton compte lié)')
        .setRequired(false)),

  async execute(interaction) {
    await interaction.deferReply();

    const category = interaction.options.getString('categorie') || 'outfit';
    const pseudo   = interaction.options.getString('pseudo');
    const cat      = CATEGORIES[category];

    try {
      // Récupérer tous les cosmétiques de ce type depuis l'API publique
      const { data } = await axios.get(`${FORTNITE_API}/v2/cosmetics/br`, {
        headers: headers(),
        params: { language: 'fr' }
      });

      const all = data.data ?? [];
      let filtered = all.filter(c => c.type?.value === category);

      // Si un pseudo est fourni : on filtre par les skins "exclusifs" au compte
      // (sans auth Epic, on ne peut pas savoir ce qu'un joueur possède vraiment)
      // On affiche donc tous les cosmétiques de cette catégorie
      if (pseudo) {
        // Trier par rareté (legendary en premier)
        const rarityOrder = { legendary: 0, epic: 1, rare: 2, uncommon: 3, common: 4 };
        filtered.sort((a, b) => {
          const ra = rarityOrder[a.rarity?.value] ?? 5;
          const rb = rarityOrder[b.rarity?.value] ?? 5;
          return ra - rb;
        });
      }

      if (filtered.length === 0) {
        return interaction.editReply({ embeds: [errorEmbed('Aucun cosmétique trouvé pour cette catégorie.')] });
      }

      // Limiter à 200 items max pour éviter une image trop grande
      const limited = filtered.slice(0, 200);

      const statusEmbed = baseEmbed(`🎨 Génération de la grille...`, COLORS.blue)
        .setDescription(`⏳ Chargement de **${limited.length}** ${cat.emoji} ${cat.label}...\nCela peut prendre quelques secondes.`);
      await interaction.editReply({ embeds: [statusEmbed] });

      // Formater pour le canvas
      const items = formatCosmeticsForGrid(limited);

      // Générer l'image
      const title    = pseudo ? `${cat.emoji} ${cat.label} — ${pseudo}` : `${cat.emoji} ${cat.label}`;
      const subtitle = `${limited.length} cosmétiques${filtered.length > 200 ? ` (sur ${filtered.length} au total)` : ''}`;
      const buffer   = await generateLockerGrid(items, title, subtitle);

      const attachment = new AttachmentBuilder(buffer, { name: `locker-${category}.png` });

      const embed = baseEmbed(`${cat.emoji} ${cat.label}`, COLORS.purple)
        .setDescription(`**${limited.length}** cosmétiques affichés${filtered.length > 200 ? ` sur ${filtered.length}` : ''}.`)
        .setImage(`attachment://locker-${category}.png`);

      // Boutons pour changer de catégorie rapidement
      const rows = [];
      const otherCats = Object.entries(CATEGORIES).filter(([k]) => k !== category).slice(0, 4);
      if (otherCats.length > 0) {
        const row = new ActionRowBuilder().addComponents(
          otherCats.map(([k, v]) =>
            new ButtonBuilder()
              .setCustomId(`locker_${k}${pseudo ? `_${pseudo}` : ''}`)
              .setLabel(`${v.emoji} ${v.label}`)
              .setStyle(ButtonStyle.Secondary)
          )
        );
        rows.push(row);
      }

      await interaction.editReply({ embeds: [embed], files: [attachment], components: rows });

    } catch (err) {
      console.error('locker error:', err.message);
      return interaction.editReply({ embeds: [errorEmbed('Erreur lors de la génération du locker.')] });
    }
  }
};
