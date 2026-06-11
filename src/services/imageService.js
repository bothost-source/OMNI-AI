const axios = require('axios');
const { logInfo, logError } = require('../utils/logger');

const POLLINATIONS_IMAGE_URL = 'https://image.pollinations.ai/prompt';

/**
 * Generate image using Pollinations.ai (free, no API key needed)
 */
async function generateImage(prompt) {
    try {
        logInfo(`Generating image for: "${prompt}"`);

        // URL encode the prompt
        const encodedPrompt = encodeURIComponent(prompt);
        const url = `${POLLINATIONS_IMAGE_URL}/${encodedPrompt}?width=1024&height=1024&nologo=true`;

        const response = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 60000, // 60 second timeout
            headers: {
                'User-Agent': 'WhatsApp-AI-Bot/1.0'
            }
        });

        logInfo('Image generated successfully');
        return Buffer.from(response.data);
    } catch (error) {
        logError('Image generation error:', error.message);
        throw new Error('Failed to generate image');
    }
}

module.exports = { generateImage };
