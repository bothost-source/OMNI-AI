const axios = require('axios');
const { logInfo, logError } = require('../utils/logger');

const POLLINATIONS_AUDIO_URL = 'https://gen.pollinations.ai/audio';

// Voice mapping for different languages
const voiceMap = {
    en: 'nova',
    yo: 'nova',
    ha: 'nova',
    ig: 'nova',
    fr: 'nova',
    es: 'nova',
    de: 'nova',
    pt: 'nova',
    ru: 'nova',
    zh: 'nova',
    ja: 'nova',
    ar: 'nova',
    hi: 'nova',
    ko: 'nova',
    tr: 'nova',
    sw: 'nova',
    am: 'nova',
    default: 'nova'
};

/**
 * Generate voice/audio using Pollinations.ai TTS (free)
 */
async function generateVoice(text, lang = 'en') {
    try {
        logInfo(`Generating voice for text: "${text.substring(0, 50)}..." in language: ${lang}`);

        const voice = voiceMap[lang] || voiceMap.default;
        const encodedText = encodeURIComponent(text);

        // Use Pollinations free TTS endpoint
        const url = `${POLLINATIONS_AUDIO_URL}/${encodedText}?voice=${voice}`;

        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 30000,
            headers: {
                'User-Agent': 'WhatsApp-AI-Bot/1.0'
            }
        });

        logInfo('Voice generated successfully');
        return Buffer.from(response.data);
    } catch (error) {
        logError('Voice generation error:', error.message);
        // Fallback: return a simple message if TTS fails
        throw new Error('Failed to generate voice note');
    }
}

module.exports = { generateVoice };
