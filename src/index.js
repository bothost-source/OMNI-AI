const express = require('express');
const http = require('http');
const axios = require('axios');
require('dotenv').config();

const { handleMessage, isBotMentioned } = require('./handlers/messageHandler');
const { logInfo, logError } = require('./utils/logger');
const { router } = require('./routes/api');

const BOT_NAME = process.env.BOT_NAME || 'OMNI';
const PORT = process.env.PORT || 3000;

// Meta WhatsApp API config
const WHATSAPP_API_TOKEN = process.env.WHATSAPP_API_TOKEN;
const WHATSAPP_PHONE_NUMBER_ID = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_API_URL = 'https://graph.facebook.com/v18.0';

const welcomedUsers = new Set();

// ========== SETUP ==========
const app = express();
const server = http.createServer(app);

app.use(express.json({ limit: '50mb' }));
app.use('/api', router);

// ========== WEBHOOK (Meta talks to you here) ==========
app.get('/webhook', (req, res) => {
    const mode = req.query['hub.mode'];
    const token = req.query['hub.verify_token'];
    const challenge = req.query['hub.challenge'];

    if (mode === 'subscribe' && token === process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN) {
        logInfo('Webhook verified');
        res.status(200).send(challenge);
    } else {
        res.sendStatus(403);
    }
});

app.post('/webhook', async (req, res) => {
    res.sendStatus(200); // Ack immediately

    try {
        const body = req.body;
        if (body.object !== 'whatsapp_business_account') return;

        for (const entry of body.entry || []) {
            for (const change of entry.changes || []) {
                if (change.value?.messages) {
                    for (const message of change.value.messages) {
                        await handleMetaMessage(message);
                    }
                }
            }
        }
    } catch (error) {
        logError('Webhook error:', error);
    }
});

// ========== HEALTH CHECK ==========
app.get('/health', (req, res) => {
    res.json({ 
        status: 'ok', 
        bot: BOT_NAME, 
        online: true,
        platform: 'meta_whatsapp_api'
    });
});

// ========== ROOT ==========
app.get('/', (req, res) => {
    res.json({
        status: 'running',
        bot: BOT_NAME,
        message: 'OMNI Bot is running. Pair your number in Meta Business Manager.',
        endpoints: ['/health', '/webhook', '/api']
    });
});

// ========== START ==========
server.listen(PORT, () => {
    logInfo(`🤖 OMNI Bot running on port ${PORT}`);
    logInfo(`🔒 Meta WhatsApp Business API`);
    logInfo(`📋 Pair your number at: https://business.facebook.com`);
});

process.on('SIGINT', () => {
    logInfo('Shutting down OMNI...');
    server.close();
    process.exit(0);
});

// ========== MESSAGE HANDLING ==========
async function handleMetaMessage(message) {
    const from = message.from;
    const text = message.text?.body || '';
    const type = message.type;

    logInfo(`Message from ${from}: "${text}"`);

    if (!welcomedUsers.has(from) && type === 'text') {
        await sendWelcomeMessage(from);
        welcomedUsers.add(from);
        return;
    }

    const mentioned = isBotMentioned(text, BOT_NAME);
    if (!mentioned && !text.startsWith('!')) {
        logInfo(`Ignoring - bot not mentioned: "${text}"`);
        return;
    }

    try {
        await handleMessage(null, { 
            body: text, 
            from: from,
            author: from,
            hasQuotedMsg: false,
            type: type,
            react: async () => {},
            reply: async (response) => {
                await sendWhatsAppMessage(from, response);
            }
        }, BOT_NAME, true);
    } catch (error) {
        logError('Error handling message:', error);
    }
}

async function sendWelcomeMessage(to) {
    const welcomeText = `👋 *Welcome to OMNI!*

I'm your AI assistant. Mention my name first:

📝 *"OMNI how are you"*
🎨 *"OMNI generate an image of a sunset"*
💻 *"OMNI write a Python calculator"*

Type *"OMNI help"* for more commands.`;

    await sendWhatsAppMessage(to, welcomeText);
}

async function sendWhatsAppMessage(to, text) {
    try {
        await axios.post(
            `${WHATSAPP_API_URL}/${WHATSAPP_PHONE_NUMBER_ID}/messages`,
            {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'text',
                text: { body: text }
            },
            {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_API_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        logInfo(`Sent to ${to}`);
    } catch (error) {
        logError('Send failed:', error.response?.data || error.message);
    }
}
