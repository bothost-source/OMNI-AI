/**
 * Language detection utility
 * Placeholder - will be expanded with full language detection later
 */
function detectLanguage(text) {
    if (!text || text.length < 2) return 'en';

    const lowerText = text.toLowerCase();

    if (/[à-åç-ëì-ïñ-öø-ü]/.test(text)) return 'fr';
    if (/[áéíóúüñ¿¡]/.test(text)) return 'es';
    if (/[äöüß]/.test(text)) return 'de';
    if (/[àèéìíîòóùú]/.test(text)) return 'it';
    if (/[ãõçáéíóúâêô]/.test(text)) return 'pt';
    if (/[а-яё]/.test(text)) return 'ru';
    if (/[一-鿿]/.test(text)) return 'zh';
    if (/[぀-ゟ゠-ヿ]/.test(text)) return 'ja';
    if (/[가-힯]/.test(text)) return 'ko';
    if (/[؀-ۿ]/.test(text)) return 'ar';
    if (/[ऀ-ॿ]/.test(text)) return 'hi';
    if (/[çğıöşü]/.test(text)) return 'tr';

    return 'en';
}

module.exports = { detectLanguage };
