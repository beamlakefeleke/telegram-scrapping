# Telegram Job Scraper 🤖

A Node.js application that monitors a public Telegram channel for job posts, filters developer/software-related jobs, and automatically forwards them using a Telegram bot.

## Features ✨

- 🔍 **Channel Monitoring**: Monitors public Telegram channels using MTProto (GramJS)
- 🎯 **Smart Filtering**: Keyword-based filtering for developer/software jobs
- 📤 **Auto-Forwarding**: Automatically forwards filtered jobs via Telegram bot
- 💾 **Duplicate Prevention**: Tracks processed messages to avoid duplicates
- 🔄 **Auto-Reconnection**: Graceful error handling with automatic reconnection
- 📝 **Logging**: Comprehensive logging system with Winston
- ⚙️ **Configurable**: Easy configuration via `.env` file

## Prerequisites 📋

- Node.js (v18 LTS or higher)
- Telegram account
- Telegram Bot Token (from [@BotFather](https://t.me/BotFather))
- Telegram API credentials (from [my.telegram.org](https://my.telegram.org/apps))

## Installation 🚀

1. **Clone or download this project**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file with your credentials:**
   ```env
   API_ID=your_api_id_here
   API_HASH=your_api_hash_here
   BOT_TOKEN=your_bot_token_here
   SOURCE_CHANNEL=your_source_channel_username
   TARGET_CHANNEL=your_target_channel_or_chat_id
   ```

## Configuration ⚙️

### Getting Telegram API Credentials

1. Go to [my.telegram.org](https://my.telegram.org/apps)
2. Log in with your phone number
3. Create a new application
4. Copy `api_id` and `api_hash`

### Getting Bot Token

1. Open Telegram and search for [@BotFather](https://t.me/BotFather)
2. Send `/newbot` and follow instructions
3. Copy the bot token

### Setting Up Channels

- **SOURCE_CHANNEL**: The public channel username to monitor (without @)
  - Example: `jobs_channel` or `@jobs_channel` (both work)
  
- **TARGET_CHANNEL**: Where to forward filtered jobs
  - Can be a channel username: `my_jobs_channel`
  - Or a chat ID: `-1001234567890`
  - **Important**: The bot must be added as admin to the target channel, or use a chat ID

### Keyword Configuration

Edit `JOB_KEYWORDS` in `.env` (comma-separated):
```env
JOB_KEYWORDS=developer,flutter,react,backend,frontend,software,engineer
```

## Usage 🎯

1. **First run** (will create session):
   ```bash
   npm start
   ```

2. **Copy the session string** shown in logs to `.env`:
   ```env
   SESSION_STRING=your_session_string_here
   ```

3. **Run again**:
   ```bash
   npm start
   ```

The application will:
- Connect to Telegram
- Scan recent messages in the source channel
- Filter job posts matching keywords
- Forward filtered posts to target channel
- Continue monitoring for new messages

## Project Structure 📁

```
jobscrapping/
├── index.js                 # Main entry point
├── config.js                # Configuration loader
├── package.json             # Dependencies
├── .env.example            # Environment template
├── modules/
│   ├── telegramClient.js   # MTProto client for channel monitoring
│   ├── botHandler.js       # Bot API handler for forwarding
│   └── jobFilter.js        # Keyword filtering logic
├── utils/
│   ├── logger.js           # Winston logger setup
│   └── storage.js          # Processed message tracking
├── storage/                # Generated: processed messages storage
└── logs/                   # Generated: application logs
```

## How It Works 🔧

1. **Connection**: Uses GramJS (MTProto) to connect to Telegram
2. **Monitoring**: Polls the source channel at configured intervals
3. **Filtering**: Checks each message against keyword list
4. **Forwarding**: Sends filtered messages via Telegram Bot API
5. **Tracking**: Stores processed message IDs to prevent duplicates

## Logging 📝

Logs are stored in:
- `logs/combined.log` - All logs
- `logs/error.log` - Error logs only
- Console output with colors

Set log level in `.env`:
```env
LOG_LEVEL=info  # Options: error, warn, info, debug
```

## Troubleshooting 🔍

### "Channel not found"
- Make sure the source channel is public
- Check the channel username (without @)

### "Bot not found or unauthorized"
- Verify `BOT_TOKEN` is correct
- Make sure bot is started (send `/start` to bot)

### "Target channel not found"
- Add bot as admin to target channel, OR
- Use chat ID instead of username
- Get chat ID by forwarding a message from channel to [@userinfobot](https://t.me/userinfobot)

### "Connection errors"
- Check internet connection
- Verify API_ID and API_HASH are correct
- Session may be expired, delete `.session` files and restart

### "Rate limit errors"
- Increase `POLL_INTERVAL` in `.env`
- Reduce number of messages processed per poll

## Advanced Configuration 🎛️

### Poll Interval
```env
POLL_INTERVAL=30  # Seconds between polls
```

### Storage Cleanup
The app automatically cleans up old message IDs (keeps last 10,000) to prevent storage bloat.

## Security 🔒

- Never commit `.env` file
- Keep `SESSION_STRING` secret
- Don't share your API credentials
- Bot token should be kept private

## License 📄

MIT License

## Support 💬

For issues or questions:
1. Check logs in `logs/` directory
2. Verify all environment variables are set correctly
3. Ensure channels are accessible and bot has permissions

---

**Happy Job Hunting! 🎉**

