const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent, GatewayIntentBits.GuildMessageReactions] });

const stickyMessages = {};

// Load/save mediaonly rules
function loadMediaOnly() {
  try {
    if (!fs.existsSync('mediaonly.json')) return {};
    return JSON.parse(fs.readFileSync('mediaonly.json', 'utf8'));
  } catch { return {}; }
}

function saveMediaOnly(data) {
  try {
    fs.writeFileSync('mediaonly.json', JSON.stringify(data, null, 2));
  } catch (err) { console.error('Save error:', err); }
}

let mediaOnlyRules = loadMediaOnly();

client.on('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async interaction => {

  // /member-log command
  if (interaction.isChatInputCommand() && interaction.commandName === 'member-log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to use this command.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('Recently Joined Members')
      .setDescription('No content yet.')
      .setColor(0x5865F2);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('edit_member_log')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.reply({ embeds: [embed], components: [row] });
  }

  // /sticky-log command
  if (interaction.isChatInputCommand() && interaction.commandName === 'sticky-log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to use this command.', ephemeral: true });
    }

    const embed = new EmbedBuilder()
      .setTitle('📌 Sticky Log')
      .setDescription('No content yet.')
      .setColor(0xED4245);

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('edit_sticky_log')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary)
    );

    const sent = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

    stickyMessages[sent.id] = {
      channelId: interaction.channelId,
      title: '📌 Sticky Log',
      content: 'No content yet.',
      imageUrl: null,
      footer: null
    };
  }

  // /mediaonly command
  if (interaction.isChatInputCommand() && interaction.commandName === 'mediaonly') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission.', ephemeral: true });
    }

    const sub = interaction.options.getSubcommand();

    if (sub === 'add') {
      const channel = interaction.options.getChannel('channel');
      const thread = interaction.options.getString('thread');
      const key = thread ? `${channel.id}-${thread}` : channel.id;

      if (!mediaOnlyRules[interaction.guildId]) mediaOnlyRules[interaction.guildId] = {};
      mediaOnlyRules[interaction.guildId][key] = {
        channelId: channel.id,
        threadId: thread || null,
        channelName: channel.name
      };
      saveMediaOnly(mediaOnlyRules);

      await interaction.reply({ 
        content: `✅ Media-only rule added for ${channel}${thread ? ` thread \`${thread}\`` : ''}`, 
        ephemeral: true 
      });
    }

    if (sub === 'remove') {
      const channel = interaction.options.getChannel('channel');
      const thread = interaction.options.getString('thread');
      const key = thread ? `${channel.id}-${thread}` : channel.id;

      if (!mediaOnlyRules[interaction.guildId] || !mediaOnlyRules[interaction.guildId][key]) {
        return interaction.reply({ content: `❌ No rule found for that channel/thread.`, ephemeral: true });
      }

      delete mediaOnlyRules[interaction.guildId][key];
      saveMediaOnly(mediaOnlyRules);

      await interaction.reply({ 
        content: `✅ Media-only rule removed for ${channel}${thread ? ` thread \`${thread}\`` : ''}`, 
        ephemeral: true 
      });
    }

    if (sub === 'list') {
      const rules = mediaOnlyRules[interaction.guildId];
      if (!rules || Object.keys(rules).length === 0) {
        return interaction.reply({ content: '❌ No media-only rules set up yet.', ephemeral: true });
      }

      const list = Object.values(rules)
        .map(r => `• <#${r.channelId}>${r.threadId ? ` thread \`${r.threadId}\`` : ''}`)
        .join('\n');

      await interaction.reply({ content: `📋 **Media-Only Rules:**\n${list}`, ephemeral: true });
    }
  }

  // Button: edit_member_log
  if (interaction.isButton() && interaction.customId === 'edit_member_log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to edit this.', ephemeral: true });
    }

    const messageId = interaction.message.id;
    const currentTitle = interaction.message.embeds[0]?.title || 'Recently Joined Members';
    const currentText = interaction.message.embeds[0]?.description || '';

    const modal = new ModalBuilder()
      .setCustomId(`member_log_modal:${messageId}`)
      .setTitle('Edit Member Log');

    const titleInput = new TextInputBuilder()
      .setCustomId('member_log_title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter title here...')
      .setValue(currentTitle)
      .setRequired(true);

    const contentInput = new TextInputBuilder()
      .setCustomId('log_content')
      .setLabel('Log Content')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter member log details here...')
      .setValue(currentText)
      .setRequired(true);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(contentInput)
    );

    await interaction.showModal(modal);
  }

  // Button: edit_sticky_log
  if (interaction.isButton() && interaction.customId === 'edit_sticky_log') {
    if (!interaction.memberPermissions.has('Administrator')) {
      return interaction.reply({ content: '❌ You need Administrator permission to edit this.', ephemeral: true });
    }

    const messageId = interaction.message.id;
    const currentTitle = interaction.message.embeds[0]?.title || '📌 Sticky Log';
    const currentText = interaction.message.embeds[0]?.description || '';
    const currentImage = interaction.message.embeds[0]?.image?.url || '';
    const currentFooter = interaction.message.embeds[0]?.footer?.text || '';

    const modal = new ModalBuilder()
      .setCustomId(`sticky_log_modal:${messageId}`)
      .setTitle('Edit Sticky Log');

    const titleInput = new TextInputBuilder()
      .setCustomId('sticky_log_title')
      .setLabel('Title')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter title here...')
      .setValue(currentTitle)
      .setRequired(true);

    const contentInput = new TextInputBuilder()
      .setCustomId('sticky_log_content')
      .setLabel('Content')
      .setStyle(TextInputStyle.Paragraph)
      .setPlaceholder('Enter sticky log details here...')
      .setValue(currentText)
      .setRequired(true);

    const imageInput = new TextInputBuilder()
      .setCustomId('sticky_log_image')
      .setLabel('Image URL (optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('https://example.com/image.png')
      .setValue(currentImage)
      .setRequired(false);

    const footerInput = new TextInputBuilder()
      .setCustomId('sticky_log_footer')
      .setLabel('Footer (optional)')
      .setStyle(TextInputStyle.Short)
      .setPlaceholder('Enter footer text here...')
      .setValue(currentFooter)
      .setRequired(false);

    modal.addComponents(
      new ActionRowBuilder().addComponents(titleInput),
      new ActionRowBuilder().addComponents(contentInput),
      new ActionRowBuilder().addComponents(imageInput),
      new ActionRowBuilder().addComponents(footerInput)
    );

    await interaction.showModal(modal);
  }

  // Modal: member_log_modal
  if (interaction.isModalSubmit() && interaction.customId.startsWith('member_log_modal:')) {
    const title = interaction.fields.getTextInputValue('member_log_title');
    const content = interaction.fields.getTextInputValue('log_content');

    const updatedEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(content)
      .setColor(0x5865F2)
      .setFooter({ text: `Last edited by ${interaction.user.username}` });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('edit_member_log')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary)
    );

    await interaction.update({ embeds: [updatedEmbed], components: [row] });
  }

  // Modal: sticky_log_modal
  if (interaction.isModalSubmit() && interaction.customId.startsWith('sticky_log_modal:')) {
    const originalMessageId = interaction.customId.split(':')[1];
    const title = interaction.fields.getTextInputValue('sticky_log_title');
    const content = interaction.fields.getTextInputValue('sticky_log_content');
    const imageUrl = interaction.fields.getTextInputValue('sticky_log_image').trim();
    const footer = interaction.fields.getTextInputValue('sticky_log_footer').trim();
    const channelId = interaction.channelId;

    if (stickyMessages[originalMessageId]) {
      try {
        const oldMsg = await interaction.channel.messages.fetch(originalMessageId);
        await oldMsg.delete();
      } catch (e) {}
      delete stickyMessages[originalMessageId];
    }

    await interaction.deferUpdate();

    const updatedEmbed = new EmbedBuilder()
      .setTitle(title)
      .setDescription(content)
      .setColor(0xED4245);

    if (imageUrl) updatedEmbed.setImage(imageUrl);
    if (footer) updatedEmbed.setFooter({ text: footer });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('edit_sticky_log')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary)
    );

    const newMsg = await interaction.channel.send({ embeds: [updatedEmbed], components: [row] });

    stickyMessages[newMsg.id] = {
      channelId,
      title,
      content,
      imageUrl: imageUrl || null,
      footer: footer || null
    };
  }
});

// Message handler
client.on('messageCreate', async message => {
  if (message.author.bot) return;

  const guildId = message.guildId;
  const channelId = message.channelId;
  const parentId = message.channel.parentId;

  // Media only check
  const rules = mediaOnlyRules[guildId];
  if (rules) {
    const threadKey = parentId ? `${parentId}-${channelId}` : null;
    const ruleKey = rules[channelId] ? channelId :
                    (threadKey && rules[threadKey]) ? threadKey :
                    rules[parentId] ? parentId : null;

    if (ruleKey) {
      const member = message.member;
      const isExempt = member.permissions.has('Administrator') ||
                       member.permissions.has('ManageMessages') ||
                       member.permissions.has('ManageChannels');

      if (!isExempt) {
        const hasImage = message.attachments.some(a =>
          a.contentType && a.contentType.startsWith('image/')
        );

        if (!hasImage) {
          const tryDelete = async (attempts) => {
            try {
              await message.delete();
            } catch (err) {
              if (attempts > 0) {
                setTimeout(() => tryDelete(attempts - 1), 1000);
              } else {
                console.error('Delete error:', err);
              }
            }
          };
          setTimeout(() => tryDelete(3), 1000);
          return;
        }
      }
    }
  }

  // Sticky behavior
  const channelStickies = Object.entries(stickyMessages).filter(
    ([, data]) => data.channelId === channelId
  );

  if (channelStickies.length === 0) return;

  for (const [msgId, sticky] of channelStickies) {
    if (msgId === message.channel.lastMessageId) continue;

    try {
      const oldMsg = await message.channel.messages.fetch(msgId);
      await oldMsg.delete();
    } catch (e) {
      delete stickyMessages[msgId];
      continue;
    }

    const embed = new EmbedBuilder()
      .setTitle(sticky.title)
      .setDescription(sticky.content)
      .setColor(0xED4245);

    if (sticky.imageUrl) embed.setImage(sticky.imageUrl);
    if (sticky.footer) embed.setFooter({ text: sticky.footer });

    const row = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('edit_sticky_log')
        .setLabel('Edit')
        .setStyle(ButtonStyle.Primary)
    );

    const newMsg = await message.channel.send({ embeds: [embed], components: [row] });

    delete stickyMessages[msgId];
    stickyMessages[newMsg.id] = {
      channelId,
      title: sticky.title,
      content: sticky.content,
      imageUrl: sticky.imageUrl,
      footer: sticky.footer
    };
  }
});

client.login(process.env.TOKEN)
