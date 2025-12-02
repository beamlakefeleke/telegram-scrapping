/**
 * Job Filter module
 * Filters messages based on keyword matching
 */

import logger from '../utils/logger.js';

/**
 * JobFilter class for filtering job-related messages
 */
class JobFilter {
  constructor(keywords = []) {
    this.keywords = keywords.map(k => k.toLowerCase());
    logger.info(`JobFilter initialized with ${this.keywords.length} keywords: ${this.keywords.join(', ')}`);
  }

  /**
   * Extract text from message
   * Handles different message types (text, caption, etc.)
   */
  extractText(message) {
    if (!message) return '';

    let text = '';

    // Get text from message
    if (message.message) {
      text += message.message + ' ';
    }

    // Get text from caption (for media messages)
    if (message.caption) {
      text += message.caption + ' ';
    }

    // Get text from entities (mentions, hashtags, etc.)
    if (message.entities) {
      message.entities.forEach(entity => {
        if (entity.text) {
          text += entity.text + ' ';
        }
      });
    }

    // Get text from reply message if exists
    if (message.replyTo && message.replyTo.message) {
      text += message.replyTo.message + ' ';
    }

    return text.trim().toLowerCase();
  }

  /**
   * Check if message contains any of the keywords
   */
  containsKeywords(text) {
    if (!text || text.length === 0) return false;

    const lowerText = text.toLowerCase();

    // Check if any keyword is found in the text
    for (const keyword of this.keywords) {
      // Use word boundary matching for better accuracy
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerText)) {
        logger.debug(`Keyword match found: "${keyword}"`);
        return true;
      }
    }

    return false;
  }

  /**
   * Filter message - main filtering logic
   */
  isJobPost(message) {
    try {
      const text = this.extractText(message);
      
      if (!text) {
        logger.debug('Message has no text content, skipping');
        return false;
      }

      const isMatch = this.containsKeywords(text);

      if (isMatch) {
        logger.info(`Job post detected! Text preview: ${text.substring(0, 100)}...`);
      }

      return isMatch;
    } catch (error) {
      logger.error('Error filtering message:', error);
      return false;
    }
  }

  /**
   * Update keywords dynamically
   */
  updateKeywords(keywords) {
    this.keywords = keywords.map(k => k.toLowerCase());
    logger.info(`Keywords updated: ${this.keywords.join(', ')}`);
  }
}

export default JobFilter;

