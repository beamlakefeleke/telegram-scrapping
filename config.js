/**
 * Configuration module
 * Loads and validates environment variables
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '.env') });

/**
 * Validate required configuration
 */
function validateConfig() {
  const required = [
    'API_ID',
    'API_HASH',
    'BOT_TOKEN',
    'SOURCE_CHANNEL',
    'TARGET_CHANNEL'
  ];

  const missing = required.filter(key => !process.env[key]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required environment variables: ${missing.join(', ')}\n` +
      'Please check your .env file or copy .env.example to .env'
    );
  }
}

/**
 * Parse keywords from environment variable
 */
function parseKeywords() {
  const keywordsEnv = process.env.JOB_KEYWORDS || 
    'developer,flutter,react,backend,frontend,software,engineer,programmer,coder';
  
  return keywordsEnv
    .split(',')
    .map(k => k.trim().toLowerCase())
    .filter(k => k.length > 0);
}

// Validate on load
validateConfig();

export default {
  // MTProto API credentials
  apiId: parseInt(process.env.API_ID, 10),
  apiHash: process.env.API_HASH,
  sessionString: process.env.SESSION_STRING || '',

  // Bot configuration
  botToken: process.env.BOT_TOKEN,

  // Channel configuration
  sourceChannel: process.env.SOURCE_CHANNEL.replace('@', ''), // Remove @ if present
  targetChannel: process.env.TARGET_CHANNEL,

  // Filtering configuration
  keywords: parseKeywords(),

  // Polling configuration
  pollInterval: parseInt(process.env.POLL_INTERVAL || '30', 10) * 1000, // Convert to milliseconds

  // Logging configuration
  logLevel: process.env.LOG_LEVEL || 'info',

  // Storage path
  storagePath: join(__dirname, 'storage', 'processed-messages.json')
};

