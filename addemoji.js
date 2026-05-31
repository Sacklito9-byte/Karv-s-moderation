const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addemoji')
        .setDescription('Adiciona um emoji ao servidor.')
        .addStringOption(option =>
            option
                .setName('emoji')
                .setDescription('Insira o emoji que deseja adicionar.')
                .setRequired(true)
        ),
    async execute(interaction) {
      const channel = interaction.channel;

        if (interaction.user.id !== config.ownerID) {

            return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });

        }
        const emojiInput = interaction.options.getString('emoji');
        const guild = interaction.guild;

        if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageEmojisAndStickers)) {
            return interaction.reply({ content: 'Você não tem permissão para adicionar emojis.', ephemeral: true });
        }

        const regex = /<a?:\w+:(\d+)>|https?:\/\/\S+\.(?:jpg|jpeg|png|gif)/;
        const match = emojiInput.match(regex);

        if (!match) {
            return interaction.reply({ content: 'Formato inválido! Insira um emoji customizado ou link direto de imagem.', ephemeral: true });
        }

        const emojiUrl = match[1]
            ? `https://cdn.discordapp.com/emojis/${match[1]}.${emojiInput.startsWith('<a:') ? 'gif' : 'png'}`
            : emojiInput;

        const emojiName = emojiInput.startsWith('<') ? emojiInput.split(':')[1] : `emoji_${Date.now()}`;

        try {
            const emoji = await guild.emojis.create({ attachment: emojiUrl, name: emojiName });
            interaction.reply(`${emoji} ~ Adicionado com sucesso ao servidor!`);
        } catch (error) {
            interaction.reply({ content: 'Não foi possível adicionar o emoji. Verifique se tenho permissões adequadas.', ephemeral: true });
        }
    },
};