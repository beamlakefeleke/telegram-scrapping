/**
 * Storage utility module
 * Manages processed message IDs to avoid duplicates
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import logger from './logger.js';

/**
 * Storage class for managing processed messages
 */
class MessageStorage {
  constructor(storagePath) {
    this.storagePath = storagePath;
    this.processedIds = new Set();
    this.load();
  }

  /**
   * Load processed message IDs from file
   */
  load() {
    try {
      // Ensure directory exists
      const dir = dirname(this.storagePath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // Load existing data
      if (existsSync(this.storagePath)) {
        const data = readFileSync(this.storagePath, 'utf-8');
        const parsed = JSON.parse(data);
        this.processedIds = new Set(parsed.messageIds || []);
        logger.info(`Loaded ${this.processedIds.size} processed message IDs from storage`);
      } else {
        logger.info('No existing storage file found, starting fresh');
      }
    } catch (error) {
      logger.error('Error loading storage:', error);
      this.processedIds = new Set();
    }
  }

  /**
   * Save processed message IDs to file
   */
  save() {
    try {
      const data = {
        messageIds: Array.from(this.processedIds),
        lastUpdated: new Date().toISOString()
      };
      writeFileSync(this.storagePath, JSON.stringify(data, null, 2), 'utf-8');
    } catch (error) {
      logger.error('Error saving storage:', error);
    }
  }

  /**
   * Check if message ID has been processed
   */
  isProcessed(messageId) {
    return this.processedIds.has(messageId);
  }

  /**
   * Mark message ID as processed
   */
  markProcessed(messageId) {
    this.processedIds.add(messageId);
    this.save();
  }

  /**
   * Get count of processed messages
   */
  getCount() {
    return this.processedIds.size;
  }

  /**
   * Clear old message IDs (optional cleanup, keep last 10000)
   */
  cleanup(maxSize = 10000) {
    if (this.processedIds.size > maxSize) {
      const idsArray = Array.from(this.processedIds);
      // Keep only the most recent IDs
      this.processedIds = new Set(idsArray.slice(-maxSize));
      this.save();
      logger.info(`Cleaned up storage, kept ${this.processedIds.size} most recent message IDs`);
    }
  }
}

export default MessageStorage;

