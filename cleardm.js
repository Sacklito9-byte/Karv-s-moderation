const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cleardm')
        .setDescription('[👾] Limpa as mensagens enviadas pelo bot na sua DM.'),
    async execute(interaction) {
        const user = interaction.user;

        try {
            const dmChannel = await user.createDM();
            const messages = await dmChannel.messages.fetch();
            const botMessages = messages.filter(msg => msg.author.id === interaction.client.user.id);

            if (botMessages.size === 0) {
                return interaction.reply({
                    content: 'Não encontrei mensagens minhas na sua DM para limpar.',
                    ephemeral: true,
                });
            }

            await Promise.all(botMessages.map(msg => msg.delete()));

            return interaction.reply({
                content: 'Limpei todas as minhas mensagens da sua DM!',
                ephemeral: true,
            });
        } catch (error) {
            console.error(error);
            return interaction.reply({
                content: 'Ocorreu um erro ao tentar limpar suas mensagens da DM.',
                ephemeral: true,
            });
        }
    },
};