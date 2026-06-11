const express = require('express');
const router = express.Router();
const { logInfo, logError } = require('../utils/logger');

const clients = new Map();

function setupWebSocket(wss, client) {
    wss.on('connection', (ws) => {
        logInfo('Web client connected');
        const clientId = Date.now().toString();
        clients.set(clientId, ws);

        ws.send(JSON.stringify({
            type: 'status',
            data: {
                is_online: true,
                is_paired: false,
                phone_number: null,
                active_chats: 0,
                total_messages: 0,
                supported_languages: ['en', 'yo', 'ha', 'ig', 'fr', 'es', 'de', 'pt', 'ru', 'zh', 'ja', 'ko', 'ar', 'hi', 'tr']
            }
        }));

        ws.on('close', () => {
            clients.delete(clientId);
            logInfo('Web client disconnected');
        });
    });
}

router.post('/chat', async (req, res) => {
    try {
        const { message, language, user_id } = req.body;
        const aiService = require('../services/aiService');
        const response = await aiService.getResponse(message, language || 'en', 'OMNI');

        res.json({
            success: true,
            response: response,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        logError('Chat API error:', error);
        res.status(500).json({ error: 'Failed to process message' });
    }
});

router.post('/image', async (req, res) => {
    try {
        const { prompt } = req.body;
        const imageService = require('../services/imageService');
        const imageBuffer = await imageService.generateImage(prompt);
        const base64 = imageBuffer.toString('base64');
        const dataUrl = `data:image/jpeg;base64,${base64}`;

        res.json({
            success: true,
            image_url: dataUrl,
            prompt: prompt
        });
    } catch (error) {
        logError('Image API error:', error);
        res.status(500).json({ error: 'Failed to generate image' });
    }
});

router.post('/voice', async (req, res) => {
    try {
        const { text, language } = req.body;
        const voiceService = require('../services/voiceService');
        const voiceBuffer = await voiceService.generateVoice(text, language || 'en');
        const base64 = voiceBuffer.toString('base64');
        const dataUrl = `data:audio/mp3;base64,${base64}`;

        res.json({
            success: true,
            voice_url: dataUrl
        });
    } catch (error) {
        logError('Voice API error:', error);
        res.status(500).json({ error: 'Failed to generate voice' });
    }
});

router.post('/code', async (req, res) => {
    try {
        const { prompt, language } = req.body;
        const codeService = require('../services/codeService');
        const code = await codeService.generateCode(prompt, language || 'auto', 'en');

        res.json({
            success: true,
            code: code,
            language: language
        });
    } catch (error) {
        logError('Code API error:', error);
        res.status(500).json({ error: 'Failed to generate code' });
    }
});

router.post('/upload', async (req, res) => {
    try {
        res.json({
            success: true,
            file_url: 'https://0x0.st/placeholder'
        });
    } catch (error) {
        logError('Upload API error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Pairing endpoints - now using CODE instead of QR
router.post('/pair', async (req, res) => {
    try {
        const { action } = req.body;
        if (action === 'generate_code') {
            res.json({
                success: true,
                message: 'Pairing code will be generated. Check WebSocket for updates.'
            });
        }
    } catch (error) {
        logError('Pair API error:', error);
        res.status(500).json({ error: 'Failed to generate pairing code' });
    }
});

router.get('/status', async (req, res) => {
    res.json({
        is_online: true,
        is_paired: false,
        phone_number: null,
        active_chats: 0,
        total_messages: 0
    });
});

module.exports = { router, setupWebSocket };
