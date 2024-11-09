const SYMMETRIC_ENCRYPTED_TEXT_DECRYPT_INFO = Symbol('SYMMETRIC_ENCRYPTED_TEXT_DECRYPT_INFO')


/**
 * @param item
 * @param {string} fieldPath
 * @param {CipherManagerResult} info
 */
function saveDecryptInfo (item, fieldPath, info) {
    const previouslySaved = item[SYMMETRIC_ENCRYPTED_TEXT_DECRYPT_INFO] || {}
    previouslySaved[fieldPath] = info
    item[SYMMETRIC_ENCRYPTED_TEXT_DECRYPT_INFO] = previouslySaved
}

/**
 * @param item
 * @param {string} fieldPath
 * @returns {CipherManagerResult | undefined}
 */
function getDecryptInfo (item, fieldPath) {
    const previouslySaved = item[SYMMETRIC_ENCRYPTED_TEXT_DECRYPT_INFO] || {}
    return previouslySaved[fieldPath]
}

module.exports = {
    saveDecryptInfo,
    getDecryptInfo,
}