const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = { // @nerydev
  data: new SlashCommandBuilder()
    .setName('usericon')
    .setDescription('[🖼️] Visualiza a foto de perfil de um usuário ou de si mesmo.')
    .addUserOption(option =>
      option.setName('usuário')
        .setDescription('O usuário para visualizar o ícone.')
        .setRequired(false),
    ),
  async execute(interaction) {
    const user = interaction.options.getUser('usuário') || interaction.user;
    const avatarURL = user.displayAvatarURL({ dynamic: true, size: 1024 }); // @nerydev
// @nerydev
    const embed = new EmbedBuilder()
      .setTitle(`Ícone de ${user.tag}`)
      .setImage(avatarURL)
      .setColor(0x00AE86)
      .setFooter({ text: `Solicitado por ${interaction.user.tag}`, iconURL: interaction.user.displayAvatarURL({ dynamic: true }) })
      .setTimestamp(); // @nerydev

    await interaction.reply({ embeds: [embed] });
  },
};