# OMNI AI

A secure WhatsApp AI bot with Flutter web dashboard — powered by Meta's official WhatsApp Business API.

## Features

- **Secure WhatsApp Integration** — Uses Meta's official API (no bans, no hacks)
- **Tag-Only Responses** — Only replies when you mention "OMNI" first
- **Auto Welcome DM** — Sends ready-made help text when someone first messages the bot
- **AI Conversations** — Powered by Groq (free tier) using Llama 3
- **Image Generation** — Free via Pollinations.ai
- **Voice Notes** — Text-to-speech
- **Code Generation** — Meta AI-style formatted code blocks
- **File Hosting** — Upload and share files
- **Language Detection** — Auto-detects and replies in your language
- **Flutter Web Dashboard** — Chat with OMNI from your browser

## Why Meta API vs WhatsApp Web?

| Feature | Meta API | WhatsApp Web (unofficial) |
|---------|----------|---------------------------|
| Security | Official, secure | Can get banned |
| Reliability | 99.9% uptime | Frequently blocked |
| Name Protection | Cannot be renamed | Anyone can change name |
| Webhooks | Built-in | Manual polling |
| Cost | Free tier available | Free but risky |

## Setup

### 1. Meta Business Account

1. Go to [business.facebook.com](https://business.facebook.com)
2. Create a WhatsApp Business account
3. Get your:
   - Phone Number ID
   - Business Account ID
   - API Token

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```
GROQ_API_KEY=your_groq_key
BOT_NAME=OMNI
OWNER_NUMBER=your_number

WHATSAPP_API_TOKEN=your_meta_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_id
WHATSAPP_BUSINESS_ACCOUNT_ID=your_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=your_verify_token
```

### 3. Install & Run

```bash
npm install
npm start
```

### 4. Set Webhook URL

In Meta dashboard, set webhook URL to:
```
https://your-domain.com/webhook
```

Verify token: `your_verify_token`

### 5. Build Flutter Web

```bash
cd frontend
flutter pub get
flutter build web --release
```

## How to Use in WhatsApp

**Important: Always mention OMNI first!**

```
OMNI how are you doing?
OMNI generate an image of a cat
OMNI write a Python calculator
OMNI say hello in French
OMNI upload this (reply to file)
```

**First DM automatically sends welcome message with instructions.**

## Code Formatting

When OMNI sends code, it uses Meta AI-style formatting:

```python
def hello():
    print("Hello from OMNI!")
```

## Hosting on Hugging Face

1. Create Docker Space
2. Add environment secrets in Space Settings
3. Set webhook URL to your Space URL + `/webhook`

## License

MIT
