const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('configverificação')
        .setDescription('Inicia o painel de configuração de verificação'),
    async execute(interaction) {
      const channel = interaction.channel;

        if (interaction.user.id !== config.ownerID) {

            return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });

        }
        const embed = new EmbedBuilder()
            .setTitle('Painel de Configuração')
            .setDescription('Escolha uma das opções abaixo para configurar o sistema de verificação:')
            .setColor('Purple');

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('configurar_embed')
                    .setLabel('Configurar Embed')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('enviar_embed')
                    .setLabel('Enviar Embed')
                    .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                    .setCustomId('configurar_cargo')
                    .setLabel('Configurar Cargo')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
    },
};