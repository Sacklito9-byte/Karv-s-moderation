const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const moment = require('moment-timezone');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lockmsg')
    .setDescription('🧹 Apaga todas as mensagens deste canal e tranca o canal, configure o horário com o comando config.'),

  async execute(interaction, client) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: '🚫 Você não tem permissão para usar este comando.',
        ephemeral: true
      });
    } // criador: @nerydev

    const ownerId = interaction.user.id;
    
    const reopenTimePath = path.join(__dirname, '../reopenTime.json');
    if (!fs.existsSync(reopenTimePath)) {
      return interaction.reply({
        content: '⚠️ Arquivo reopenTime.json não encontrado. Defina os horários diurno e noturno e a data de destravamento.',
        ephemeral: true
      });
    }
    
    const { horaDiurna, horaNoturna, dataDestravamento } = JSON.parse(fs.readFileSync(reopenTimePath, 'utf-8'));

    const stopButtonRow = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('stopCleaning')
          .setLabel('🛑 Parar de Limpar')
          .setStyle(ButtonStyle.Danger)
      ); // criador: @nerydev

    await interaction.reply({ content: '🧹 Apagando mensagens, incluindo as mais antigas...', components: [stopButtonRow] });
    client.deleteMessages = true;

    async function deleteAndLockChannel() {
      if (!client.deleteMessages) return;

      let deletedCount = 0;

      async function deleteOldMessages(channel) {
        let lastMessageId;
        while (client.deleteMessages) {
          const fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
          if (fetchedMessages.size === 0) break;

          for (const message of fetchedMessages.values()) {
            try {
              await message.delete();
              deletedCount++;
            } catch (error) {
              if (error.code !== 10008) {
                console.error('Erro ao deletar mensagem:', error);
              }
            } // criador: @nerydev
          }

          lastMessageId = fetchedMessages.last().id;
        }
      }

      let deleted;
      do {
        try {
          deleted = await interaction.channel.bulkDelete(100, true);
          deletedCount += deleted.size;
        } catch (error) {
          if (error.code !== 10008) {
            console.error('Erro ao deletar mensagens em massa:', error);
          }
          break;
        }
      } while (deleted.size !== 0);

      await deleteOldMessages(interaction.channel);

      const deleteEmbed = new EmbedBuilder()
        .setColor(0xff0000)
        .setTitle('🗑️ Mensagens Removidas')
        .setDescription(`Total de mensagens apagadas: **${deletedCount}**.`)
        .setTimestamp();

      const lockEmbed = new EmbedBuilder()
        .setColor(0x0000ff)
        .setTitle('🔒 Canal Trancado')
        .setDescription(`Este canal foi trancado e será destrancado automaticamente no próximo horário configurado às **${horaDiurna}**.`)
        .setTimestamp();

      client.cleanupMessage = await interaction.followUp({ embeds: [deleteEmbed, lockEmbed], components: [stopButtonRow] });

      await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });

      if (client.deleteMessages) {
        toggleLockState();
      } // criador: @nerydev
    }

    deleteAndLockChannel();

    async function stopCleaning(buttonInteraction) {
      client.deleteMessages = false;

      if (client.cleanupMessage) {
        await client.cleanupMessage.delete().catch(console.error);
      }

      const currentPermissions = interaction.channel.permissionsFor(interaction.guild.id);
      if (currentPermissions && !currentPermissions.has(PermissionsBitField.Flags.SendMessages)) {
        await interaction.channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });
      }

      const stopEmbed = new EmbedBuilder()
        .setColor(0xffa500)
        .setTitle('🛑 Modo de Limpeza Interrompido!')
        .setDescription('O processo de limpeza foi interrompido e o canal foi destrancado.')
        .setTimestamp();

      await interaction.followUp({ embeds: [stopEmbed] });
    }

    function getNextReopenTime() {
      const currentTime = moment.tz('America/Sao_Paulo');
      const unlockDateTime = moment.tz(dataDestravamento, 'DD/MM/YYYY', 'America/Sao_Paulo');

      
      if (currentTime.isAfter(unlockDateTime)) {
        const dayMoment = moment.tz(horaDiurna, 'HH:mm', 'America/Sao_Paulo');
        const nightMoment = moment.tz(horaNoturna, 'HH:mm', 'America/Sao_Paulo');

        const nextToggle = currentTime.isBefore(dayMoment) ? dayMoment : nightMoment;

        if (nextToggle.isBefore(currentTime)) {
          nextToggle.add(1, 'day'); 
        }

        return nextToggle;
      } else {
        return unlockDateTime; 
      }
    }

    function calculateTimeUntilNextToggle() {
      const nextReopenTime = getNextReopenTime();
      const currentTime = moment.tz('America/Sao_Paulo');

      return nextReopenTime.diff(currentTime); 
    }

    function toggleLockState() {
      let isLocking = true; 

      function performToggle() {
        if (!client.deleteMessages) return;

        const timeUntilNextToggle = calculateTimeUntilNextToggle();

        setTimeout(async () => {
          const channel = interaction.channel;

          if (isLocking) {
            console.log('Trancando o canal...');
            await channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: false });

            const lockEmbed = new EmbedBuilder()
              .setColor(0x0000ff)
              .setTitle('🔒 Canal Trancado')
              .setDescription(`Este canal foi trancado e será destrancado automaticamente no próximo horário configurado às **${horaDiurna}**.`)
              .setTimestamp();

            await channel.send({ embeds: [lockEmbed] });
          } else {
            console.log('Destrancando o canal...');
            await channel.permissionOverwrites.edit(interaction.guild.id, { SendMessages: true });

            const unlockEmbed = new EmbedBuilder()
              .setColor(0x00ff00)
              .setTitle('✅ Canal Destrancado!')
              .setDescription(`Este canal foi destrancado automaticamente e será trancado novamente às **${horaNoturna}**.`)
              .setTimestamp();

            await channel.send({ embeds: [unlockEmbed] });
          }

          isLocking = !isLocking; 
          performToggle(); 
        }, timeUntilNextToggle);
      }

      performToggle(); 
    }

    client.on('interactionCreate', async (buttonInteraction) => {
      if (!buttonInteraction.isButton()) return;

      if (buttonInteraction.customId === 'stopCleaning') {
        if (buttonInteraction.user.id !== ownerId) {
          return buttonInteraction.reply({ content: '🚫 Apenas o proprietário deste comando pode parar a limpeza.', ephemeral: true });
        }

        await buttonInteraction.deferUpdate();
        await stopCleaning(buttonInteraction);
      }
    }); // criador: @nerydev
  }
};