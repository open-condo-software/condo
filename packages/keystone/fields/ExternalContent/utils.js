const path = require('path')

/**
 * Validates file path to prevent path traversal attacks.
 * 
 * @param {string} basePath - Base directory path
 * @param {string} filename - Filename to validate
 * @returns {string} Full validated path
 * @throws {Error} If path traversal is detected
 */
function validateFilePath (basePath, filename) {
    // Prevent path traversal attacks - check for absolute paths first
    if (path.isAbsolute(filename)) {
        throw new Error(`Invalid filename: path traversal detected in ${filename}`)
    }
    
    const fullPath = path.join(basePath, filename)
    const normalized = path.normalize(fullPath)
    const normalizedBase = path.normalize(basePath)
    
    // Check if normalized path starts with base path followed by separator or equals base path
    if (!normalized.startsWith(normalizedBase + path.sep) && normalized !== normalizedBase) {
        throw new Error(`Invalid filename: path traversal detected in ${filename}`)
    }
    
    return fullPath
}

module.exports = {
    validateFilePath,
}
