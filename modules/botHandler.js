/**
 * Bot Handler module
 * Handles forwarding messages via Telegram Bot API using Telegraf
 */

import { Telegraf } from 'telegraf';
import logger from '../utils/logger.js';

/**
 * BotHandler class for forwarding messages
 */
class BotHandler {
  constructor(botToken) {
    this.botToken = botToken;
    this.bot = null;
    this.isReady = false;
  }

  /**
   * Initialize bot
   */
  async initialize() {
    try {
      logger.info('Initializing Telegram bot...');
      
      this.bot = new Telegraf(this.botToken);
      
      // Test bot connection
      const me = await this.bot.telegram.getMe();
      logger.info(`Bot initialized: @${me.username} (${me.first_name})`);
      
      this.isReady = true;
      return true;
    } catch (error) {
      logger.error('Error initializing bot:', error);
      this.isReady = false;
      throw error;
    }
  }

  /**
   * Validate and get chat info
   */
  async validateChat(targetChannel) {
    try {
      // If it's a numeric ID (chat ID), it should work directly
      if (/^-?\d+$/.test(targetChannel)) {
        logger.debug(`Using chat ID: ${targetChannel}`);
        return targetChannel;
      }

      // If it starts with @, remove it
      const username = targetChannel.replace('@', '');
      
      // Check if it's the bot's own username (invalid)
      const me = await this.bot.telegram.getMe();
      if (username.toLowerCase() === me.username.toLowerCase()) {
        throw new Error(
          `Cannot send messages to bot's own username (@${username}).\n` +
          `Please use one of the following:\n` +
          `1. A channel username (e.g., @my_jobs_channel) - bot must be admin\n` +
          `2. A chat ID (e.g., -1001234567890) - get from @userinfobot\n` +
          `3. Your personal chat ID with the bot`
        );
      }

      // Try to get chat info to validate
      try {
        const chat = await this.bot.telegram.getChat(`@${username}`);
        logger.debug(`Validated chat: ${chat.title || chat.username} (ID: ${chat.id})`);
        return chat.id.toString();
      } catch (chatError) {
        // If getChat fails, still try to send (might be a private chat)
        logger.warn(`Could not validate chat @${username}, attempting to send anyway...`);
        return `@${username}`;
      }
    } catch (error) {
      logger.error('Error validating chat:', error);
      throw error;
    }
  }

  /**
   * Forward message to target channel
   * Note: Bot can't forward messages directly, so we'll send a formatted message instead
   */
  async forwardMessage(message, targetChannel) {
    try {
      if (!this.isReady) {
        throw new Error('Bot not initialized');
      }

      // Validate and get proper chat identifier
      const chatId = await this.validateChat(targetChannel);

      // Extract message content
      const text = this.extractMessageText(message);
      const messageId = message.id;
      const date = message.date ? new Date(message.date * 1000).toLocaleString() : 'Unknown date';

      // Format message for forwarding
      const formattedText = this.formatMessage(text, messageId, date, message);

      // Send to target channel
      await this.bot.telegram.sendMessage(chatId, formattedText, {
        parse_mode: 'HTML',
        disable_web_page_preview: false
      });

      logger.info(`Message ${messageId} forwarded to ${chatId}`);
      return true;
    } catch (error) {
      logger.error('Error forwarding message:', error);
      
      // Provide helpful error messages
      if (error.response?.error_code === 400) {
        if (error.response.description?.includes('chat not found')) {
          logger.error(`\n❌ Target chat not found: ${targetChannel}`);
          logger.error('\n📋 Solutions:');
          logger.error('1. Create a channel and add the bot as admin:');
          logger.error('   - Create a new channel in Telegram');
          logger.error('   - Add your bot (@myjobs1bot) as an administrator');
          logger.error('   - Use the channel username (e.g., @my_jobs_channel) in TARGET_CHANNEL');
          logger.error('\n2. Get your chat ID:');
          logger.error('   - Start a chat with @userinfobot');
          logger.error('   - Forward a message from your target channel/group to @userinfobot');
          logger.error('   - It will show the chat ID (e.g., -1001234567890)');
          logger.error('   - Use that ID in TARGET_CHANNEL');
          logger.error('\n3. Use your personal chat ID:');
          logger.error('   - Start a chat with your bot');
          logger.error('   - Send /start to the bot');
          logger.error('   - Get your chat ID from @userinfobot');
          logger.error('   - Use that ID in TARGET_CHANNEL');
        } else if (error.response.description?.includes('not enough rights')) {
          logger.error(`Bot doesn't have permission to send messages to ${targetChannel}`);
          logger.error('Make sure the bot is added as an administrator to the channel/group');
        }
      }
      
      throw error;
    }
  }

  /**
   * Extract text from message object
   */
  extractMessageText(message) {
    if (!message) return 'No content';

    let text = '';

    if (message.message) {
      text = message.message;
    } else if (message.text) {
      text = message.text;
    } else if (message.caption) {
      text = message.caption;
    } else {
      text = 'Message with no text content';
    }

    return text || 'No content';
  }

  /**
   * Format message for sending
   */
  formatMessage(text, messageId, date, originalMessage) {
    // Escape HTML special characters
    const escapeHtml = (str) => {
      return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    };

    const escapedText = escapeHtml(text);
    
    // Build formatted message
    let formatted = `<b>💼 New Job Post</b>\n\n`;
    formatted += `${escapedText}\n\n`;
    formatted += `<i>📅 Posted: ${date}</i>\n`;
    formatted += `<i>🆔 Message ID: ${messageId}</i>`;

    // Add source channel info if available
    if (originalMessage?.peerId) {
      formatted += `\n<i>📢 Source: Channel</i>`;
    }

    return formatted;
  }

  /**
   * Send custom message to target channel
   */
  async sendMessage(text, targetChannel) {
    try {
      if (!this.isReady) {
        throw new Error('Bot not initialized');
      }

      await this.bot.telegram.sendMessage(targetChannel, text, {
        parse_mode: 'HTML'
      });

      logger.info(`Custom message sent to ${targetChannel}`);
      return true;
    } catch (error) {
      logger.error('Error sending message:', error);
      throw error;
    }
  }

  /**
   * Stop bot
   */
  async stop() {
    try {
      if (this.bot && this.isReady) {
        // Check if bot is actually running before stopping
        try {
          this.bot.stop('SIGINT');
          this.isReady = false;
          logger.info('Bot stopped');
        } catch (stopError) {
          // If bot.stop() fails, it might not be running - that's okay
          if (!stopError.message.includes('not running')) {
            throw stopError;
          }
          logger.debug('Bot was not running, skipping stop');
          this.isReady = false;
        }
      }
    } catch (error) {
      // Only log if it's not the "not running" error
      if (!error.message.includes('not running')) {
        logger.error('Error stopping bot:', error);
      }
      this.isReady = false;
    }
  }
}

export default BotHandler;

