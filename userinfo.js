const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('userinfo')
    .setDescription('[🔍] Exibe informações detalhadas de um usuário.')
    .addUserOption(option =>
      option
        .setName('usuario')
        .setDescription('Selecione o usuário para exibir as informações.')
        .setRequired(false)
    ),

  async execute(interaction) {
    const user = interaction.options.getUser('usuario') || interaction.user;
    const member = interaction.guild.members.cache.get(user.id);
    const userFlags = await user.fetchFlags().then(flags => flags.toArray());

    const badgeMap = {
      ActiveDeveloper: '🌟 Desenvolvedor Ativo',
      HypeSquadOnlineHouse1: '🏠 Bravery',
      HypeSquadOnlineHouse2: '🏠 Brilliance',
      HypeSquadOnlineHouse3: '🏠 Balance',
      Hypesquad: '🎉 HypeSquad',
      BugHunterLevel1: '🐛 Bug Hunter (Nível 1)',
      BugHunterLevel2: '🐛 Bug Hunter (Nível 2)',
      EarlyVerifiedBotDeveloper: '🤖 Desenvolvedor de Bot Verificado',
      HouseBravery: '🛡️ Bravery',
      HouseBrilliance: '💡 Brilliance',
      HouseBalance: '⚖️ Balance',
      VerifiedDeveloper: '✅ Desenvolvedor Verificado',
      Partner: '🤝 Parceiro Discord',
      CertifiedModerator: '🛡️ Moderador Certificado',
      PremiumEarlySupporter: '💎 Early Supporter',
      Staff: '🛡️ Equipe Discord',
    };

    const badges = userFlags.map(flag => badgeMap[flag]).filter(Boolean).join(', ') || 'Nenhum';

    const embed = new EmbedBuilder()
      .setColor('#2b2d31')
      .setAuthor({
        name: `Informações de ${user.tag}`,
        iconURL: user.displayAvatarURL({ dynamic: true }),
      })
      .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 1024 }))
      .addFields(
        { name: '🆔 ID', value: user.id, inline: true },
        { name: '📛 Apelido', value: member.nickname || 'Nenhum', inline: true },
        { name: '🏅 Badges', value: badges, inline: false },
        {
          name: '📅 Entrou no servidor',
          value: member.joinedTimestamp ? `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>` : 'Desconhecido',
          inline: true,
        },
        { name: '📝 Conta criada em', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:F>`, inline: true },
        {
          name: '🧑‍🔧 Cargos',
          value: member.roles.cache.size > 1
            ? member.roles.cache
                .filter(role => role.id !== interaction.guild.id)
                .map(role => `<@&${role.id}>`)
                .join(', ')
            : 'Nenhum',
          inline: false,
        }
      )
      .setFooter({
        text: `Solicitado por ${interaction.user.tag}`,
        iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
      })
      .setTimestamp();

    await interaction.reply({ embeds: [embed] });
  },
};