const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('botconfig')
    .setDescription('[⚙️] Configure o bot através de um painel interativo.'),

  async execute(interaction) {
const ownerID = config.ownerID;

if (interaction.user.id !== ownerID) {
  return interaction.reply({
    content: "🚫 Você não tem permissão para usar este comando.",
    ephemeral: true,
  });
}


    const embed = new EmbedBuilder()
      .setTitle('Painel de Configuração do Bot')
      .setDescription('Selecione uma das opções abaixo para configurar o bot:')
      .setColor('#5865F2')
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) });

    const buttons = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('change_name')
        .setLabel('📝 Alterar Nome')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('change_avatar')
        .setLabel('🖼️ Alterar Foto')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('change_owner')
        .setLabel('👑 Alterar Dono')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
  },
};