const { SlashCommandBuilder, PermissionFlagsBits, EmbedBuilder } = require("discord.js");
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("dm")
    .setDescription("Envie uma mensagem no privado de um usuário.")
    .addUserOption(option =>
      option
        .setName("usuário")
        .setDescription("Selecione o usuário para enviar a mensagem.")
        .setRequired(true)
    ) // criador: @nerydev
    .addStringOption(option =>
      option
        .setName("mensagem")
        .setDescription("Escreva a mensagem a ser enviada.")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

  async execute(interaction) {
    const channel = interaction.channel;

        if (interaction.user.id !== config.ownerID) {

            return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });

        }

    const user = interaction.options.getUser("usuário");
    const msg = interaction.options.getString("mensagem");
    const serverName = interaction.guild.name;
    const serverIcon = interaction.guild.iconURL();
// criador: @nerydev
    const dmEmbed = new EmbedBuilder()
      .setColor("Random")
      .setAuthor({ name: serverName, iconURL: serverIcon })
      .setDescription(`${msg}`);

    try {
      await user.send({ embeds: [dmEmbed] });

      const successEmbed = new EmbedBuilder()
        .setColor("Green")
        .setDescription(`✅ Mensagem enviada com sucesso para ${user} a partir do servidor **${serverName}**!`);
// criador: @nerydev
      await interaction.reply({ embeds: [successEmbed], ephemeral: true });
    } catch (error) {
      const errorEmbed = new EmbedBuilder()
        .setColor("Red")
        .setDescription(`❌ Não foi possível enviar a mensagem para ${user}. O usuário pode estar com as DMs desativadas.`);

      await interaction.reply({ embeds: [errorEmbed], ephemeral: true });
    }
  },
};