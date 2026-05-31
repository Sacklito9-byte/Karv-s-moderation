const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

let embedConfig = {
    title: '',
    description: '',
    footer: '💜 | Nery #Programador',
    image: null,
};

let roleConfig = null;

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

        if (interaction.customId === 'configurar_embed') {
            const embed = new EmbedBuilder()
                .setTitle('Configuração da Embed')
                .setDescription('Escolha o que deseja configurar:')
                .setColor('Blue');

            const buttons = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('configurar_titulo')
                        .setLabel('Configurar Nome')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('configurar_descricao')
                        .setLabel('Configurar Descrição')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('configurar_footer')
                        .setLabel('Configurar Footer')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('configurar_imagem')
                        .setLabel('Configurar Imagem')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('ver_configuracao')
                        .setLabel('Ver Configuração')
                        .setStyle(ButtonStyle.Success)
                );

            await interaction.reply({ embeds: [embed], components: [buttons], ephemeral: true });
        }

        if (interaction.customId === 'enviar_embed') {
            if (!embedConfig.title || !embedConfig.description) {
                return interaction.reply({ content: 'Você precisa configurar o título e a descrição antes de enviar.', ephemeral: true });
            }

            await interaction.reply({ content: 'Mencione o canal onde deseja enviar a embed:', ephemeral: true });

            const filter = m => m.author.id === interaction.user.id && m.mentions.channels.size > 0;
            try {
                const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
                const mentionedChannel = collected.first().mentions.channels.first();

                if (!mentionedChannel || !mentionedChannel.isTextBased()) {
                    collected.first().delete();
                    return interaction.followUp({ content: 'Erro: O canal mencionado é inválido ou não é um canal de texto.', ephemeral: true });
                }

                const embed = new EmbedBuilder()
                    .setTitle(embedConfig.title)
                    .setDescription(embedConfig.description)
                    .setFooter({ text: embedConfig.footer })
                    .setColor('Green');

                if (embedConfig.image) embed.setImage(embedConfig.image);

                const button = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setCustomId('verificar')
                        .setLabel('Verificar-se')
                        .setStyle(ButtonStyle.Success)
                );

                await mentionedChannel.send({ embeds: [embed], components: [button] });
                await interaction.followUp({ content: 'Embed enviada com sucesso!', ephemeral: true });
                collected.first().delete();
            } catch {
                await interaction.followUp({ content: 'Erro: Tempo esgotado. Tente novamente.', ephemeral: true });
            }
        }

        if (interaction.customId === 'configurar_cargo') {
            const roles = interaction.guild.roles.cache.filter(role => role.id !== interaction.guild.id);

            if (roles.size === 0) {
                return interaction.reply({ content: 'Nenhum cargo disponível para configurar.', ephemeral: true });
            }

            const menu = new StringSelectMenuBuilder()
                .setCustomId('selecionar_cargo')
                .setPlaceholder('Selecione um cargo')
                .addOptions(
                    roles.map(role => ({
                        label: role.name,
                        value: role.id,
                    }))
                );

            const row = new ActionRowBuilder().addComponents(menu);

            await interaction.reply({ content: 'Selecione um cargo para configurar:', components: [row], ephemeral: true });
        }

        if (interaction.customId === 'selecionar_cargo') {
            const selectedRole = interaction.values[0];
            roleConfig = selectedRole;
            await interaction.reply({ content: `Cargo configurado: <@&${selectedRole}>`, ephemeral: true });
        }

        if (interaction.customId === 'verificar') {
            if (!roleConfig) {
                return interaction.reply({ content: 'Erro: Cargo não configurado.', ephemeral: true });
            }

            const botRole = interaction.guild.members.me.roles.highest.position;
            const targetRole = interaction.guild.roles.cache.get(roleConfig).position;

            if (botRole <= targetRole) {
                return interaction.reply({ content: 'Erro: O cargo do bot precisa estar acima do cargo configurado.', ephemeral: true });
            }

            if (interaction.member.roles.cache.has(roleConfig)) {
                return interaction.reply({ content: 'Você já possui o cargo configurado.', ephemeral: true });
            }

            await interaction.member.roles.add(roleConfig);
            await interaction.reply({ content: 'Você foi verificado com sucesso e recebeu o cargo!', ephemeral: true });
        }

        if (interaction.customId === 'configurar_titulo') {
            await interaction.reply({ content: 'Envie o título para a embed:', ephemeral: true });
            const filter = m => m.author.id === interaction.user.id;
            try {
                const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
                embedConfig.title = collected.first().content;
                collected.first().delete();
                await interaction.followUp({ content: 'Título configurado!', ephemeral: true });
            } catch {
                await interaction.followUp({ content: 'Erro: Tempo esgotado. Tente novamente.', ephemeral: true });
            }
        }

        if (interaction.customId === 'configurar_descricao') {
            await interaction.reply({ content: 'Envie a descrição para a embed:', ephemeral: true });
            const filter = m => m.author.id === interaction.user.id;
            try {
                const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
                embedConfig.description = collected.first().content;
                collected.first().delete();
                await interaction.followUp({ content: 'Descrição configurada!', ephemeral: true });
            } catch {
                await interaction.followUp({ content: 'Erro: Tempo esgotado. Tente novamente.', ephemeral: true });
            }
        }

        if (interaction.customId === 'configurar_footer') {
            await interaction.reply({ content: 'Envie o texto do footer para a embed:', ephemeral: true });
            const filter = m => m.author.id === interaction.user.id;
            try {
                const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
                embedConfig.footer = collected.first().content;
                collected.first().delete();
                await interaction.followUp({ content: 'Footer configurado!', ephemeral: true });
            } catch {
                await interaction.followUp({ content: 'Erro: Tempo esgotado. Tente novamente.', ephemeral: true });
            }
        }

        if (interaction.customId === 'configurar_imagem') {
            await interaction.reply({ content: 'Envie o link da imagem para a embed:', ephemeral: true });
            const filter = m => m.author.id === interaction.user.id;
            try {
                const collected = await interaction.channel.awaitMessages({ filter, max: 1, time: 60000 });
                embedConfig.image = collected.first().content;
                collected.first().delete();
                await interaction.followUp({ content: 'Imagem configurada!', ephemeral: true });
            } catch {
                await interaction.followUp({ content: 'Erro: Tempo esgotado. Tente novamente.', ephemeral: true });
            }
        }

        if (interaction.customId === 'ver_configuracao') {
            const embed = new EmbedBuilder()
                .setTitle(embedConfig.title || 'Sem Título')
                .setDescription(embedConfig.description || 'Sem Descrição')
                .setFooter({ text: embedConfig.footer })
                .setColor('Blue');

            if (embedConfig.image) embed.setImage(embedConfig.image);

            await interaction.reply({ embeds: [embed], ephemeral: true });
        }
    },
};