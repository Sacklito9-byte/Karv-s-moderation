const {
  ChannelType,
  EmbedBuilder,
  StringSelectMenuBuilder,
  ActionRowBuilder,
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    if (interaction.customId === 'criar_webhook') {
      await criarWebhook(interaction);
    }

    if (interaction.customId === 'apagar_webhook') {
      await apagarWebhook(interaction);
    }
  },
};

async function criarWebhook(interaction) {
  const canais = interaction.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
  const options = Array.from(canais.values()).map(canal => ({
    label: canal.name,
    value: canal.id,
  }));

  const menu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('select_channel_create')
      .setPlaceholder('Selecione o canal para criar a webhook')
      .addOptions(options)
  );

  const embed = new EmbedBuilder()
    .setColor('Green')
    .setTitle('📌 Criar Novo Webhook')
    .setDescription('Escolha o canal onde a webhook será criada.');

  await interaction.reply({
    embeds: [embed],
    components: [menu],
    ephemeral: true,
  });

  const collector = interaction.channel.createMessageComponentCollector({
    time: 30000,
    filter: i => i.customId === 'select_channel_create' && i.user.id === interaction.user.id,
  });

  collector.on('collect', async i => {
    const canal = await interaction.guild.channels.fetch(i.values[0]);

    if (!canal.isTextBased()) {
      return i.reply({ content: '❌ O canal selecionado não é válido.', ephemeral: true });
    }

    try {
      const webhook = await canal.createWebhook({
        name: `Webhook - ${interaction.user.tag}`,
        reason: `Criada por ${interaction.user.tag}`,
      });

      const webhookEmbed = new EmbedBuilder()
        .setColor('Blue')
        .setTitle('✅ Webhook Criada com Sucesso!')
        .addFields(
          { name: '📌 Canal:', value: `**${canal.name}**`, inline: true },
          { name: '🔗 URL da Webhook:', value: `\`\`\`\n${webhook.url}\n\`\`\``, inline: false },
          { name: '🕒 Criada em:', value: `${new Date(webhook.createdTimestamp).toLocaleString('pt-BR')}`, inline: false }
        )
        .setFooter({ text: `Webhook criada por ${interaction.user.tag}` });

      await i.reply({
        embeds: [webhookEmbed],
        ephemeral: true,
      });
    } catch (error) {
      console.error(error);
      await i.reply({
        content: '❌ Ocorreu um erro ao criar a webhook. Verifique as permissões e tente novamente.',
        ephemeral: true,
      });
    }
  });
}

async function apagarWebhook(interaction) {
  const canais = interaction.guild.channels.cache.filter(ch => ch.type === ChannelType.GuildText);
  const options = Array.from(canais.values()).map(canal => ({
    label: canal.name,
    value: canal.id,
  }));

  const menu = new ActionRowBuilder().addComponents(
    new StringSelectMenuBuilder()
      .setCustomId('select_channel_delete')
      .setPlaceholder('Selecione o canal para apagar webhooks')
      .addOptions(options)
  );

  const embed = new EmbedBuilder()
    .setColor('Red')
    .setTitle('🗑️ Apagar Webhook')
    .setDescription('Escolha o canal onde as webhooks serão apagadas.');

  await interaction.reply({
    embeds: [embed],
    components: [menu],
    ephemeral: true,
  });

  const collector = interaction.channel.createMessageComponentCollector({
    time: 30000,
    filter: i => i.customId === 'select_channel_delete' && i.user.id === interaction.user.id,
  });

  collector.on('collect', async i => {
    const canal = await interaction.guild.channels.fetch(i.values[0]);
    if (!canal.isTextBased()) {
      return i.reply({ content: '❌ O canal selecionado não é válido.', ephemeral: true });
    }

    const webhooks = await canal.fetchWebhooks();

    if (!webhooks.size) {
      return i.reply({ content: '❌ Não há webhooks neste canal.', ephemeral: true });
    }

    const options = webhooks.map(wh => ({
      label: `${wh.name} (Criada em: ${new Date(wh.createdTimestamp).toLocaleString('pt-BR')})`,
      value: wh.id,
    }));

    const webhookMenu = new ActionRowBuilder().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId('select_webhook_delete')
        .setPlaceholder('Selecione as webhooks para apagar')
        .addOptions(options)
        .setMinValues(1)
        .setMaxValues(options.length)
    );

    await i.reply({
      content: 'Selecione as webhooks que deseja apagar:',
      components: [webhookMenu],
      ephemeral: true,
    });

    const webhookCollector = interaction.channel.createMessageComponentCollector({
      time: 30000,
      filter: i => i.customId === 'select_webhook_delete' && i.user.id === interaction.user.id,
    });

    webhookCollector.on('collect', async i => {
      const idsParaApagar = i.values;

      try {
        for (const id of idsParaApagar) {
          const webhook = await interaction.client.fetchWebhook(id);
          if (webhook) {
            await webhook.delete(`Apagada por ${interaction.user.tag}`);
          }
        }

        await i.reply({
          content: `✅ As webhooks selecionadas foram apagadas com sucesso.`,
          ephemeral: true,
        });
      } catch (error) {
        console.error(error);
        await i.reply({
          content: '❌ Ocorreu um erro ao tentar apagar as webhooks. Certifique-se de que elas ainda existem e que você possui permissões suficientes.',
          ephemeral: true,
        });
      }
    });
  });
}