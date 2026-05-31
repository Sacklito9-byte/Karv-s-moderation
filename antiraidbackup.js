const { SlashCommandBuilder, ChannelType, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const fs = require('fs');
const path = require('path'); // daqui para baixo tem explicação de como um subcomando funciona (backup e restauração).
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName("antiraid")
    .setDescription("[🛡️] Gerencia backups do servidor")
    .addSubcommand((sub) =>
      sub.setName("backup").setDescription("[🛡️]Faz backup dos canais e categorias do servidor.")
    )
    .addSubcommand((sub) =>
      sub.setName("restaurar").setDescription("[🛡️]Restaura os canais e categorias do servidor.")
    ),
  async execute(interaction) {
    const ownerID = config.ownerID;
    
    if (interaction.user.id !== ownerID) {
  return interaction.reply({
    content: "🚫 Você não tem permissão para usar este comando.",
    ephemeral: true,
  });
    }
    
    
    const { guild } = interaction;
    const subcommand = interaction.options.getSubcommand();
    const backupDataPath = path.resolve(__dirname, "../databases/antiraid.json");

    // Verificar se o arquivo de backup existe
    if (!fs.existsSync(backupDataPath)) {
      fs.writeFileSync(backupDataPath, "[]");
    }

    let backupData = [];
    try {
      const existingData = fs.readFileSync(backupDataPath, "utf-8");
      backupData = JSON.parse(existingData);
      if (!Array.isArray(backupData)) backupData = [];
    } catch (err) {
      console.error("Erro ao ler o arquivo de backup:", err);
      backupData = [];
    }

    // Comando de Backup
    if (subcommand === "backup") {
      // Coleta de categorias
      const categories = guild.channels.cache
        .filter((channel) => channel.type === ChannelType.GuildCategory)
        .map((category) => ({
          id: category.id,
          name: category.name,
          position: category.rawPosition,
        }));

      // Coleta de canais (exceto categorias)
      const channels = guild.channels.cache
        .filter((channel) => channel.type !== ChannelType.GuildCategory)
        .map((channel) => ({
          id: channel.id,
          name: channel.name,
          type: channel.type,
          parent: channel.parent?.id || null,
          position: channel.rawPosition,
          rateLimitPerUser: channel.rateLimitPerUser || 0,
        }));

      const newBackup = { guildId: guild.id, categories, channels };
      backupData.push(newBackup);

      try {
        // Salva o backup no arquivo
        fs.writeFileSync(backupDataPath, JSON.stringify(backupData, null, 4));

        // Criação de um painel (Embed + Botões)
        const backupEmbed = new EmbedBuilder()
          .setTitle("Backup Feito!")
          .setDescription("Os canais e categorias foram salvos com sucesso. Você pode restaurá-los quando necessário, se precissar para outro momento dê o comando 'antiraid restaurar'.")
          .setColor("#00FF00")
          .setTimestamp();

        const row = new ActionRowBuilder().addComponents(
          new ButtonBuilder()
            .setCustomId('restaurar')
            .setLabel('Restaurar Backup')
            .setStyle(ButtonStyle.Primary)
        );

        return interaction.reply({
          content: "Backup realizado com sucesso!",
          embeds: [backupEmbed],
          components: [row],
          ephemeral: true,
        });
      } catch (err) {
        console.error("Erro ao salvar backup:", err);
        return interaction.reply({
          content: "Erro ao salvar o backup. Tente novamente mais tarde.",
          ephemeral: true,
        });
      }
    }

    // Comando de Restauração
    if (subcommand === "restaurar") {
      const guildBackup = backupData.find((data) => data.guildId === guild.id);

      if (!guildBackup) {
        return interaction.reply({
          content: "Nenhum backup encontrado para este servidor.",
          ephemeral: true,
        });
      }

      await interaction.deferReply({ ephemeral: true });

      try {
        // Deletando canais antigos para restaurar os novos
        const channels = await guild.channels.fetch();

        const deletionResults = await Promise.allSettled(
          channels.map((channel) => channel.delete().catch((err) => err))
        );
        deletionResults.forEach((result) => {
          if (result.status === "rejected") {
            console.error(`Erro ao deletar canal: ${result.reason}`);
          }
        });

        // Criando categorias
        const createdCategories = new Map();
        for (const category of guildBackup.categories) {
          const createdCategory = await guild.channels.create({
            name: category.name,
            type: ChannelType.GuildCategory,
            position: category.position,
          });
          createdCategories.set(category.id, createdCategory.id);
        }

        // Criando canais
        for (const channel of guildBackup.channels) {
          await guild.channels.create({
            name: channel.name,
            type: channel.type,
            parent: channel.parent ? createdCategories.get(channel.parent) : null,
            position: channel.position,
            rateLimitPerUser: channel.rateLimitPerUser || 0,
          });
        }
      } catch (err) {
        console.error("Erro ao restaurar canais:", err);
        return interaction.editReply({
          content: "Erro ao restaurar o backup. Verifique os logs.",
        });
      }
    }
  },
};