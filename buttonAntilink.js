const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');


const antilinkPath = path.resolve('./databases/antilink.json');


function readAntiLink(filePath) {
  if (!fs.existsSync(filePath)) {
    return {};

  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};

  }
}


function writeAntiLink(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

module.exports = {
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isButton()) return;

    if (interaction.customId === 'toggleAntilink') {

      const antilinkData = readAntiLink(antilinkPath);
      const guildId = interaction.guild.id;
      const isEnabled = antilinkData[guildId] || false;
      const newState = !isEnabled;


      antilinkData[guildId] = newState;
      writeAntiLink(antilinkPath, antilinkData);


      const embed = new EmbedBuilder()
        .setColor(newState ? '#00ff00' : '#ff0000')
        .setTitle(newState ? '🔒 AntiLink Ativado' : '🔓 AntiLink Desativado')
        .setDescription(
          newState
            ? 'O sistema de bloqueio de links foi **ativado** no servidor. Todas as mensagens contendo links serão excluídas.'
            : 'O sistema de bloqueio de links foi **desativado** no servidor. Mensagens com links agora são permitidas.'
        )
        .setFooter({ text: 'Gerencie as configurações de AntiLink conforme necessário.' });


      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};