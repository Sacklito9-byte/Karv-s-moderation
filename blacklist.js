const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');


const palavrasProibidasPath = path.resolve('./databases/palavrasProibidas.json');
const mencoesProibidasPath = path.resolve('./databases/mencaoProibida.json');
const antilinkPath = path.resolve('./databases/antilink.json');


function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data).palavras || [];
  } catch {
    return [];
  }
}


function readMentionsJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data) || [];
  } catch {
    return [];
  }
}



function readAntiLink(filePath) {
  if (!fs.existsSync(filePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return {};
  }
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('blacklist')
    .setDescription('[📖] Configura palavras proibidas, menções e AntiLink.'),
  async execute(interaction) {
    const ownerID = config.ownerID;
    
    if (interaction.user.id !== ownerID) {
  return interaction.reply({
    content: "🚫 Você não tem permissão para usar este comando.",
    ephemeral: true,
  });
    }
    
    
    const palavrasProibidas = readJSON(palavrasProibidasPath);
    const mencoesProibidas = readMentionsJSON(mencoesProibidasPath);


    const antilinkData = readAntiLink(antilinkPath);
    const guildId = interaction.guild.id;
    const antilinkState = antilinkData[guildId] || false;


    const embed = new EmbedBuilder()
      .setColor('#1e90ff')
      .setTitle('⚙️ Configuração de Palavras Proibidas e Menções')
      .setDescription('Abaixo estão as configurações atuais do servidor. Já que o bot está em desenvolvimento, ao configurar abaixo para atualizar sete o comando novamente.')
      .addFields(
        {
          name: '❌ Palavras Proibidas',
          value: palavrasProibidas.length > 0
            ? `• ${palavrasProibidas.join('\n• ')}`
            : 'Nenhuma palavra proibida configurada.',
          inline: false,
        },
        {
          name: '🔇 Menções Proibidas',
          value: mencoesProibidas.length > 0
            ? `• ${mencoesProibidas.map((id) => `<@${id}>`).join('\n• ')}`
            : 'Nenhuma menção proibida configurada.',
          inline: false,
        },
        {
          name: '🔗 AntiLink',
          value: antilinkState ? '✅ **Ativado**' : '❌ **Desativado**',
          inline: false,
        }
      )
      .setFooter({ text: 'Desenvolvido por Nery #Programador' });


    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('AddPalavra.js')
        .setLabel('➕ Adicionar Palavra')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('RemovePalavra.js')
        .setLabel('➖ Remover Palavra')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId('buttonMencao.js')
        .setLabel('👤 Configurar Menções')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('toggleAntilink') 

        .setLabel(antilinkState ? '🔓 Desativar AntiLink' : '🔒 Ativar AntiLink')

        .setStyle(ButtonStyle.Secondary)
    );


    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};