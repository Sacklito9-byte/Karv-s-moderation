const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('[🗑️] Exclui o canal atual e recria um novo com as mesmas configurações.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({
                content: '🚫 Você não tem permissão para usar este comando.',
                ephemeral: true,
            });
        }

        const embed = new EmbedBuilder()
            .setTitle('Confirmação de Nuke')
            .setDescription('Você tem certeza que deseja **excluir e recriar** este canal? Essa ação não pode ser desfeita.')
            .setColor('Red')
            .setFooter({ text: 'Essa ação excluirá todo o histórico de mensagens.' });

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId('confirm_nuke')
                .setLabel('Confirmar')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setCustomId('cancel_nuke')
                .setLabel('Cancelar')
                .setStyle(ButtonStyle.Secondary)
        );

        await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });

        const filter = (i) => i.user.id === interaction.user.id;
        const collector = interaction.channel.createMessageComponentCollector({
            filter,
            time: 15000,
        });

        collector.on('collect', async (buttonInteraction) => {
            if (buttonInteraction.customId === 'confirm_nuke') {
                const channel = interaction.channel;
                const position = channel.position;
                const user = buttonInteraction.user.username;

                await interaction.editReply({
                    content: '💥 O canal está sendo resetado!',
                    embeds: [],
                    components: [],
                });

                collector.stop();

                const newChannel = await channel.guild.channels.create({
                    name: channel.name,
                    type: channel.type,
                    topic: channel.topic,
                    parent: channel.parent,
                    nsfw: channel.nsfw,
                    position: position,
                    permissionOverwrites: channel.permissionOverwrites.cache.map((overwrite) => overwrite),
                });

                const now = new Date();
                const formattedDate = `${now.toLocaleDateString()} às ${now.toLocaleTimeString()}`;

                const logEmbed = new EmbedBuilder()
                    .setTitle('💥 Canal Resetado (Nuke)')
                    .setColor('Red')
                    .addFields(
                        { name: 'Canal', value: `#${newChannel.name}`, inline: true },
                        { name: 'Resetado por', value: `<@${interaction.user.id}>`, inline: true },
                        { name: 'Data e Hora', value: formattedDate, inline: false }
                    )
                    .setFooter({ text: 'Dev: 💜|Nery #Programador', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
                    .setTimestamp();

                const logsPath = './databases/logsModeração.json';
                if (fs.existsSync(logsPath)) {
                    const logsData = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
                    const logChannelId = logsData[interaction.guild.id];

                    if (logChannelId) {
                        const logChannel = interaction.guild.channels.cache.get(logChannelId);
                        if (logChannel) {
                            await logChannel.send({ embeds: [logEmbed] });
                        }
                    }
                }

                await channel.delete();

                newChannel.send(`✅ **Canal resetado com sucesso!**\n\nNuked by \`${user}\``);
            } else if (buttonInteraction.customId === 'cancel_nuke') {
                await buttonInteraction.reply({
                    content: '❌ Ação de Nuke cancelada.',
                    ephemeral: true,
                });
                collector.stop();
            }
        });

        collector.on('end', async (_, reason) => {
            if (reason !== 'messageDelete') {
                try {
                    await interaction.editReply({
                        components: [],
                    });
                } catch (err) {
                    console.error('Erro ao editar a resposta final:', err.message);
                }
            }
        });
    },
};