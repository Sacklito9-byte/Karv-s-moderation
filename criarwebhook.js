const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { ownerID } = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('criarwebhook')
    .setDescription('🛠️ Exibe o painel de gerenciamento de webhooks.'),

  async execute(interaction) {
if (interaction.user.id !== ownerID) {
            return interaction.reply({ 
                content: '🚫 Você não tem permissão para usar este comando.', 
                ephemeral: true 
            });
        }


    const painelEmbed = new EmbedBuilder()
      .setColor('Blue')
      .setTitle('🛠️ Painel de Gerenciamento de Webhooks')
      .setDescription('Escolha uma das opções abaixo para gerenciar seus webhooks:')
      .addFields(
        { name: '📌 Criar Novo Webhook', value: 'Crie uma nova webhook em um canal específico.' },
        { name: '🗑️ Apagar Webhook', value: 'Apague uma ou mais webhooks em um canal.' }
      )
      .setFooter({ text: 'Gerenciamento de Webhooks', iconURL: interaction.user.displayAvatarURL() });

    const painel = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('criar_webhook')
        .setLabel('Criar Novo Webhook')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('apagar_webhook')
        .setLabel('Apagar Webhook')
        .setStyle(ButtonStyle.Danger)
    );

    await interaction.reply({
      embeds: [painelEmbed],
      components: [painel],
      ephemeral: true,
    });
  },
};