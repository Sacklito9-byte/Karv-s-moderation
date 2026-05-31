const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { JsonDatabase } = require('wio.db');
const db = new JsonDatabase({ databasePath: './databases/autoreactConfig.json' });

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton()) return;

    const updatePanel = async () => {
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

      await interaction.update({ embeds: [embed], components: [row] });
    };

    if (interaction.customId === 'toggle_status') {
      const currentStatus = db.get('autoReactStatus') || false;
      db.set('autoReactStatus', !currentStatus);
      return updatePanel();
    }

    if (interaction.customId === 'configure_emojis') {
      await interaction.reply({ content: 'Envie até dois emojis (separados por espaço). Você tem 60 segundos.', ephemeral: true });
      const filter = (msg) => msg.author.id === interaction.user.id;

      const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

      collector.on('collect', (msg) => {
        const input = msg.content.trim();

        if (input.includes(' ') === false && input.length > 1) {
          msg.reply({ content: '⚠️ Por favor, envie os emojis separados por espaço para validação correta.', ephemeral: true });
          return collector.stop('invalid_format');
        }

        const emojis = input.split(/\s+/);

        if (emojis.length > 2) {
          msg.reply({ content: '⚠️ Você enviou mais de dois emojis. Por favor, envie no máximo dois.', ephemeral: true });
          return collector.stop('too_many_emojis');
        }

        const validEmojis = emojis.filter((emoji) => {
          const isUnicode = /^\p{Emoji}+$/u.test(emoji);
          const isCustom = emoji.match(/^<a?:\w+:\d+>$/);
          return isUnicode || isCustom;
        });

        if (validEmojis.length !== emojis.length) {
          msg.reply({ content: '⚠️ Um ou mais emojis enviados não são válidos. Por favor, envie apenas emojis permitidos.', ephemeral: true });
          return collector.stop('invalid_emojis');
        }

        if (new Set(validEmojis).size !== validEmojis.length) {
          msg.reply({ content: '⚠️ Você enviou emojis duplicados. Por favor, envie emojis diferentes.', ephemeral: true });
          return collector.stop('duplicate_emojis');
        }

        db.set('emojis', validEmojis);
        msg.reply({
          content: `😃 Emojis configurados com sucesso: ${validEmojis.join(' ')}\n⚠️ Desligue ou ligue novamente para as modificações serem aparentes.`,
          ephemeral: true
        });
        collector.stop('success');
      });

      collector.on('end', (_, reason) => {
        if (reason === 'time') {
          interaction.followUp({ content: '⏰ Tempo esgotado.', ephemeral: true });
        }
      });

      return;
    }

    if (interaction.customId === 'configure_channel') {
      await interaction.reply({ content: 'Mencione o canal para AutoReact. Você tem 60 segundos.', ephemeral: true });
      const filter = (msg) => msg.author.id === interaction.user.id;

      const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

      collector.on('collect', (msg) => {
        const channelMention = msg.mentions.channels.first();

        if (!channelMention) {
          msg.reply({ content: '⚠️ Você precisa mencionar um canal válido.', ephemeral: true });
          return collector.stop('invalid_channel');
        }

        db.set('targetChannel', channelMention.id);
        msg.reply({
          content: `📢 Canal configurado com sucesso: <#${channelMention.id}>\n⚠️ Desligue ou ligue novamente para as modificações serem aparentes.`,
          ephemeral: true
        });
        collector.stop('success');
      });

      collector.on('end', (_, reason) => {
        if (reason === 'time') {
          interaction.followUp({ content: '⏰ Tempo esgotado.', ephemeral: true });
        }
      });

      return;
    }
  },
};