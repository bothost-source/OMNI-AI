const axios = require('axios');
const fs = require('fs-extra');
const path = require('path');
const FormData = require('form-data');
const { logInfo, logError } = require('../utils/logger');

const DOWNLOADS_DIR = path.join(__dirname, '../../downloads');

/**
 * Upload file to temporary hosting (0x0.st - free anonymous file hosting)
 */
async function uploadFile(media) {
    try {
        logInfo('Uploading file to hosting service...');

        // Save file temporarily
        const tempPath = path.join(DOWNLOADS_DIR, `upload_${Date.now()}.${media.mimetype.split('/')[1] || 'bin'}`);
        await fs.writeFile(tempPath, Buffer.from(media.data, 'base64'));

        // Upload to 0x0.st (free anonymous file hosting)
        const form = new FormData();
        form.append('file', fs.createReadStream(tempPath));

        const response = await axios.post('https://0x0.st', form, {
            headers: form.getHeaders(),
            timeout: 60000,
            maxContentLength: Infinity,
            maxBodyLength: Infinity
        });

        // Clean up temp file
        await fs.remove(tempPath);

        const fileUrl = response.data.trim();
        logInfo(`File uploaded: ${fileUrl}`);

        return fileUrl;
    } catch (error) {
        logError('File upload error:', error.message);
        throw new Error('Failed to upload file');
    }
}

/**
 * Create a code file and return path
 */
async function createCodeFile(code, extension = 'txt') {
    const fileName = `code_${Date.now()}.${extension}`;
    const filePath = path.join(DOWNLOADS_DIR, fileName);

    await fs.writeFile(filePath, code, 'utf8');
    return filePath;
}

/**
 * Upload to Cloudinary (if credentials are configured)
 */
async function uploadToCloudinary(media) {
    try {
        if (!process.env.CLOUDINARY_CLOUD_NAME) {
            return null; // Fall back to 0x0.st
        }

        // Note: For Cloudinary, you'd need the cloudinary SDK
        // This is a placeholder for Cloudinary integration
        logInfo('Cloudinary upload would happen here if configured');
        return null;
    } catch (error) {
        logError('Cloudinary upload error:', error);
        return null;
    }
}

module.exports = { uploadFile, createCodeFile, uploadToCloudinary };
