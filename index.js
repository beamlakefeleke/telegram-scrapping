/**
 * Main entry point for Telegram Job Scraper
 * Monitors a Telegram channel for job posts and forwards filtered posts via bot
 */

import config from './config.js';
import logger from './utils/logger.js';
import TelegramChannelClient from './modules/telegramClient.js';
import BotHandler from './modules/botHandler.js';
import JobFilter from './modules/jobFilter.js';
import MessageStorage from './utils/storage.js';

/**
 * Main application class
 */
class JobScraperApp {
  constructor() {
    this.telegramClient = null;
    this.botHandler = null;
    this.jobFilter = null;
    this.storage = null;
    this.isRunning = false;
    this.pollInterval = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
  }

  /**
   * Initialize all components
   */
  async initialize() {
    try {
      logger.info('🚀 Initializing Telegram Job Scraper...');
      logger.info(`📋 Configuration:`);
      logger.info(`   Source Channel: ${config.sourceChannel}`);
      logger.info(`   Target Channel: ${config.targetChannel}`);
      logger.info(`   Keywords: ${config.keywords.length} keywords`);
      logger.info(`   Poll Interval: ${config.pollInterval / 1000}s`);

      // Initialize storage
      this.storage = new MessageStorage(config.storagePath);
      logger.info(`📦 Storage initialized (${this.storage.getCount()} processed messages)`);

      // Initialize job filter
      this.jobFilter = new JobFilter(config.keywords);

      // Initialize Telegram client
      this.telegramClient = new TelegramChannelClient(
        config.apiId,
        config.apiHash,
        config.sessionString
      );
      await this.telegramClient.connect();

      // Initialize bot handler
      this.botHandler = new BotHandler(config.botToken);
      await this.botHandler.initialize();

      logger.info('✅ All components initialized successfully');
      return true;
    } catch (error) {
      logger.error('❌ Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Process a single message
   */
  async processMessage(message) {
    try {
      const messageId = message.id;

      // Skip if already processed
      if (this.storage.isProcessed(messageId)) {
        logger.debug(`Message ${messageId} already processed, skipping`);
        return false;
      }

      // Filter message
      if (!this.jobFilter.isJobPost(message)) {
        logger.debug(`Message ${messageId} doesn't match job criteria, skipping`);
        // Mark as processed even if not a job to avoid reprocessing
        this.storage.markProcessed(messageId);
        return false;
      }

      // Forward message
      logger.info(`📤 Forwarding job post (ID: ${messageId})...`);
      await this.botHandler.forwardMessage(message, config.targetChannel);

      // Mark as processed
      this.storage.markProcessed(messageId);
      logger.info(`✅ Message ${messageId} processed and forwarded successfully`);

      return true;
    } catch (error) {
      logger.error(`Error processing message ${message.id}:`, error);
      return false;
    }
  }

  /**
   * Poll for new messages
   */
  async pollForMessages() {
    try {
      if (!this.isRunning) {
        return;
      }

      logger.debug(`🔍 Polling for new messages in ${config.sourceChannel}...`);

      // Get new messages
      const messages = await this.telegramClient.getNewMessages(
        config.sourceChannel,
        10
      );

      if (messages.length === 0) {
        logger.debug('No new messages found');
        return;
      }

      logger.info(`📨 Found ${messages.length} new message(s)`);

      // Process each message
      for (const message of messages) {
        await this.processMessage(message);
        // Small delay between processing to avoid rate limits
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

      // Reset reconnect attempts on successful poll
      this.reconnectAttempts = 0;

      // Cleanup storage periodically
      if (Math.random() < 0.1) { // 10% chance on each poll
        this.storage.cleanup();
      }
    } catch (error) {
      logger.error('Error polling for messages:', error);
      
      // Attempt reconnection
      if (error.message.includes('not connected') || error.message.includes('connection')) {
        await this.handleReconnection();
      }
    }
  }

  /**
   * Handle reconnection logic
   */
  async handleReconnection() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Max reconnection attempts (${this.maxReconnectAttempts}) reached. Stopping...`);
      await this.stop();
      return;
    }

    this.reconnectAttempts++;
    logger.warn(`Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);

    try {
      await this.telegramClient.reconnect();
      logger.info('Reconnection successful');
      this.reconnectAttempts = 0;
    } catch (error) {
      logger.error('Reconnection failed:', error);
      
      // Wait before next attempt (exponential backoff)
      const delay = Math.min(5000 * Math.pow(2, this.reconnectAttempts - 1), 60000);
      logger.info(`Waiting ${delay / 1000}s before next reconnection attempt...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  /**
   * Start the application
   */
  async start() {
    try {
      await this.initialize();

      // Do initial scan of recent messages
      logger.info('🔍 Performing initial scan of recent messages...');
      const recentMessages = await this.telegramClient.getRecentMessages(
        config.sourceChannel,
        50
      );
      logger.info(`📊 Initial scan found ${recentMessages.length} recent messages`);

      // Process recent messages (in reverse to process oldest first)
      for (const message of recentMessages.reverse()) {
        await this.processMessage(message);
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      // Start polling
      this.isRunning = true;
      logger.info(`🔄 Starting polling every ${config.pollInterval / 1000} seconds...`);

      // Poll immediately, then set interval
      await this.pollForMessages();
      this.pollInterval = setInterval(() => {
        this.pollForMessages().catch(error => {
          logger.error('Error in polling interval:', error);
        });
      }, config.pollInterval);

      logger.info('✅ Job scraper is now running!');
      logger.info('Press Ctrl+C to stop');

    } catch (error) {
      logger.error('❌ Failed to start application:', error);
      await this.stop();
      process.exit(1);
    }
  }

  /**
   * Stop the application
   */
  async stop() {
    try {
      logger.info('🛑 Stopping application...');
      
      this.isRunning = false;

      // Clear polling interval
      if (this.pollInterval) {
        clearInterval(this.pollInterval);
        this.pollInterval = null;
      }

      // Disconnect clients
      if (this.telegramClient) {
        await this.telegramClient.disconnect();
      }

      if (this.botHandler) {
        await this.botHandler.stop();
      }

      logger.info('✅ Application stopped');
    } catch (error) {
      logger.error('Error stopping application:', error);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const app = new JobScraperApp();

  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    logger.info('\n signal received (SIGINT)');
    await app.stop();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    logger.info('\n signal received (SIGTERM)');
    await app.stop();
    process.exit(0);
  });

  // Handle uncaught errors
  process.on('unhandledRejection', (error) => {
    logger.error('Unhandled promise rejection:', error);
  });

  process.on('uncaughtException', (error) => {
    logger.error('Uncaught exception:', error);
    app.stop().then(() => process.exit(1));
  });

  // Start the application
  await app.start();
}

// Run the application
main().catch(error => {
  logger.error('Fatal error:', error);
  process.exit(1);
});

