const Groq = require('groq-sdk');
const { logInfo, logError } = require('../utils/logger');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

const conversationMemory = new Map();
const MAX_MEMORY = 10;

async function getResponse(message, lang, botName) {
    try {
        const systemPrompt = buildSystemPrompt(lang, botName);
        const history = getConversationHistory(message.from || 'web_user');

        const messages = [
            { role: 'system', content: systemPrompt },
            ...history,
            { role: 'user', content: message }
        ];

        const completion = await groq.chat.completions.create({
            messages: messages,
            model: 'llama-3.3-70b-versatile',
            temperature: 0.7,
            max_tokens: 2048,
            top_p: 1,
        });

        const response = completion.choices[0]?.message?.content || 'Sorry, I could not understand.';
        addToMemory(message.from || 'web_user', message, response);
        return response;
    } catch (error) {
        logError('Groq API error:', error);
        return 'Sorry, I am having trouble connecting to my brain right now. Please try again later!';
    }
}

async function getStickerResponse(lang, botName) {
    const responses = {
        en: ["Haha! Nice sticker! 😄", "I see you like stickers! 🎯", "Sticker war! I'm in! 🎨"],
        yo: ["Haha! Sticker to dara! 😄", "Mo ri pe o feran awọn sticker! 🎯"],
        ha: ["Haha! Kyautar sticker! 😄", "Na ganin kana son stickers! 🎯"],
        ig: ["Haha! Sticker mma! 😄", "Ahụrụ m na ị nwere mmasị na stickers! 🎯"]
    };
    const langResponses = responses[lang] || responses.en;
    return langResponses[Math.floor(Math.random() * langResponses.length)];
}

function buildSystemPrompt(lang, botName) {
    let prompt = `You are ${botName}, a helpful and friendly AI assistant. You can generate images, code, voice notes, and have conversations. You detect the user's language and always reply in the SAME language they use. If they switch languages, you switch too. Be casual, fun, and helpful. Use emojis naturally. IMPORTANT: You only respond when someone mentions your name "${botName}" first.`;

    const langInstructions = {
        yo: ` Reply ONLY in Yoruba.`,
        ha: ` Reply ONLY in Hausa.`,
        ig: ` Reply ONLY in Igbo.`,
        fr: ` Reply ONLY in French.`,
        es: ` Reply ONLY in Spanish.`,
        de: ` Reply ONLY in German.`,
        pt: ` Reply ONLY in Portuguese.`,
        ru: ` Reply ONLY in Russian.`,
        zh: ` Reply ONLY in Chinese.`,
        ja: ` Reply ONLY in Japanese.`,
        ar: ` Reply ONLY in Arabic.`,
        hi: ` Reply ONLY in Hindi.`,
        ko: ` Reply ONLY in Korean.`,
        tr: ` Reply ONLY in Turkish.`,
        sw: ` Reply ONLY in Swahili.`
    };

    return prompt + (langInstructions[lang] || '');
}

function getConversationHistory(userId) {
    if (!conversationMemory.has(userId)) return [];
    return conversationMemory.get(userId);
}

function addToMemory(userId, userMessage, botResponse) {
    if (!conversationMemory.has(userId)) conversationMemory.set(userId, []);
    const history = conversationMemory.get(userId);
    history.push({ role: 'user', content: userMessage });
    history.push({ role: 'assistant', content: botResponse });
    if (history.length > MAX_MEMORY * 2) {
        conversationMemory.set(userId, history.slice(-MAX_MEMORY * 2));
    }
}

module.exports = { getResponse, getStickerResponse };
