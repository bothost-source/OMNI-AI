/**
 * Simple logger utility
 */
function getTimestamp() {
    return new Date().toISOString();
}

function logInfo(...args) {
    console.log(`[${getTimestamp()}] [INFO]`, ...args);
}

function logError(...args) {
    console.error(`[${getTimestamp()}] [ERROR]`, ...args);
}

function logWarn(...args) {
    console.warn(`[${getTimestamp()}] [WARN]`, ...args);
}

module.exports = { logInfo, logError, logWarn };
