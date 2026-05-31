const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resposta')
        .setDescription('[🏓] Botões para verificar o ping e latência do bot.'),

    async execute(interaction) {

        const pingEmbed = new EmbedBuilder()
            .setTitle('😮 Verifique a resposta do Bot')
            .setDescription(`Latência atual: ${Math.round(interaction.client.ws.ping)}ms`)
            .setColor('Blue')
            .setTimestamp();

        const buttons = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('ping')
                    .setLabel('Ping')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('update_ping')
                    .setLabel('Atualizar Ping')
                    .setStyle(ButtonStyle.Secondary)
            );

        await interaction.reply({ embeds: [pingEmbed], components: [buttons], ephemeral: true }); 

        const collector = interaction.channel.createMessageComponentCollector({ time: 60000 });

        collector.on('collect', async i => {
            if (i.customId === 'ping') {
                await i.reply({ content: '😮 Verifique a resposta do Bot', ephemeral: true });
            }

            if (i.customId === 'update_ping') {
                const updatedPingEmbed = new EmbedBuilder()
                    .setTitle('🏓 Pong!')
                    .setDescription(`Latência atual: ${Math.round(interaction.client.ws.ping)}ms`)
                    .setColor('Blue')
                    .setTimestamp();

                await i.update({ embeds: [updatedPingEmbed], components: [buttons] });
            }
        });
    },
};