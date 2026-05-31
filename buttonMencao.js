const fs = require('fs');
const path = require('path');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction) {
        if (!interaction.isButton()) return;

        if (interaction.customId === 'buttonMencao.js') {
            await interaction.reply({
                content: 'Envie a menção de quem você quer que eu bloqueie, mais se você marca uma pessoa que já está bloqueada irei desbloquea-lá.',
                ephemeral: true,
            });

            const filter = response => response.author.id === interaction.user.id;
            const collector = interaction.channel.createMessageCollector({ filter, time: 60000 });

            collector.on('collect', async message => {
                const mentionedUser = message.mentions.users.first();

                if (!mentionedUser) {
                    await message.reply('⚠️ Você precisa mencionar um usuário válido.');
                    return;
                }

                const jsonPath = path.resolve(__dirname, '../databases/mencaoProibida.json');
                let proibidos = [];

                if (fs.existsSync(jsonPath)) {
                    const jsonData = fs.readFileSync(jsonPath, 'utf-8');
                    proibidos = JSON.parse(jsonData);
                }

                if (proibidos.includes(mentionedUser.id)) {

                    proibidos = proibidos.filter(id => id !== mentionedUser.id);

                    try {
                        fs.writeFileSync(jsonPath, JSON.stringify(proibidos, null, 2));
                    } catch (error) {
                        console.error('Erro ao salvar o JSON:', error);
                        return interaction.followUp({
                            content: '⚠️ Ocorreu um erro ao salvar os dados. Tente novamente mais tarde.',
                            ephemeral: true,
                        });
                    }

                    await interaction.followUp({
                        content: `✅ ${mentionedUser} foi **removido** da lista de bloqueios.`,
                        ephemeral: true,
                    });

                    collector.stop();
                    return;
                }


                proibidos.push(mentionedUser.id);

                try {
                    fs.writeFileSync(jsonPath, JSON.stringify(proibidos, null, 2));
                } catch (error) {
                    console.error('Erro ao salvar o JSON:', error);
                    return interaction.followUp({
                        content: '⚠️ Ocorreu um erro ao salvar os dados. Tente novamente mais tarde.',
                        ephemeral: true,
                    });
                }

                await message.delete();

                await interaction.followUp({
                    content: `✅ ${mentionedUser} foi **adicionado** à lista de bloqueios.`,
                    ephemeral: true,
                });

                collector.stop();
            });

            collector.on('end', (collected, reason) => {
                if (reason === 'time') {
                    interaction.followUp({
                        content: '⏰ Tempo esgotado! Tente novamente clicando no botão.',
                        ephemeral: true,
                    });
                }
            });
        }
    },
};