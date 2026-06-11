const { getResponse } = require('./aiService');
const { logInfo, logError } = require('../utils/logger');

/**
 * Generate code using the AI service with code-specific prompting
 */
async function generateCode(prompt, language, lang) {
    try {
        logInfo(`Generating ${language} code for: "${prompt}"`);

        const codePrompt = `Generate clean, well-commented ${language === 'auto' ? '' : language} code for: ${prompt}

Requirements:
- Provide ONLY the code, no explanations unless asked
- Include comments explaining key parts
- Make it production-ready
- Handle edge cases where appropriate

Code:`;

        const code = await getResponse(codePrompt, lang, 'CodeBot');

        // Clean up the response to extract just code
        let cleanCode = code
            .replace(/```[a-z]*
/g, '')
            .replace(/```/g, '')
            .trim();

        return cleanCode;
    } catch (error) {
        logError('Code generation error:', error);
        throw new Error('Failed to generate code');
    }
}

module.exports = { generateCode };
