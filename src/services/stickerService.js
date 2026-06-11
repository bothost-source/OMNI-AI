const { logInfo, logError } = require('../utils/logger');

/**
 * Handle sticker-related operations
 * Note: WhatsApp Web JS handles sticker sending natively
 */
async function processSticker(msg) {
    try {
        logInfo('Processing sticker reply');
        // Sticker handling is done in messageHandler
        // This module can be extended for sticker generation in the future
        return true;
    } catch (error) {
        logError('Sticker processing error:', error);
        return false;
    }
}

module.exports = { processSticker };
