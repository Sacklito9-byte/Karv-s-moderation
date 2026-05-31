const { SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder, EmbedBuilder } = require('discord.js');
const { JsonDatabase } = require('wio.db');
const fs = require('fs');
const banDb = new JsonDatabase({ databasePath: './databases/banIds.json' });
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('[🔓] Remove o banimento de um usuário.'),
    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({
                content: '🚫 Você não tem permissão para usar este comando.',
                ephemeral: true,
            });
        }

        const bans = banDb.get('bans') || [];
        if (bans.length === 0) {
            return interaction.reply({
                content: '❌ Nenhum usuário banido encontrado no banco de dados.',
                ephemeral: true,
            });
        }

        const options = bans.map((ban) => ({
            label: `${ban.tag} (${ban.id})`,
            value: ban.id,
        }));

        const selectMenu = new StringSelectMenuBuilder()
            .setCustomId('unban-menu')
            .setPlaceholder('Selecione um usuário para desbanir.')
            .addOptions(options);

        const row = new ActionRowBuilder().addComponents(selectMenu);

        await interaction.reply({
            content: 'Selecione o usuário para desbanir:',
            components: [row],
            ephemeral: true,
        });

        const filter = (i) => i.customId === 'unban-menu' && i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

        collector.on('collect', async (menuInteraction) => {
            const userId = menuInteraction.values[0];
            const user = bans.find((ban) => ban.id === userId);

            if (!user) {
                return menuInteraction.reply({
                    content: '❌ O usuário selecionado não foi encontrado no banco de dados.',
                    ephemeral: true,
                });
            }

            const updatedBans = bans.filter((ban) => ban.id !== userId);
            banDb.set('bans', updatedBans);

            const embed = new EmbedBuilder()
                .setTitle('✅ Usuário Desbanido')
                .setColor('Green')
                .addFields(
                    { name: 'Usuário', value: `<@${user.id}> (${user.tag})`, inline: true },
                    { name: 'Desbanido por', value: `<@${interaction.user.id}>`, inline: true },
                    { name: 'Data e Hora', value: new Date().toLocaleString(), inline: false }
                )
                .setFooter({ text: 'Dev: 💜|Nery #Programador', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                .setTimestamp();

            await menuInteraction.reply({
                content: '✅ Usuário desbanido com sucesso.',
                ephemeral: true,
            });

            const logsPath = './databases/logsModeração.json';
            if (!fs.existsSync(logsPath)) {
                return;
            }

            const logsData = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
            const logChannelId = logsData[interaction.guild.id];

            if (logChannelId) {
                const logChannel = interaction.guild.channels.cache.get(logChannelId);
                if (logChannel) {
                    await logChannel.send({ embeds: [embed] });
                }
            }
        });

        collector.on('end', (_, reason) => {
            if (reason === 'time') {
                interaction.editReply({
                    content: '⏰ O tempo para selecionar um usuário expirou.',
                    components: [],
                });
            }
        });
    },
};