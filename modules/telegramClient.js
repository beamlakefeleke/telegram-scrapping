/**
 * Telegram Client module
 * Handles MTProto connection and channel monitoring using GramJS
 */

import { TelegramClient } from 'telegram';
import { StringSession } from 'telegram/sessions/index.js';
import readline from 'readline';
import logger from '../utils/logger.js';

/**
 * TelegramClient class for monitoring channels
 */
class TelegramChannelClient {
  constructor(apiId, apiHash, sessionString = '') {
    this.apiId = apiId;
    this.apiHash = apiHash;
    this.sessionString = sessionString;
    this.client = null;
    this.isConnected = false;
    this.lastMessageId = 0;
  }

  /**
   * Get user input from console
   */
  async getInput(prompt) {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    return new Promise((resolve) => {
      rl.question(prompt, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  /**
   * Sign in to Telegram (if not already authorized)
   */
  async signIn() {
    try {
      logger.info('Checking authorization status...');
      
      if (await this.client.isUserAuthorized()) {
        logger.info('Already authorized');
        return true;
      }

      logger.warn('Not authorized. Starting sign-in process...');
      logger.info('You will need to provide your phone number and verification code.');

      // Get phone number
      const phoneNumber = await this.getInput('Enter your phone number (with country code, e.g., +1234567890): ');
      
      if (!phoneNumber) {
        throw new Error('Phone number is required');
      }

      // Send code
      logger.info('Sending verification code...');
      const { phoneCodeHash, isCodeViaApp } = await this.client.sendCode(
        { apiId: this.apiId, apiHash: this.apiHash },
        phoneNumber
      );

      if (isCodeViaApp) {
        logger.info('Code will be sent via Telegram app');
      } else {
        logger.info('Code will be sent via SMS');
      }

      // Sign in - phoneCode must be a function that returns the code
      logger.info('Signing in...');
      await this.client.signInUser(
        { apiId: this.apiId, apiHash: this.apiHash },
        {
          phoneNumber,
          phoneCodeHash,
          phoneCode: async () => {
            const code = await this.getInput('Enter the verification code you received: ');
            if (!code) {
              throw new Error('Verification code is required');
            }
            return code;
          }
        }
      );

      logger.info('✅ Successfully signed in!');

      // Save session string
      const newSessionString = this.client.session.save();
      logger.warn('\n⚠️  IMPORTANT: Save this session string to your .env file:');
      logger.warn(`SESSION_STRING=${newSessionString}\n`);

      return true;
    } catch (error) {
      if (error.message.includes('PHONE_CODE_INVALID')) {
        throw new Error('Invalid verification code. Please try again.');
      } else if (error.message.includes('PHONE_NUMBER_INVALID')) {
        throw new Error('Invalid phone number format. Use format: +1234567890');
      } else if (error.message.includes('PHONE_NUMBER_UNOCCUPIED')) {
        throw new Error('Phone number not registered with Telegram.');
      } else if (error.message.includes('SESSION_PASSWORD_NEEDED') || error.message.includes('PASSWORD_HASH_INVALID')) {
        logger.warn('Two-factor authentication is enabled. Please provide your password.');
        const password = await this.getInput('Enter your 2FA password: ');
        if (!password) {
          throw new Error('2FA password is required');
        }
        await this.client.signInWithPassword(
          { apiId: this.apiId, apiHash: this.apiHash },
          {
            password: async (hint) => {
              if (hint) {
                logger.info(`Password hint: ${hint}`);
              }
              return password;
            },
            onError: async (err) => {
              logger.error('Error during 2FA sign-in:', err.message);
              return false; // Continue retrying
            }
          }
        );
        logger.info('✅ Successfully signed in with 2FA!');
        const newSessionString = this.client.session.save();
        logger.warn('\n⚠️  IMPORTANT: Save this session string to your .env file:');
        logger.warn(`SESSION_STRING=${newSessionString}\n`);
        return true;
      }
      throw error;
    }
  }

  /**
   * Initialize and connect to Telegram
   */
  async connect() {
    try {
      logger.info('Connecting to Telegram...');

      // Create session
      const session = this.sessionString
        ? new StringSession(this.sessionString)
        : new StringSession('');

      // Create client
      this.client = new TelegramClient(session, this.apiId, this.apiHash, {
        connectionRetries: 5,
        retryDelay: 1000,
        timeout: 10000
      });

      // Connect
      await this.client.connect();
      this.isConnected = true;

      // Check if authorized and sign in if needed
      await this.signIn();

      // Get and log session string (for first-time setup)
      const currentSessionString = this.client.session.save();
      if (!this.sessionString || this.sessionString !== currentSessionString) {
        logger.warn('\n⚠️  SESSION STRING (save this to .env if not already saved):');
        logger.warn(`SESSION_STRING=${currentSessionString}\n`);
      }

      logger.info('Successfully connected and authorized to Telegram');
      return true;
    } catch (error) {
      logger.error('Error connecting to Telegram:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * Disconnect from Telegram
   */
  async disconnect() {
    try {
      if (this.client && this.isConnected) {
        await this.client.disconnect();
        this.isConnected = false;
        logger.info('Disconnected from Telegram');
      }
    } catch (error) {
      logger.error('Error disconnecting:', error);
    }
  }

  /**
   * Get channel entity by username
   */
  async getChannel(username) {
    try {
      if (!this.isConnected) {
        throw new Error('Client not connected');
      }

      logger.info(`Getting channel: ${username}`);
      const entity = await this.client.getEntity(username);
      
      if (!entity) {
        throw new Error(`Channel not found: ${username}`);
      }

      logger.info(`Channel found: ${entity.title || entity.username}`);
      return entity;
    } catch (error) {
      logger.error(`Error getting channel ${username}:`, error);
      throw error;
    }
  }

  /**
   * Get new messages from channel
   * Returns messages newer than lastMessageId
   */
  async getNewMessages(channelUsername, limit = 10) {
    try {
      if (!this.isConnected) {
        throw new Error('Client not connected');
      }

      const channel = await this.getChannel(channelUsername);
      
      // Get messages
      const messages = await this.client.getMessages(channel.id, {
        limit: limit,
        minId: this.lastMessageId
      });

      // Update last message ID if we got new messages
      if (messages.length > 0) {
        const maxId = Math.max(...messages.map(m => m.id));
        if (maxId > this.lastMessageId) {
          this.lastMessageId = maxId;
        }
      }

      return messages;
    } catch (error) {
      logger.error('Error getting messages:', error);
      throw error;
    }
  }

  /**
   * Get all recent messages (for initial scan)
   */
  async getRecentMessages(channelUsername, limit = 50) {
    try {
      if (!this.isConnected) {
        throw new Error('Client not connected');
      }

      const channel = await this.getChannel(channelUsername);
      
      const messages = await this.client.getMessages(channel.id, {
        limit: limit
      });

      // Set last message ID to the highest ID
      if (messages.length > 0) {
        this.lastMessageId = Math.max(...messages.map(m => m.id));
        logger.info(`Initial scan complete. Last message ID: ${this.lastMessageId}`);
      }

      return messages;
    } catch (error) {
      logger.error('Error getting recent messages:', error);
      throw error;
    }
  }

  /**
   * Get session string (for saving to .env)
   */
  getSessionString() {
    if (this.client && this.client.session) {
      return this.client.session.save();
    }
    return '';
  }

  /**
   * Reconnect with retry logic
   */
  async reconnect(maxRetries = 3, delay = 5000) {
    for (let i = 0; i < maxRetries; i++) {
      try {
        logger.info(`Reconnection attempt ${i + 1}/${maxRetries}`);
        await this.disconnect();
        await new Promise(resolve => setTimeout(resolve, delay));
        await this.connect();
        logger.info('Reconnection successful');
        return true;
      } catch (error) {
        logger.error(`Reconnection attempt ${i + 1} failed:`, error);
        if (i === maxRetries - 1) {
          throw error;
        }
      }
    }
  }
}

export default TelegramChannelClient;

