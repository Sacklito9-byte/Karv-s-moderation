const { Events, EmbedBuilder } = require('discord.js');
const fs = require('fs');

const palavrasProibidasPath = './databases/palavrasProibidas.json';
const mencaoProibidaPath = './databases/mencaoProibida.json';
const antilinkPath = './databases/antilink.json';
const logsPath = './databases/logsModeração.json';

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    





    if (message.author.bot || !message.guild) return;

    if (message.content.toLowerCase() === 'user entrou') {
      await guildMemberAdd.simulate(message);
    }
    if (message.content.toLowerCase() === 'user saiu') {
      await guildMemberRemove.simulate(message);
    }

    if (message.mentions.has(message.client.user) && message.mentions.users.size === 1) {
      return message.channel.send(
        `😁 | Olá <@${message.author.id}>, me chamou? Meu prefixo é [/], No momento o /ajuda ainda está em desenvolvimento, então para qualquer dúvida ou erro, fale com o **@nerydev**`
      );
    }

    let palavrasProibidas = [];
    try {
      const palavrasData = fs.readFileSync(palavrasProibidasPath, 'utf-8');
      palavrasProibidas = JSON.parse(palavrasData).palavras;
    } catch {}

    let mencoesProibidas = [];
    try {
      if (fs.existsSync(mencaoProibidaPath)) {
        const mencaoData = fs.readFileSync(mencaoProibidaPath, 'utf-8');
        mencoesProibidas = JSON.parse(mencaoData);
      }
    } catch {}

    let antilinkData = {};
    try {
      if (fs.existsSync(antilinkPath)) {
        antilinkData = JSON.parse(fs.readFileSync(antilinkPath, 'utf-8'));
      }
    } catch {}

    const guildId = message.guild.id;
    const antilinkEnabled = antilinkData[guildId] || false;

    const logData = fs.existsSync(logsPath) ? JSON.parse(fs.readFileSync(logsPath, 'utf-8')) : {};
    const logChannelId = logData[guildId];
    const logChannel = logChannelId ? message.guild.channels.cache.get(logChannelId) : null;

    const now = new Date();
    const formattedDateTime = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1)
      .toString()
      .padStart(2, '0')} às ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    const devInfo = `Dev: 💜|Nery #Programador`;

    const mensagemConteudo = message.content.toLowerCase();
    const palavrasEncontradas = palavrasProibidas.filter((palavra) =>
      mensagemConteudo.includes(palavra.toLowerCase())
    );

    const usuariosMencionados = message.mentions.users.map((user) => user.id);
    const mencoesInvalidas = usuariosMencionados.filter((id) => mencoesProibidas.includes(id));

    if (antilinkEnabled) {
      const linkRegex = /(https?:\/\/|discord\.gg|\.com)/gi;
      if (linkRegex.test(message.content)) {
        const embedAntiLink = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🔗 Link Bloqueado')
          .setDescription('Links ou convites do Discord não são permitidos neste servidor.')
          .setFooter({ text: devInfo });

        await message.channel.send({
          content: `<@${message.author.id}>`,
          embeds: [embedAntiLink],
        });

        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setColor('#ff0000')
            .setTitle('🚨 Link Bloqueado')
            .setDescription(`Usuário: <@${message.author.id}>\nConteúdo: ${message.content}`)
            .addFields({ name: 'Data e Hora', value: formattedDateTime })
            .setFooter({ text: devInfo });

          await logChannel.send({ embeds: [logEmbed] });
        }

        try {
  await message.delete();
} catch (err) {
  if (err.code === 10008) {
    console.error(`Erro ao apagar mensagem: A mensagem não existe mais. ID: ${message.id}`);
  } else {
    console.error(`Erro ao apagar mensagem. Detalhes:`, err);
  }
}
        return;
      }
    }

    if (palavrasEncontradas.length > 0) {
      const embedPalavras = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚫 Violação Detectada 🚫')
        .setDescription(
          `Palavras proibidas detectadas na mensagem: **${palavrasEncontradas.join(', ')}**`
        )
        .setFooter({ text: devInfo });

      await message.channel.send({
        content: `<@${message.author.id}>`,
        embeds: [embedPalavras],
      });

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🚨 Palavra Proibida Detectada')
          .setDescription(`Usuário: <@${message.author.id}>\nConteúdo: ${message.content}`)
          .addFields({ name: 'Data e Hora', value: formattedDateTime })
          .setFooter({ text: devInfo });

        await logChannel.send({ embeds: [logEmbed] });
      }

      await message.delete();
    }

    if (mencoesInvalidas.length > 0) {
      const embedMencoes = new EmbedBuilder()
        .setColor('#ff0000')
        .setTitle('🚫 Violação Detectada 🚫')
        .setDescription(
          `Você não pode mencionar os seguintes usuários:\n${mencoesInvalidas
            .map((id) => `<@${id}>`)
            .join('\n')}.`
        )
        .setFooter({ text: devInfo });

      await message.channel.send({
        content: `<@${message.author.id}>`,
        embeds: [embedMencoes],
      });

      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setColor('#ff0000')
          .setTitle('🚨 Menção Proibida Detectada')
          .setDescription(
            `Usuário: <@${message.author.id}>\nMenções: ${mencoesInvalidas
              .map((id) => `<@${id}>`)
              .join(', ')}`
          )
          .addFields({ name: 'Data e Hora', value: formattedDateTime })
          .setFooter({ text: devInfo });

        await logChannel.send({ embeds: [logEmbed] });
      }

      try {
  await message.delete();
} catch (err) {
  if (err.code === 10008) {
    console.error(`Erro ao apagar mensagem: A mensagem não existe mais. ID: ${message.id}`);
  } else {
    console.error(`Erro ao apagar mensagem. Detalhes:`, err);
  }
}
    }
  },
};