const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const configPath = './config.json';
const config = require('../config.json');

module.exports = {
  name: 'interactionCreate',

  async execute(interaction, client) {
    if (!interaction.isButton() && !interaction.isModalSubmit()) return;

    if (interaction.customId === 'change_name') {
      const modal = new ModalBuilder()
        .setCustomId('modal_change_name')
        .setTitle('Alterar Apelido do Bot');

      const input = new TextInputBuilder()
        .setCustomId('bot_name_input')
        .setLabel('Novo apelido do bot (2-32 caracteres)')
        .setStyle(TextInputStyle.Short)
        .setMaxLength(32)
        .setMinLength(2)
        .setPlaceholder('Novo apelido do bot')
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);

      await interaction.showModal(modal);
    }

    if (interaction.customId === 'modal_change_name') {
      const nickname = interaction.fields.getTextInputValue('bot_name_input');

      try {
        const guildMember = interaction.guild.members.cache.get(client.user.id);
        if (!guildMember) {
          await interaction.reply({ content: '❌ Não foi possível encontrar o membro do bot neste servidor.', ephemeral: true });
          return;
        }

        await guildMember.setNickname(nickname);
        await interaction.reply({ content: `✅ O apelido do bot foi alterado para: **${nickname}**.`, ephemeral: true });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Não foi possível alterar o apelido do bot. Verifique se o bot tem as permissões adequadas.', ephemeral: true });
      }
    }

    if (interaction.customId === 'change_avatar') {
      const modal = new ModalBuilder()
        .setCustomId('modal_change_avatar')
        .setTitle('Alterar Foto do Bot');

      const input = new TextInputBuilder()
        .setCustomId('bot_avatar_input')
        .setLabel('Link da nova foto do bot')
        .setStyle(TextInputStyle.Short)
        .setPlaceholder('https://exemplo.com/imagem.png')
        .setRequired(true);

      const row = new ActionRowBuilder().addComponents(input);
      modal.addComponents(row);

      await interaction.showModal(modal);
    }

    if (interaction.customId === 'modal_change_avatar') {
      const avatarURL = interaction.fields.getTextInputValue('bot_avatar_input');

      if (!avatarURL.startsWith('http://') && !avatarURL.startsWith('https://')) {
        await interaction.reply({ content: '❌ O link da foto precisa começar com "http://" ou "https://".', ephemeral: true });
        return;
      }

      try {
        await client.user.setAvatar(avatarURL);
        await interaction.reply({ content: '✅ A foto do bot foi alterada com sucesso!', ephemeral: true });
      } catch (error) {
        console.error(error);
        await interaction.reply({ content: '❌ Não foi possível alterar a foto do bot. Tente novamente mais tarde.', ephemeral: true });
      }
    }

    if (interaction.customId === 'change_owner') {
      await interaction.reply({ content: '👑 Mencione o novo dono do bot neste canal (1 minuto).', ephemeral: true });

      const filter = m => m.author.id === interaction.user.id && m.mentions.users.size > 0;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async message => {
        const newOwner = message.mentions.users.first();

        if (!newOwner) {
          await interaction.followUp({ content: '❌ Nenhum usuário válido foi mencionado.', ephemeral: true });
          return;
        }

        config.ownerID = newOwner.id;
        fs.writeFile(configPath, JSON.stringify(config, null, 2), err => {
          if (err) {
            interaction.followUp({ content: '❌ Ocorreu um erro ao salvar o novo dono. Tente novamente mais tarde.', ephemeral: true });
          } else {
            interaction.followUp({ content: `✅ O novo dono do bot foi definido como: **${newOwner.tag}**.`, ephemeral: true });
          }
        });
      });

      collector.on('end', collected => {
        if (!collected.size) {
          interaction.followUp({ content: '⏳ Tempo esgotado. Nenhum dono foi alterado.', ephemeral: true });
        }
      });
    }
  },
};