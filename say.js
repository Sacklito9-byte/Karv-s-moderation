const { SlashCommandBuilder, ChannelType } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Faz o bot repetir uma mensagem.')
    .addStringOption((option) =>
      option
        .setName('mensagem')
        .setDescription('A mensagem que o bot irá enviar (máx: 4000 caracteres).')
        .setRequired(true)
    )
    .addChannelOption((option) =>
      option
        .setName('canal')
        .setDescription('O canal onde a mensagem será enviada.')
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  async execute(interaction) {
    const channel = interaction.channel;

        if (interaction.user.id !== config.ownerID) {

            return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });

        }
    const mensagem = interaction.options.getString('mensagem');
    const canal = interaction.options.getChannel('canal') || interaction.channel;

    if (mensagem.length > 4000) {
      return interaction.reply({
        content: 'A mensagem ultrapassa o limite de 4000 caracteres.',
        ephemeral: true,
      });
    }

    await canal.send(mensagem);
    await interaction.reply({
      content: `Mensagem enviada no canal ${canal}`,
      ephemeral: true,
    });
  },
};