const { REST, Routes, SlashCommandBuilder } = require('discord.js');

const commands = [
  new SlashCommandBuilder()
    .setName('member-log')
    .setDescription('Post an editable member log'),

  new SlashCommandBuilder()
    .setName('sticky-log')
    .setDescription('Post a sticky editable log that stays at the bottom'),

  new SlashCommandBuilder()
    .setName('mediaonly')
    .setDescription('Manage media-only rules')
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Add a media-only rule')
      .addChannelOption(option => option.setName('channel').setDescription('Channel or forum to enforce').setRequired(true))
      .addStringOption(option => option.setName('thread').setDescription('Specific thread ID (optional)').setRequired(false)))
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription('Remove a media-only rule')
      .addChannelOption(option => option.setName('channel').setDescription('Channel to remove rule from').setRequired(true))
      .addStringOption(option => option.setName('thread').setDescription('Specific thread ID (optional)').setRequired(false)))
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('List all active media-only rules')),

].map(command => command.toJSON());

const rest = new REST({ version: '10' }).setToken(process.env.TOKEN);

(async () => {
  try {
    console.log('Registering global slash commands...');
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    console.log('Global slash commands registered!');
  } catch (error) {
    console.error(error);
  }
})();
