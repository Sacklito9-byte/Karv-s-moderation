const { EmbedBuilder, ChannelType } = require('discord.js');
const fs = require('fs');
const databasePath = './databases/logsModeração.json';

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isButton() && interaction.customId === 'config_logs') {
      await interaction.reply({
        content: 'Mencione o canal onde os logs serão configurados.',
        ephemeral: true,
      });

      const filter = (msg) => 
        msg.author.id === interaction.user.id &&
        msg.mentions.channels.size > 0 &&
        msg.mentions.channels.first().type === ChannelType.GuildText;

      const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });

      collector.on('collect', (msg) => {
        const mentionedChannel = msg.mentions.channels.first();
        const data = fs.existsSync(databasePath) ? JSON.parse(fs.readFileSync(databasePath)) : {};

        if (data[interaction.guild.id] === mentionedChannel.id) {
          msg.reply({
            content: `Os logs já estão configurados para o canal <#${mentionedChannel.id}>.`,
            ephemeral: true,
          });
          collector.stop();
          return;
        }

        data[interaction.guild.id] = mentionedChannel.id;
        fs.writeFileSync(databasePath, JSON.stringify(data, null, 2));

        msg.reply({
          content: `Os logs foram configurados para o canal <#${mentionedChannel.id}>.`,
          ephemeral: true,
        });
        collector.stop();
      });

      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          interaction.followUp({
            content: 'Você não mencionou um canal a tempo. Por favor, tente novamente.',
            ephemeral: true,
          });
        }
      });
    }
  },
};