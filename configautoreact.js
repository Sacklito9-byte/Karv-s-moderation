const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { JsonDatabase } = require('wio.db');
const db = new JsonDatabase({ databasePath: './databases/autoreactConfig.json' });
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('autoreact')
    .setDescription('Gerencia o sistema de AutoReact com painel integrado'),
  async execute(interaction) {
    const channel = interaction.channel;

        if (interaction.user.id !== config.ownerID) {

            return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });

        }
    const autoReactStatus = db.get('autoReactStatus') || false;
    const targetChannel = db.get('targetChannel') || null;
    const emojis = db.get('emojis') || [];

    const embed = new EmbedBuilder()
      .setTitle('🎛️ Painel de Controle do AutoReact')
      .setDescription(`- 🟢 **Status:** ${autoReactStatus ? '**Ligado**' : '**Desligado**'}\n- 📝 **Canal Alvo:** ${targetChannel ? `<#${targetChannel}>` : '*Nenhum configurado*'}\n- 😃 **Emojis Configurados:** ${emojis.length > 0 ? emojis.join(' ') : '*Nenhum configurado*'}`)
      .setColor(autoReactStatus ? 0x00FF00 : 0xFF0000);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('toggle_status')
        .setLabel(autoReactStatus ? 'Desligar' : 'Ligar')
        .setEmoji(autoReactStatus ? '🔴' : '🟢')
        .setStyle(ButtonStyle.Success),
      new ButtonBuilder()
        .setCustomId('configure_emojis')
        .setLabel('Configurar Emojis')
        .setEmoji('😃')
        .setStyle(ButtonStyle.Primary),
      new ButtonBuilder()
        .setCustomId('configure_channel')
        .setLabel('Configurar Canal')
        .setEmoji('📢')
        .setStyle(ButtonStyle.Secondary)
    );

    await interaction.reply({ embeds: [embed], components: [row], ephemeral: true });
  },
};