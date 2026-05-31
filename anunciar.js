const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('anunciar')
    .setDescription('[📢] Crie um anúncio totalmente configurável.'),

  async execute(interaction) {
    const ownerID = config.ownerID;

    if (interaction.user.id !== ownerID) {
      return interaction.reply({
        content: "🚫 Você não tem permissão para usar este comando.",
        ephemeral: true,
      });
    }

    const embedConfig = {
      title: null,
      description: null,
      footer: 'Dev: 💜 | Nery #Programador',
      color: 0x7289da,
      image: null
    };

    let mensagemTexto = null;

    const botoesIniciais = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('configurar_embed')
          .setLabel('🖌️ Configurar Embed')
          .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
          .setCustomId('configurar_mensagem')
          .setLabel('✏️ Configurar Mensagem')
          .setStyle(ButtonStyle.Secondary),
        new ButtonBuilder()
          .setCustomId('visualizar_configuracao')
          .setLabel('👀 Ver Configuração')
          .setStyle(ButtonStyle.Success),
        new ButtonBuilder()
          .setCustomId('anunciar')
          .setLabel('📢 Anunciar')
          .setStyle(ButtonStyle.Danger)
      );

    await interaction.reply({
      content: 'Escolha uma ação abaixo:',
      components: [botoesIniciais],
      ephemeral: true
    });

    const filter = i => i.user.id === interaction.user.id;
    const collector = interaction.channel.createMessageComponentCollector({ filter, time: 600000 });

    collector.on('collect', async i => {
      if (i.customId === 'configurar_embed') {
        const modal = new ModalBuilder()
          .setCustomId('modal_configurar_embed')
          .setTitle('Configurar Embed')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('titulo')
                .setLabel('Título')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('descricao')
                .setLabel('Descrição')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('rodape')
                .setLabel('Rodapé')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
            ),
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('imagem')
                .setLabel('URL da Imagem')
                .setStyle(TextInputStyle.Short)
                .setRequired(false)
            )
          );
        await i.showModal(modal);
      } else if (i.customId === 'configurar_mensagem') {
        const modal = new ModalBuilder()
          .setCustomId('modal_configurar_mensagem')
          .setTitle('Configurar Mensagem')
          .addComponents(
            new ActionRowBuilder().addComponents(
              new TextInputBuilder()
                .setCustomId('mensagem_texto')
                .setLabel('Mensagem')
                .setStyle(TextInputStyle.Paragraph)
                .setRequired(true)
            )
          );
        await i.showModal(modal);
      } else if (i.customId === 'visualizar_configuracao') {
        const embedVisualizacao = new EmbedBuilder()
          .setTitle(embedConfig.title || 'Sem Título Configurado')
          .setDescription(embedConfig.description || 'Sem Descrição Configurada')
          .setFooter({ text: embedConfig.footer })
          .setColor(embedConfig.color);

        if (embedConfig.image) embedVisualizacao.setImage(embedConfig.image);

        await i.reply({
          content: mensagemTexto || 'Mensagem não configurada.',
          embeds: [embedVisualizacao],
          ephemeral: true
        });
      } else if (i.customId === 'anunciar') {
        if (!mensagemTexto && (!embedConfig.title && !embedConfig.description)) {
          return i.reply({
            content: '❌ Configure a mensagem ou o embed antes de anunciar!',
            ephemeral: true
          });
        }

        const botoesEnvio = new ActionRowBuilder()
          .addComponents(
            new ButtonBuilder()
              .setCustomId('enviar_mensagem')
              .setLabel('✉️ Enviar Mensagem')
              .setStyle(ButtonStyle.Primary)
              .setDisabled(!mensagemTexto),
            new ButtonBuilder()
              .setCustomId('enviar_embed')
              .setLabel('📑 Enviar Embed')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(!embedConfig.title && !embedConfig.description)
          );

        await i.reply({
          content: 'Escolha o que deseja enviar, ao enviar uma vez terá que apertar em anunciar novamente:',
          components: [botoesEnvio],
          ephemeral: true
        });

        const escolhaCollector = i.channel.createMessageComponentCollector({ filter, max: 1, time: 30000 });

        escolhaCollector.on('collect', async escolha => {
          await escolha.reply({
            content: '📌 Mencione o canal onde deseja enviar o anúncio.',
            ephemeral: true
          });

          const filterMsg = msg => msg.author.id === interaction.user.id && msg.mentions.channels.size > 0;
          const canalCollector = interaction.channel.createMessageCollector({ filter: filterMsg, max: 1, time: 30000 });

          canalCollector.on('collect', async canalMsg => {
            const canal = canalMsg.mentions.channels.first();

            if (escolha.customId === 'enviar_mensagem') {
              await canal.send(mensagemTexto);
            } else if (escolha.customId === 'enviar_embed') {
              const embedEnvio = new EmbedBuilder()
                .setTitle(embedConfig.title)
                .setDescription(embedConfig.description)
                .setFooter({ text: embedConfig.footer })
                .setColor(embedConfig.color);

              if (embedConfig.image) embedEnvio.setImage(embedConfig.image);

              await canal.send({ embeds: [embedEnvio] });
            }

            await escolha.followUp({
              content: `✅ Anúncio enviado para ${canal}.`,
              ephemeral: true
            });
          });

          canalCollector.on('end', (collected, reason) => {
            if (reason === 'time') {
              escolha.followUp({
                content: '⏰ Tempo Esgotado ao enviar menção do canal.',
                ephemeral: true
              });
            }
          });
        });
      }
    });

    interaction.client.on('interactionCreate', async modalInteraction => {
      if (!modalInteraction.isModalSubmit()) return;

      if (modalInteraction.customId === 'modal_configurar_embed') {
        const titulo = modalInteraction.fields.getTextInputValue('titulo') || null;
        const descricao = modalInteraction.fields.getTextInputValue('descricao') || null;
        const rodape = modalInteraction.fields.getTextInputValue('rodape') || null;
        const imagem = modalInteraction.fields.getTextInputValue('imagem') || null;

        embedConfig.title = titulo;
        embedConfig.description = descricao;
        embedConfig.footer = rodape;
        embedConfig.image = imagem;

        await modalInteraction.reply({
          content: '✅ Embed configurado com sucesso!',
          ephemeral: true
        });
      } else if (modalInteraction.customId === 'modal_configurar_mensagem') {
        mensagemTexto = modalInteraction.fields.getTextInputValue('mensagem_texto');

        await modalInteraction.reply({
          content: '✅ Mensagem configurada com sucesso!',
          ephemeral: true
        });
      }
    });
  }
};