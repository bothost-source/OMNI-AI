const { detectLanguage } = require('../utils/language');
const { logInfo, logError } = require('../utils/logger');

const aiService = require('../services/aiService');
const imageService = require('../services/imageService');
const voiceService = require('../services/voiceService');
const codeService = require('../services/codeService');
const fileService = require('../services/fileService');
const stickerService = require('../services/stickerService');

/**
 * Check if bot is mentioned by name in text
 */
function isBotMentioned(text, botName) {
    if (!text || !botName) return false;

    const lowerText = text.toLowerCase();
    const lowerName = botName.toLowerCase();

    // Check if name appears at start or anywhere in text
    const namePattern = new RegExp(`\\b${lowerName}\\b`, 'i');
    return namePattern.test(lowerText);
}

/**
 * Main message handler - routes messages to appropriate services
 */
async function handleMessage(client, msg, botName, isMetaAPI = false) {
    const body = msg.body.trim();
    const sender = msg.author || msg.from;

    logInfo(`Message from ${sender}: "${body.substring(0, 50)}..."`);

    // Detect language from message
    const detectedLang = detectLanguage(body);

    // Remove bot name from command for cleaner processing
    const cleanBody = body.replace(new RegExp(`\\b${botName}\\b`, 'gi'), '').trim();
    const lowerClean = cleanBody.toLowerCase();

    // Check for quoted sticker (sticker reply feature)
    if (msg.hasQuotedMsg) {
        const quotedMsg = await msg.getQuotedMessage();
        if (quotedMsg.type === 'sticker') {
            await handleStickerReply(client, msg, botName, detectedLang, isMetaAPI);
            return;
        }
    }

    // Command routing - check clean body (without bot name)
    if (lowerClean.startsWith('!image') || lowerClean.startsWith('!img') || lowerClean.startsWith('!draw') || 
        lowerClean.includes('generate an image') || lowerClean.includes('create an image') ||
        lowerClean.includes('draw') || lowerClean.includes('image of')) {
        const prompt = cleanBody.replace(/^!(image|img|draw)\s*/i, '')
                                .replace(/generate an image\s*/i, '')
                                .replace(/create an image\s*/i, '')
                                .replace(/draw\s*/i, '')
                                .replace(/image of\s*/i, '')
                                .trim();
        await handleImageGeneration(client, msg, prompt, detectedLang, isMetaAPI);
        return;
    }

    if (lowerClean.startsWith('!voice') || lowerClean.startsWith('!speak') || lowerClean.startsWith('!say') ||
        lowerClean.includes('say') || lowerClean.includes('voice') || lowerClean.includes('speak')) {
        const text = cleanBody.replace(/^!(voice|speak|say)\s*/i, '')
                              .replace(/say\s*/i, '')
                              .replace(/voice\s*/i, '')
                              .replace(/speak\s*/i, '')
                              .trim();
        await handleVoiceGeneration(client, msg, text, detectedLang, isMetaAPI);
        return;
    }

    if (lowerClean.startsWith('!code') || lowerClean.startsWith('!python') || lowerClean.startsWith('!java') ||
        lowerClean.includes('code') || lowerClean.includes('write') || lowerClean.includes('generate code')) {
        const prompt = cleanBody.replace(/^!(code|python|java)\s*/i, '')
                                .replace(/code\s*/i, '')
                                .replace(/write\s*/i, '')
                                .replace(/generate\s*/i, '')
                                .trim();
        const language = lowerClean.includes('python') ? 'python' : 
                        lowerClean.includes('java') ? 'java' : 
                        lowerClean.includes('javascript') ? 'javascript' :
                        lowerClean.includes('dart') ? 'dart' :
                        lowerClean.includes('cpp') ? 'cpp' :
                        lowerClean.includes('go') ? 'go' :
                        lowerClean.includes('rust') ? 'rust' :
                        'auto';
        await handleCodeGeneration(client, msg, prompt, language, detectedLang, isMetaAPI);
        return;
    }

    if (lowerClean.startsWith('!upload') || lowerClean.startsWith('!host') ||
        lowerClean.includes('upload') || lowerClean.includes('host')) {
        await handleFileUpload(client, msg, detectedLang, isMetaAPI);
        return;
    }

    if (lowerClean === '!help' || lowerClean === '!commands' || lowerClean.includes('help')) {
        await sendHelpMessage(client, msg, detectedLang, isMetaAPI);
        return;
    }

    if (lowerClean.startsWith('!video') || lowerClean.startsWith('!vid') || lowerClean.includes('video')) {
        const prompt = cleanBody.replace(/^!(video|vid)\s*/i, '').trim();
        await handleVideoGeneration(client, msg, prompt, detectedLang, isMetaAPI);
        return;
    }

    // Default: AI conversation
    await handleAIConversation(client, msg, cleanBody, botName, detectedLang, isMetaAPI);
}

async function handleAIConversation(client, msg, body, botName, lang, isMetaAPI) {
    try {
        const response = await aiService.getResponse(body, lang, botName);
        await sendReply(msg, response, isMetaAPI);
    } catch (error) {
        logError('AI conversation error:', error);
        await sendReply(msg, '❌ Sorry, I had trouble thinking. Try again!', isMetaAPI);
    }
}

async function handleImageGeneration(client, msg, prompt, lang, isMetaAPI) {
    if (!prompt) {
        await sendReply(msg, 'Please tell me what image to generate. E.g: "OMNI generate an image of a cat in space"', isMetaAPI);
        return;
    }

    try {
        await sendReply(msg, 'Generating image... ⏳', isMetaAPI);
        const imageBuffer = await imageService.generateImage(prompt);
        
        // For Meta API, upload to Cloudinary first, then send URL
        if (isMetaAPI) {
            const uploadUrl = await fileService.uploadBuffer(imageBuffer, 'image/jpeg', 'generated.jpg');
            await sendReply(msg, `🎨 Generated image: ${prompt}\\n\\n🔗 ${uploadUrl}`, isMetaAPI);
        } else {
            await sendReply(msg, `🎨 Generated image: ${prompt}`, isMetaAPI);
        }
    } catch (error) {
        logError('Image generation error:', error);
        await sendReply(msg, '❌ Failed to generate image. Try again!', isMetaAPI);
    }
}

async function handleVoiceGeneration(client, msg, text, lang, isMetaAPI) {
    if (!text) {
        await sendReply(msg, 'Please provide text to convert to voice. E.g: "OMNI say hello world"', isMetaAPI);
        return;
    }

    try {
        const voiceBuffer = await voiceService.generateVoice(text, lang);
        
        if (isMetaAPI) {
            const uploadUrl = await fileService.uploadBuffer(voiceBuffer, 'audio/mp3', 'voice.mp3');
            await sendReply(msg, `🎙️ Voice: "${text}"\\n\\n🔗 ${uploadUrl}`, isMetaAPI);
        } else {
            await sendReply(msg, `🎙️ Voice: "${text}"`, isMetaAPI);
        }
    } catch (error) {
        logError('Voice generation error:', error);
        await sendReply(msg, '❌ Failed to generate voice note.', isMetaAPI);
    }
}

async function handleCodeGeneration(client, msg, prompt, language, lang, isMetaAPI) {
    if (!prompt) {
        await sendReply(msg, 'Please describe the code you need. E.g: "OMNI write a Python calculator"', isMetaAPI);
        return;
    }

    try {
        const code = await codeService.generateCode(prompt, language, lang);
        const formattedCode = formatCodeBlock(code, language);
        await sendReply(msg, formattedCode, isMetaAPI);
    } catch (error) {
        logError('Code generation error:', error);
        await sendReply(msg, '❌ Failed to generate code.', isMetaAPI);
    }
}

async function handleStickerReply(client, msg, botName, lang, isMetaAPI) {
    try {
        const response = await aiService.getStickerResponse(lang, botName);
        await sendReply(msg, response, isMetaAPI);
    } catch (error) {
        logError('Sticker reply error:', error);
    }
}

async function handleFileUpload(client, msg, lang, isMetaAPI) {
    try {
        if (msg.hasMedia) {
            const media = await msg.downloadMedia();
            const uploadUrl = await fileService.uploadFile(media);

            await sendReply(msg, `📁 *File Uploaded!*\\n\\n🔗 Link: ${uploadUrl}\\n\\n_This link is valid for 30 days_`, isMetaAPI);
        } else {
            await sendReply(msg, 'Please send a file with the upload command, or reply to a file with upload', isMetaAPI);
        }
    } catch (error) {
        logError('File upload error:', error);
        await sendReply(msg, '❌ Failed to upload file.', isMetaAPI);
    }
}

async function handleVideoGeneration(client, msg, prompt, lang, isMetaAPI) {
    await sendReply(msg, '🎬 Video generation is coming soon! For now, I can generate images with "OMNI generate an image of..."', isMetaAPI);
}

async function sendHelpMessage(client, msg, lang, isMetaAPI) {
    const helpText = `🤖 *${process.env.BOT_NAME || 'OMNI'} Commands*

*Remember: Always mention my name first!*

🎨 *Generate images:*
"OMNI generate an image of a cat in space"

🎙️ *Voice messages:*
"OMNI say hello world"

💻 *Code generation:*
"OMNI write a Python calculator"

📤 *Upload files:*
Send file + "OMNI upload this"

🎬 *Video:* "OMNI create a video of..." (soon)

_Just say my name to talk to me!_`;

    await sendReply(msg, helpText, isMetaAPI);
}

// Helper function to send reply (works for both WhatsApp Web and Meta API)
async function sendReply(msg, text, isMetaAPI) {
    if (isMetaAPI) {
        await msg.reply(text);
    } else {
        await msg.reply(text);
    }
}

// Format code with Meta AI style (triple backticks)
function formatCodeBlock(code, language) {
    const lang = language === 'auto' ? '' : language;
    return `\`\`\`${lang}
${code}
\`\`\``;
}

module.exports = { handleMessage, isBotMentioned, formatCodeBlock };
