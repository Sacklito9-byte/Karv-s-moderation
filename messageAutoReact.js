const { JsonDatabase } = require('wio.db');
const db = new JsonDatabase({ databasePath: './databases/autoreactConfig.json' });

module.exports = {
  name: 'messageCreate',
  async execute(message) {
    const autoReactStatus = db.get('autoReactStatus') || false;
    const targetChannel = db.get('targetChannel') || null;
    const emojis = db.get('emojis') || [];

    if (!autoReactStatus || message.channel.id !== targetChannel || message.author.bot) return;

    for (const emoji of emojis) {
      await message.react(emoji).catch(() => null);
    }
  },
};