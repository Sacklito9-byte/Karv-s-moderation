const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('painel')
    .setDescription('Gera um painel para configurar logs'),

  async execute(interaction) {
    const ownerID = config.ownerID;

    if (interaction.user.id !== ownerID) {
  return interaction.reply({
    content: "🚫 Você não tem permissão para usar este comando.",
    ephemeral: true,
  });
    }


    const embed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('Configuração de Logs')
      .setDescription('Clique no botão abaixo para configurar os logs.')
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL() })
      .setTimestamp();

    const button = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('config_logs')
        .setLabel('Configurar Logs')
        .setEmoji('⚙️')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [button] });
  },
};