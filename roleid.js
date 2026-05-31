const { SlashCommandBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleid')
        .setDescription('Obtém o ID de um cargo.')
        .addRoleOption(option => 
            option.setName('cargo')
                .setDescription('Selecione o cargo.')
                .setRequired(true)
        ),
    async execute(interaction) {
      const channel = interaction.channel;

        if (interaction.user.id !== config.ownerID) {

            return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });

        }
        const role = interaction.options.getRole('cargo');
        await interaction.reply({ content: `O ID do cargo **${role.name}** é: \`${role.id}\``, ephemeral: true });
    },
};