const { ModalBuilder, TextInputBuilder, TextInputStyle, ActionRowBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

const palavrasProibidasPath = path.resolve('./databases/palavrasProibidas.json');

function readJSON(filePath) {
  if (!fs.existsSync(filePath)) return [];
  try {
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data).palavras || [];
  } catch {
    return [];
  }
}

function writeJSON(filePath, data) {
  fs.writeFileSync(filePath, JSON.stringify({ palavras: data }, null, 2), 'utf8');
}

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    if (interaction.isButton()) {
      if (interaction.customId === 'AddPalavra.js') {
        const modal = new ModalBuilder()
          .setCustomId('AddPalavraModal')
          .setTitle('Adicionar Palavra Proibida');

        const palavraInput = new TextInputBuilder()
          .setCustomId('palavraInput')
          .setLabel('Digite a palavra a ser adicionada:')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(palavraInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
      }

      if (interaction.customId === 'RemovePalavra.js') {
        const modal = new ModalBuilder()
          .setCustomId('RemovePalavraModal')
          .setTitle('Remover Palavra Proibida');

        const palavraInput = new TextInputBuilder()
          .setCustomId('palavraInput')
          .setLabel('Digite a palavra a ser removida:')
          .setStyle(TextInputStyle.Short)
          .setRequired(true);

        const actionRow = new ActionRowBuilder().addComponents(palavraInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
      }
    }

    if (interaction.isModalSubmit()) {
      if (interaction.customId === 'AddPalavraModal') {
        const palavra = interaction.fields.getTextInputValue('palavraInput');
        let palavras = readJSON(palavrasProibidasPath);

        if (!palavras.includes(palavra)) {
          palavras.push(palavra);
          writeJSON(palavrasProibidasPath, palavras);
          await interaction.reply({ content: `✅ A palavra **${palavra}** foi adicionada à lista de palavras proibidas.`, ephemeral: true });
        } else {
          await interaction.reply({ content: `⚠️ A palavra **${palavra}** já está na lista.`, ephemeral: true });
        }
      }

      if (interaction.customId === 'RemovePalavraModal') {
        const palavra = interaction.fields.getTextInputValue('palavraInput');
        let palavras = readJSON(palavrasProibidasPath);

        if (palavras.includes(palavra)) {
          palavras = palavras.filter((p) => p !== palavra);
          writeJSON(palavrasProibidasPath, palavras);
          await interaction.reply({ content: `✅ A palavra **${palavra}** foi removida da lista de palavras proibidas.`, ephemeral: true });
        } else {
          await interaction.reply({ content: `⚠️ A palavra **${palavra}** não está na lista.`, ephemeral: true });
        }
      }
    }
  },
};