const { SlashCommandBuilder, EmbedBuilder, ButtonBuilder, ActionRowBuilder, ButtonStyle, AttachmentBuilder } = require('discord.js');
const config = require('../config.json');

const ms = require('ms');

let activeGiveaway = null;

module.exports = {

    data: new SlashCommandBuilder()

        .setName('sorteio')

        .setDescription('Configura e inicia um sorteio.')

        .addStringOption(option =>

            option.setName('titulo')

                .setDescription('O título do sorteio')

                .setRequired(true))

        .addStringOption(option =>

            option.setName('descricao')

                .setDescription('A descrição do sorteio')

                .setRequired(true))

        .addStringOption(option =>

            option.setName('premio')

                .setDescription('O prêmio do sorteio (será enviado na DM do vencedor)')

                .setRequired(true))

        .addStringOption(option =>

            option.setName('tempo')

                .setDescription('Duração do sorteio (ex: 1h 10m 10s)')

                .setRequired(true))

        .addStringOption(option =>

            option.setName('imagem')

                .setDescription('URL de uma imagem (opcional)')

                .setRequired(false)),

    async execute(interaction) {
      const channel = interaction.channel;

        if (interaction.user.id !== config.ownerID) {

            return interaction.reply({ content: '🚫 Você não tem permissão para usar este comando.', ephemeral: true });

        }

        if (activeGiveaway) {

            return interaction.reply({

                content: '❌ Já existe um sorteio ativo no momento!',

                ephemeral: true

            });

        }

        const titulo = interaction.options.getString('titulo');

        const descricao = interaction.options.getString('descricao');

        const premio = interaction.options.getString('premio');

        const tempo = interaction.options.getString('tempo');

        const imagem = interaction.options.getString('imagem');

        const duracao = ms(tempo);

        if (!duracao) {

            return interaction.reply({

                content: '❌ Formato de tempo inválido! Use algo como `1h 10m 10s`.',

                ephemeral: true

            });

        }

        const participantes = new Set();

        const embed = new EmbedBuilder()

            .setTitle(titulo)

            .setDescription(descricao)

            .addFields({ name: 'Participantes', value: '0' })

            .setColor('Blue')

            .setFooter({ text: `Sorteio Acabará daqui á ${tempo}` })

            .setTimestamp();

        if (imagem) embed.setImage(imagem);

        const participarBtn = new ButtonBuilder()

            .setCustomId('participar')

            .setLabel('Participar')

            .setStyle(ButtonStyle.Success);

        const sairBtn = new ButtonBuilder()

            .setCustomId('sair')

            .setLabel('Sair')

            .setStyle(ButtonStyle.Danger);

        const participantesBtn = new ButtonBuilder()

            .setCustomId('ver_participantes')

            .setLabel('Participantes')

            .setStyle(ButtonStyle.Primary);

        const row = new ActionRowBuilder().addComponents(participarBtn, sairBtn, participantesBtn);

        const msg = await interaction.reply({

            embeds: [embed],

            components: [row],

            fetchReply: true

        });

        activeGiveaway = {

            messageId: msg.id,

            channelId: msg.channel.id,

            host: interaction.user.id,

            participantes: []

        };

        const updateParticipantsCount = async () => {

            const updatedEmbed = EmbedBuilder.from(embed).setFields([

                { name: 'Participantes', value: `${participantes.size}` }

            ]);

            await msg.edit({ embeds: [updatedEmbed] });

        };

        const filter = i => ['participar', 'sair', 'ver_participantes'].includes(i.customId);

        const collector = msg.createMessageComponentCollector({ filter, time: duracao });

        collector.on('collect', async i => {

            if (i.customId === 'participar') {

                if (participantes.has(i.user.id)) {

                    return i.reply({ content: '⚠️ Você já está participando! Deseja sair?', ephemeral: true });

                }

                participantes.add(i.user.id);

                activeGiveaway.participantes.push(i.user.id);

                await updateParticipantsCount();

                return i.reply({ content: '✅ Você entrou no sorteio!', ephemeral: true });

            }

            if (i.customId === 'sair') {

                if (!participantes.has(i.user.id)) {

                    return i.reply({ content: '⚠️ Você não está participando!', ephemeral: true });

                }

                participantes.delete(i.user.id);

                activeGiveaway.participantes = activeGiveaway.participantes.filter(id => id !== i.user.id);

                await updateParticipantsCount();

                return i.reply({ content: '✅ Você saiu do sorteio!', ephemeral: true });

            }

            if (i.customId === 'ver_participantes') {

                const participantesLista = [...participantes].map(id => `<@${id}>`).join('\n') || 'Nenhum participante.';

                const buffer = Buffer.from(participantesLista, 'utf-8');

                const attachment = new AttachmentBuilder(buffer, { name: 'participantes.txt' });

                return i.reply({

                    content: '📄 Aqui está a lista dos participantes:',

                    files: [attachment],

                    ephemeral: true

                });

            }

        });

        collector.on('end', async () => {

            const participantesIds = activeGiveaway.participantes;

            activeGiveaway = null;

            if (participantesIds.length === 0) {

                return msg.edit({

                    content: '❌ O sorteio foi encerrado sem participantes!',

                    embeds: [],

                    components: []

                });

            }

            const vencedorId = participantesIds[Math.floor(Math.random() * participantesIds.length)];

            const vencedor = await interaction.guild.members.fetch(vencedorId);

            const resultadoEmbed = new EmbedBuilder()

                .setTitle('🎉 Sorteio Encerrado!')

                .setDescription(`O vencedor é ${vencedor}!\n\n⚠️ **O prêmio será enviado na sua DM! Certifique-se de que está habilitado para receber mensagens.**`)

                .setColor('Green')

                .setTimestamp();

            await msg.edit({

                embeds: [resultadoEmbed],

                components: []

            });

            try {

                const premioEmbed = new EmbedBuilder()

                    .setTitle('🎁 Você ganhou um sorteio!')

                    .setDescription(`Parabéns! Você ganhou o sorteio **${titulo}**.\n\n**Prêmio:** ${premio}\n\nEntre em contato com o organizador, se necessário.`)

                    .setColor('Gold')

                    .setTimestamp();

                await vencedor.send({ embeds: [premioEmbed] });

            } catch (error) {

                msg.channel.send(`⚠️ Não foi possível enviar uma DM para ${vencedor}. Certifique-se de que suas DMs estão habilitadas.`);

            }

            msg.channel.send(`🎉 Parabéns ${vencedor}, você ganhou o prêmio! Verifique sua DM para mais informações.`);

        });

    }

};