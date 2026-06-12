const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits } = require('discord.js');

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CASHIER_CHANNEL_ID = process.env.CASHIER_CHANNEL_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ]
});

client.once('ready', async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  await postCashierPanel();
});

async function postCashierPanel() {
  const channel = await client.channels.fetch(CASHIER_CHANNEL_ID);
  if (!channel) return console.log('❌ Cashier channel not found');

  const messages = await channel.messages.fetch({ limit: 10 });
  const existing = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);
  if (existing) return console.log('ℹ️ Cashier panel already posted');

  const embed = new EmbedBuilder()
    .setTitle('💵  C A S H I E R')
    .setDescription(
      '**Choose the type of ticket you want to open.**\n\n' +
      '💵 **Deposit** — open a deposit ticket\n' +
      '💰 **Withdrawal** — open a withdrawal ticket\n\n' +
      '*Fill in the details so we can process everything faster and save you time.*'
    )
    .setColor(0x9B59B6)
    .setFooter({ text: 'Press one of the buttons below to continue.' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_deposit')
      .setLabel('Deposit')
      .setEmoji('💵')
      .setStyle(ButtonStyle.Success),
    new ButtonBuilder()
      .setCustomId('open_withdrawal')
      .setLabel('Withdrawal')
      .setEmoji('💰')
      .setStyle(ButtonStyle.Primary)
  );

  await channel.send({ embeds: [embed], components: [row] });
  console.log('✅ Cashier panel posted');
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isButton()) return;

  const { customId, user, guild } = interaction;

  if (customId === 'open_deposit' || customId === 'open_withdrawal') {
    const type = customId === 'open_deposit' ? 'Deposit' : 'Withdrawal';
    const emoji = type === 'Deposit' ? '💵' : '💰';

    const existing = guild.channels.cache.find(
      c => c.name === `${type.toLowerCase()}-${user.username.toLowerCase()}` && c.type === ChannelType.GuildText
    );

    if (existing) {
      return interaction.reply({
        content: `❌ You already have an open ${type} ticket: ${existing}`,
        ephemeral: true
      });
    }

    const ticketChannel = await guild.channels.create({
      name: `${type.toLowerCase()}-${user.username}`,
      type: ChannelType.GuildText,
      parent: interaction.channel.parentId,
      permissionOverwrites: [
        {
          id: guild.roles.everyone,
          deny: [PermissionFlagsBits.ViewChannel],
        },
        {
          id: user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
        {
          id: STAFF_ROLE_ID,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory],
        },
        {
          id: client.user.id,
          allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels],
        },
      ],
    });

    const ticketEmbed = new EmbedBuilder()
      .setTitle(`${emoji} ${type} Ticket`)
      .setDescription(
        type === 'Deposit'
          ? `Hey ${user}! 👋\n\nPlease provide the following:\n\n• **Club ID**\n• **Amount** you wish to deposit\n• **Payment method** (e.g. Venmo, CashApp, Crypto)\n\nA staff member will assist you shortly.`
          : `Hey ${user}! 👋\n\nPlease provide the following:\n\n• **Club ID**\n• **Amount** you wish to withdraw\n• **Preferred payout method** (e.g. Venmo, CashApp, Crypto)\n\nA staff member will assist you shortly.`
      )
      .setColor(type === 'Deposit' ? 0x2ECC71 : 0x9B59B6)
      .setFooter({ text: 'Click "Close Ticket" when your request is resolved.' });

    const closeRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder()
        .setCustomId('close_ticket')
        .setLabel('Close Ticket')
        .setEmoji('🔒')
        .setStyle(ButtonStyle.Danger)
    );

    await ticketChannel.send({ content: `<@&${STAFF_ROLE_ID}> — new ${type} request from ${user}`, embeds: [ticketEmbed], components: [closeRow] });

    await interaction.reply({
      content: `✅ Your ${type} ticket has been created: ${ticketChannel}`,
      ephemeral: true
    });
  }

  if (customId === 'close_ticket') {
    await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
    setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
  }
});

client.login(TOKEN);
