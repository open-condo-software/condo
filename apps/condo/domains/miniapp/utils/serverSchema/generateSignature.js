const crypto = require('node:crypto')


/**
 * A set of parameters that is used to create a signature.
 * It is sent when miniapp is opened to verify signature.
 *
 * @type {string[]}
 */
const SIGN_KEYS = ['condoOrganizationId', 'condoUserId']

/**
 * Generating a set of parameters that is used to create a signature.
 * It is sent when miniapp is opened to verify signature.
 *
 * The same implementation should be used in miniapps to verify a signature
 *
 * @param {string} organizationId
 * @param {string} userId
 * @param {string} secretKey
 * @return {string}
 */
const generateSignature = (organizationId, userId, secretKey) => {
    if (!secretKey) throw new Error('No secretKey!')
    if (!organizationId) throw new Error('No organizationId!')
    if (!userId) throw new Error('No userId!')

    // If you update params set then you must update SIGN_KEYS also!
    const queryParams = [
        { key: 'condoOrganizationId', value: organizationId },
        { key: 'condoUserId', value: userId },
    ]

    const queryString = queryParams
        // Sort the keys in ascending order
        .sort((a, b) => a.key.localeCompare(b.key))
        // Recreating the new query as a string.
        .reduce((acc, { key, value }, idx) => {
            return acc + (idx === 0 ? '' : '&') + `${key}=${encodeURIComponent(value)}`
        }, '')

    return crypto
        .createHmac('sha256', secretKey)
        .update(queryString)
        .digest()
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=$/, '')
}


module.exports = {
    generateSignature,
    SIGN_KEYS,
}
