const { EmbedBuilder } = require('discord.js');
const { JsonDatabase } = require('wio.db');
const banDb = new JsonDatabase({ databasePath: './databases/banIds.json' });

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isStringSelectMenu()) return;
        if (interaction.customId !== 'unban-menu') return;

        const userId = interaction.values[0];
        const bans = banDb.get('bans') || [];

        try {

            await interaction.guild.members.unban(userId);


            const updatedBans = bans.filter((ban) => ban.id !== userId);
            banDb.set('bans', updatedBans);


            const embed = new EmbedBuilder()
                .setTitle('✅ Usuário Desbanido')
                .setColor('Green')
                .addFields(
                    { name: 'Usuário', value: `<@${userId}>`, inline: true },
                    { name: 'Motivo', value: 'Desbanido por seleção.', inline: true }
                )
                .setFooter({
                    text: `Desbanido por ${interaction.user.tag}`,
                    iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
                })
                .setTimestamp();

            await interaction.update({ embeds: [embed], components: [] });
        } catch (error) {
            console.error(error);
            await interaction.update({
                content: '❌ Não foi possível desbanir o usuário. Verifique se o ID está correto.',
                components: [],
            });
        }
    },
};