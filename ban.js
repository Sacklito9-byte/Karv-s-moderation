const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require('discord.js');
const { JsonDatabase } = require('wio.db');
const banDb = new JsonDatabase({ databasePath: './databases/banIds.json' });
const fs = require('fs');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('[🚫] Bane um usuário do servidor.')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addUserOption(option =>
            option.setName('user')
                .setDescription('Usuário a ser banido.')
                .setRequired(true)
        )
        .addStringOption(option =>
            option.setName('motivo')
                .setDescription('Motivo do banimento.')
        ),
    async execute(interaction) {
        if (interaction.user.id !== config.ownerID) {
            return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });
        }

        const user = interaction.options.getUser('user');
        const reason = interaction.options.getString('motivo') || 'Não especificado';
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return interaction.reply({ content: 'Usuário não encontrado no servidor.', ephemeral: true });
        }

        if (!member.bannable) {
            return interaction.reply({ content: 'Não posso banir este usuário.', ephemeral: true });
        }

        await member.ban({ reason });

        const bans = banDb.get('bans') || [];
        banDb.set('bans', [...bans, { id: user.id, tag: user.tag }]);

        const now = new Date();
        const formattedDate = `${now.toLocaleDateString()} às ${now.toLocaleTimeString()}`;

        const ephemeralEmbed = new EmbedBuilder()
            .setTitle('🚫 Usuário Banido')
            .setColor('Red')
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Usuário', value: `<@${user.id}>`, inline: true },
                { name: 'Motivo', value: reason, inline: true },
                { name: 'Banido por', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setFooter({ text: 'Dev: 💜|Nery #Programador', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        const logEmbed = new EmbedBuilder()
            .setTitle('🚫 Usuário Banido')
            .setColor('Red')
            .setThumbnail(user.displayAvatarURL({ dynamic: true }))
            .addFields(
                { name: 'Usuário', value: `<@${user.id}>`, inline: true },
                { name: 'Motivo', value: reason, inline: true },
                { name: 'Banido por', value: `<@${interaction.user.id}>`, inline: true },
                { name: 'Data e Hora', value: formattedDate, inline: false }
            )
            .setFooter({ text: 'Dev: 💜|Nery #Programador', iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
            .setTimestamp();

        await interaction.reply({ embeds: [ephemeralEmbed], ephemeral: true });

        const logsPath = './databases/logsModeração.json';
        if (!fs.existsSync(logsPath)) {
            return;
        }

        const logsData = JSON.parse(fs.readFileSync(logsPath, 'utf-8'));
        const logChannelId = logsData[interaction.guild.id];

        if (!logChannelId) {
            return;
        }

        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
            await logChannel.send({ embeds: [logEmbed] });
        }
    },
};