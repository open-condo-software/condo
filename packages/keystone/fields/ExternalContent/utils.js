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
    // Validate filename is not empty
    if (!filename || typeof filename !== 'string' || filename.trim() === '') {
        throw new Error('Invalid filename: filename cannot be empty')
    }
    
    // Prevent path traversal attacks - check for absolute paths first
    if (path.isAbsolute(filename)) {
        throw new Error(`Invalid filename: path traversal detected in ${filename}`)
    }
    
    const fullPath = path.join(basePath, filename)
    const normalized = path.normalize(fullPath)
    const normalizedBase = path.normalize(basePath)
    
    // Prevent filename from resolving to base directory itself
    if (normalized === normalizedBase) {
        throw new Error('Invalid filename: cannot resolve to base directory')
    }
    
    // Check if normalized path starts with base path followed by separator
    if (!normalized.startsWith(normalizedBase + path.sep)) {
        throw new Error(`Invalid filename: path traversal detected in ${filename}`)
    }
    
    return normalized
}

module.exports = {
    validateFilePath,
}
