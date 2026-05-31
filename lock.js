const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, ComponentType } = require('discord.js');
const config = require('../config.json');



module.exports = {
    data: new SlashCommandBuilder()
        .setName('lock')
        .setDescription('[🔒/🔓] Bloqueia e desbloqueia o canal com interações.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    async execute(interaction) {
        const channel = interaction.channel;

        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });
        }

        const criarPainel = (bloqueado) => {
            const embedPainel = new EmbedBuilder()
                .setTitle('Painel de Controle')
                .setDescription(`Canal controlado por: ${interaction.user.username}`)
                .setThumbnail(interaction.user.displayAvatarURL())
                .setColor(bloqueado ? 'Red' : 'Blue');

            const botao = new ButtonBuilder()
                .setCustomId(bloqueado ? 'botao_desbloquear' : 'botao_bloquear')
                .setLabel(bloqueado ? 'Desbloquear Canal' : 'Bloquear Canal')
                .setStyle(bloqueado ? ButtonStyle.Success : ButtonStyle.Danger);

            const row = new ActionRowBuilder().addComponents(botao);

            return { embedPainel, row };
        };

        const atualizarPainel = async (mensagem, bloqueado) => {
            const { embedPainel, row } = criarPainel(bloqueado);
            await mensagem.edit({ embeds: [embedPainel], components: [row] });
        };

        await interaction.reply({ embeds: [new EmbedBuilder().setDescription("Bloqueando Canal...").setColor('Red')] });

        try {
            await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: false });
            await interaction.followUp({ embeds: [new EmbedBuilder().setDescription("Canal Bloqueado com Sucesso!").setColor('Red')] });

            const { embedPainel, row } = criarPainel(true);
            const mensagem = await interaction.followUp({ embeds: [embedPainel], components: [row] });

            const collector = mensagem.createMessageComponentCollector({ componentType: ComponentType.Button });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return buttonInteraction.reply({ content: 'Você não tem permissão para interagir com este botão.', ephemeral: true });
                }

                if (buttonInteraction.customId === 'botao_desbloquear') {
                    await buttonInteraction.reply({ embeds: [new EmbedBuilder().setDescription("Desbloqueando Canal...").setColor('Yellow')], ephemeral: true });
                    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: true });
                    await buttonInteraction.followUp({ embeds: [new EmbedBuilder().setDescription("Canal Desbloqueado com Sucesso!").setColor('Green')] });
                    await atualizarPainel(mensagem, false);
                } else if (buttonInteraction.customId === 'botao_bloquear') {
                    await buttonInteraction.reply({ embeds: [new EmbedBuilder().setDescription("Bloqueando Canal...").setColor('Red')], ephemeral: true });
                    await channel.permissionOverwrites.edit(channel.guild.roles.everyone, { SendMessages: false });
                    await buttonInteraction.followUp({ embeds: [new EmbedBuilder().setDescription("Canal Bloqueado com Sucesso!").setColor('Red')] });
                    await atualizarPainel(mensagem, true);
                }
            });

            collector.on('end', async (collected, reason) => {
                if (reason === 'time') {
                    await mensagem.edit({ content: 'O painel expirou.', components: [] });
                }
            });

        } catch (error) {
            console.error("Erro ao bloquear o canal:", error);
            await interaction.followUp({ content: 'Ocorreu um erro ao tentar bloquear o canal. Verifique se o bot tem permissões adequadas.', ephemeral: true });
        }
    }
};