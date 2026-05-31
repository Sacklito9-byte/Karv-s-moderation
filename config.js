const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');
const config = require('../config.json');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('configlock')
    .setDescription('Configura os horários diurno e noturo e a data para o comando lockprogramado.')
    .addStringOption(option =>
      option.setName('hora_diurna')
        .setDescription('Hora de reabertura diurna (formato HH:MM)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('hora_noturna')
        .setDescription('Hora de reabertura noturna (formato HH:MM)')
        .setRequired(true)
    )
    .addStringOption(option =>
      option.setName('data_destravamento')
        .setDescription('[⏰] Data do primeiro destravamento (formato DD/MM/YYYY)')
        .setRequired(true)
    ),

  async execute(interaction, client) {
    if (interaction.user.id !== config.ownerID) {
      return interaction.reply({
        content: '🚫 Você não tem permissão para usar este comando.',
        ephemeral: true
      });
    }

    const horaDiurna = interaction.options.getString('hora_diurna');
    const horaNoturna = interaction.options.getString('hora_noturna');
    const dataDestravamento = interaction.options.getString('data_destravamento');
    const horaRegex = /^\d{2}:\d{2}$/;
    const dataRegex = /^\d{2}\/\d{2}\/\d{4}$/;

    if (!horaRegex.test(horaDiurna) || !horaRegex.test(horaNoturna)) {
      return interaction.reply({
        content: 'Por favor, insira as horas no formato HH:MM.',
        ephemeral: true
      });
    }

    if (!dataRegex.test(dataDestravamento)) {
      return interaction.reply({
        content: 'Por favor, insira a data no formato DD/MM/YYYY.',
        ephemeral: true
      });
    }

    try {
      const config = {
        horaDiurna,
        horaNoturna,
        dataDestravamento
      };

      const configFilePath = path.join(__dirname, '../reopenTime.json');
      fs.writeFileSync(configFilePath, JSON.stringify(config, null, 2));
      client.reopenConfig = config;

      const configEmbed = new EmbedBuilder()
        .setColor(0x00FF00)
        .setTitle('Configuração Atualizada com Sucesso!')
        .setDescription('Aqui estão as configurações para o trancamento e destravamento do canal:')
        .addFields(
          { name: 'Hora Diurna', value: horaDiurna, inline: true },
          { name: 'Hora Noturna', value: horaNoturna, inline: true },
          { name: 'Data de Destravamento', value: dataDestravamento, inline: true }
        )
        .setTimestamp();

      await interaction.reply({
        embeds: [configEmbed],
        ephemeral: true
      });
    } catch (error) {
      console.error('Erro ao salvar as configurações:', error);
      await interaction.reply({
        content: 'Ocorreu um erro ao salvar as configurações. Tente novamente.',
        ephemeral: true
      });
    }
  }
};