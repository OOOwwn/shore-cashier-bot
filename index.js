const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionFlagsBits, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const { google } = require('googleapis');

const TOKEN = process.env.TOKEN;
const GUILD_ID = process.env.GUILD_ID;
const CASHIER_CHANNEL_ID = process.env.CASHIER_CHANNEL_ID;
const STAFF_ROLE_ID = process.env.STAFF_ROLE_ID;
const VERIFY_CHANNEL_ID = process.env.VERIFY_CHANNEL_ID;
const VERIFY_LOG_CHANNEL_ID = process.env.VERIFY_LOG_CHANNEL_ID;
const CREW_ROLE_ID = process.env.CREW_ROLE_ID;
const SPREADSHEET_ID = process.env.SPREADSHEET_ID;

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);
const auth = new google.auth.GoogleAuth({
  credentials,
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});
const sheets = google.sheets({ version: 'v4', auth });

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
  await postVerifyPanel();
});

// ─── CASHIER PANEL ───────────────────────────────────────────
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
    .setThumbnail('https://media1.tenor.com/m/jJtQGNqjF3oAAAAC/oof-sqidward.gif')
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

// ─── VERIFY PANEL ────────────────────────────────────────────
async function postVerifyPanel() {
  const channel = await client.channels.fetch(VERIFY_CHANNEL_ID);
  if (!channel) return console.log('❌ Verify channel not found');

  const messages = await channel.messages.fetch({ limit: 10 });
  const existing = messages.find(m => m.author.id === client.user.id && m.embeds.length > 0);
  if (existing) return console.log('ℹ️ Verify panel already posted');

  const embed = new EmbedBuilder()
    .setTitle('✅  V E R I F Y')
    .setDescription(
      '**Verify yourself to unlock full server features.**\n\n' +
      '🔐 This helps us protect the server and keep it safe from spammers.\n\n' +
      '*Click* **Verify** *to get started!*'
    )
    .setColor(0x2ECC71)
    .setFooter({ text: 'Press the button below to verify.' });

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId('open_verify')
      .setLabel('Verify')
      .setEmoji('✅')
      .setStyle(ButtonStyle.Success)
  );

  await channel.send({ embeds: [embed], components: [row] });
  console.log('✅ Verify panel posted');
}

// ─── INTERACTIONS ─────────────────────────────────────────────
client.on('interactionCreate', async (interaction) => {

  // ── BUTTONS ──
  if (interaction.isButton()) {
    const { customId, user } = interaction;

    // Deposit modal
    if (customId === 'open_deposit') {
      const modal = new ModalBuilder()
        .setCustomId('deposit_modal')
        .setTitle('Deposit Ticket');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('player_name')
            .setLabel('ClubGG Username')
            .setPlaceholder('Enter your ClubGG username')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('amount')
            .setLabel('Amount')
            .setPlaceholder('Enter deposit amount')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('payment_method')
            .setLabel('Payment method')
            .setPlaceholder('Enter Payment Method')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('promo_code')
            .setLabel('Promo code (optional)')
            .setPlaceholder('Enter promo code if you have one')
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
        )
      );

      return interaction.showModal(modal);
    }

    // Withdrawal modal
    if (customId === 'open_withdrawal') {
      const modal = new ModalBuilder()
        .setCustomId('withdrawal_modal')
        .setTitle('Withdrawal Ticket');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('player_name')
            .setLabel('ClubGG Username')
            .setPlaceholder('Enter your ClubGG username')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('amount')
            .setLabel('Amount')
            .setPlaceholder('Enter withdrawal amount')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('payment_method')
            .setLabel('Payment method')
            .setPlaceholder('Enter Payment Method')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }

    // Close ticket
    if (customId === 'close_ticket') {
      await interaction.reply({ content: '🔒 Closing ticket in 5 seconds...' });
      setTimeout(() => interaction.channel.delete().catch(console.error), 5000);
    }

    // Open verify modal
    if (customId === 'open_verify') {
      const member = await interaction.guild.members.fetch(interaction.user.id);
      if (member.roles.cache.has(CREW_ROLE_ID)) {
        return interaction.reply({ content: '✅ You are already verified!', ephemeral: true });
      }

      const modal = new ModalBuilder()
        .setCustomId('verify_modal')
        .setTitle('Shore Verification');

      modal.addComponents(
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('clubgg_nickname')
            .setLabel('What is your ClubGG nickname?')
            .setPlaceholder('Enter your ClubGG nickname')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        ),
        new ActionRowBuilder().addComponents(
          new TextInputBuilder()
            .setCustomId('how_found')
            .setLabel('How did you find us?')
            .setPlaceholder('Socials / Friend / Discord / Other')
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
        )
      );

      return interaction.showModal(modal);
    }
  }

  // ── MODAL SUBMITS ──
  if (interaction.isModalSubmit()) {
    const { customId, user, guild } = interaction;

    // ── DEPOSIT MODAL ──
    if (customId === 'deposit_modal') {
      const playerName = interaction.fields.getTextInputValue('player_name');
      const amount = interaction.fields.getTextInputValue('amount');
      const paymentMethod = interaction.fields.getTextInputValue('payment_method');
      const promoCode = interaction.fields.getTextInputValue('promo_code') || 'None';

      const ticketChannel = await guild.channels.create({
        name: `deposit-${user.username}`,
        type: ChannelType.GuildText,
        parent: interaction.channel.parentId,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
        ],
      });

      const ticketEmbed = new EmbedBuilder()
        .setTitle('💵 Deposit Ticket')
        .addFields(
          { name: 'Discord', value: `${user}`, inline: true },
          { name: 'Player Name', value: playerName, inline: true },
          { name: 'Amount', value: amount, inline: true },
          { name: 'Payment Method', value: paymentMethod, inline: true },
          { name: 'Promo Code', value: promoCode, inline: true }
        )
        .setColor(0x2ECC71)
        .setTimestamp()
        .setFooter({ text: 'Click "Close Ticket" when resolved.' });

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({ content: `<@&${STAFF_ROLE_ID}> — new Deposit request from ${user}`, embeds: [ticketEmbed], components: [closeRow] });
      await interaction.reply({ content: `✅ Your deposit ticket has been created: ${ticketChannel}`, ephemeral: true });
    }

    // ── WITHDRAWAL MODAL ──
    if (customId === 'withdrawal_modal') {
      const playerName = interaction.fields.getTextInputValue('player_name');
      const amount = interaction.fields.getTextInputValue('amount');
      const paymentMethod = interaction.fields.getTextInputValue('payment_method');

      const ticketChannel = await guild.channels.create({
        name: `withdrawal-${user.username}`,
        type: ChannelType.GuildText,
        parent: interaction.channel.parentId,
        permissionOverwrites: [
          { id: guild.roles.everyone, deny: [PermissionFlagsBits.ViewChannel] },
          { id: user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: STAFF_ROLE_ID, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory] },
          { id: client.user.id, allow: [PermissionFlagsBits.ViewChannel, PermissionFlagsBits.SendMessages, PermissionFlagsBits.ReadMessageHistory, PermissionFlagsBits.ManageChannels] },
        ],
      });

      const ticketEmbed = new EmbedBuilder()
        .setTitle('💰 Withdrawal Ticket')
        .addFields(
          { name: 'Discord', value: `${user}`, inline: true },
          { name: 'Player Name', value: playerName, inline: true },
          { name: 'Amount', value: amount, inline: true },
          { name: 'Payment Method', value: paymentMethod, inline: true }
        )
        .setColor(0x9B59B6)
        .setTimestamp()
        .setFooter({ text: 'Click "Close Ticket" when resolved.' });

      const closeRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId('close_ticket')
          .setLabel('Close Ticket')
          .setEmoji('🔒')
          .setStyle(ButtonStyle.Danger)
      );

      await ticketChannel.send({ content: `<@&${STAFF_ROLE_ID}> — new Withdrawal request from ${user}`, embeds: [ticketEmbed], components: [closeRow] });
      await interaction.reply({ content: `✅ Your withdrawal ticket has been created: ${ticketChannel}`, ephemeral: true });
    }

    // ── VERIFY MODAL ──
    if (customId === 'verify_modal') {
      const clubggNickname = interaction.fields.getTextInputValue('clubgg_nickname');
      const howFound = interaction.fields.getTextInputValue('how_found');

      const logChannel = await client.channels.fetch(VERIFY_LOG_CHANNEL_ID);
      const logEmbed = new EmbedBuilder()
        .setTitle('📋 New Verification Request')
        .setDescription(`Staff: use \`!verify @${user.username}\` to approve this member.`)
        .addFields(
          { name: 'Discord', value: `${user} (${user.username})`, inline: true },
          { name: 'Discord ID', value: user.id, inline: true },
          { name: 'ClubGG Nickname', value: clubggNickname, inline: false },
          { name: 'How They Found Us', value: howFound, inline: false },
          { name: 'Date', value: new Date().toLocaleString(), inline: false }
        )
        .setColor(0xF1C40F)
        .setTimestamp();

      await logChannel.send({ embeds: [logEmbed] });

      try {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: 'Sheet1!A:F',
          valueInputOption: 'RAW',
          resource: {
            values: [[
              user.username,
              user.id,
              clubggNickname,
              howFound,
              new Date().toLocaleString(),
              'PENDING'
            ]]
          }
        });
      } catch (err) {
        console.error('❌ Google Sheets error:', err.message);
      }

      await interaction.reply({
        content: '✅ Your verification request has been submitted! A staff member will review and approve you shortly.',
        ephemeral: true
      });
    }
  }
});

// ─── !verify COMMAND ─────────────────────────────────────────
client.on('messageCreate', async (message) => {
  if (message.author.bot) return;
  if (!message.content.startsWith('!verify')) return;

  const staffMember = await message.guild.members.fetch(message.author.id);
  if (!staffMember.roles.cache.has(STAFF_ROLE_ID)) {
    return message.reply('❌ You do not have permission to use this command.');
  }

  const target = message.mentions.members.first();
  if (!target) {
    return message.reply('❌ Please mention a user. Usage: `!verify @username`');
  }

  if (target.roles.cache.has(CREW_ROLE_ID)) {
    return message.reply(`❌ ${target} is already verified.`);
  }

  await target.roles.add(CREW_ROLE_ID);

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Sheet1!A:F',
    });
    const rows = response.data.values || [];
    const rowIndex = rows.findIndex(row => row[1] === target.id && row[5] === 'PENDING');
    if (rowIndex !== -1) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `Sheet1!F${rowIndex + 1}`,
        valueInputOption: 'RAW',
        resource: { values: [['APPROVED']] }
      });
    }
  } catch (err) {
    console.error('❌ Google Sheets update error:', err.message);
  }

  const logChannel = await client.channels.fetch(VERIFY_LOG_CHANNEL_ID);
  await logChannel.send(`✅ ${target} has been verified by ${message.author}. **crew** role assigned.`);

  try {
    await target.send(`✅ You have been verified in **${message.guild.name}**! Welcome to the crew 🌊`);
  } catch (e) {}

  await message.reply(`✅ ${target} has been verified and given the **crew** role!`);
});

client.login(TOKEN);
