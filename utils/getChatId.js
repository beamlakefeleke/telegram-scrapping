/**
 * Utility script to get Telegram Chat ID
 * Run: node utils/getChatId.js
 * 
 * This script helps you find the chat ID for your TARGET_CHANNEL
 */

import { Telegraf } from 'telegraf';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env') });

const botToken = process.env.BOT_TOKEN;

if (!botToken) {
  console.error('❌ BOT_TOKEN not found in .env file');
  console.error('Please add your BOT_TOKEN to the .env file');
  process.exit(1);
}

const bot = new Telegraf(botToken);

console.log('🤖 Bot is running...');
console.log('📋 Instructions:');
console.log('1. Start a chat with your bot or add it to a channel/group');
console.log('2. Send any message to the bot/channel/group');
console.log('3. The chat ID will be displayed below\n');

// Listen for any message
bot.on('message', async (ctx) => {
  const chat = ctx.chat;
  const chatType = chat.type; // 'private', 'group', 'supergroup', 'channel'
  
  console.log('\n✅ Chat ID Found!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Chat Type: ${chatType}`);
  
  if (chat.title) {
    console.log(`Chat Title: ${chat.title}`);
  }
  
  if (chat.username) {
    console.log(`Chat Username: @${chat.username}`);
  }
  
  console.log(`\n📌 Chat ID: ${chat.id}`);
  console.log('\n💡 Add this to your .env file:');
  console.log(`TARGET_CHANNEL=${chat.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  
  // Send confirmation message
  await ctx.reply(
    `✅ Chat ID: \`${chat.id}\`\n\n` +
    `Add this to your .env file:\n` +
    `TARGET_CHANNEL=${chat.id}`,
    { parse_mode: 'Markdown' }
  );
});

// Handle channel posts (for channels)
bot.on('channel_post', async (ctx) => {
  const chat = ctx.channelChat;
  
  console.log('\n✅ Channel Chat ID Found!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Chat Type: channel`);
  
  if (chat.title) {
    console.log(`Channel Title: ${chat.title}`);
  }
  
  if (chat.username) {
    console.log(`Channel Username: @${chat.username}`);
  }
  
  console.log(`\n📌 Chat ID: ${chat.id}`);
  console.log('\n💡 Add this to your .env file:');
  console.log(`TARGET_CHANNEL=${chat.id}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
});

// Handle errors
bot.catch((err, ctx) => {
  console.error('Error:', err);
});

// Start bot
bot.launch().then(() => {
  console.log('✅ Bot started successfully!\n');
}).catch((error) => {
  console.error('❌ Failed to start bot:', error.message);
  process.exit(1);
});

// Graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));

