const crypto = require('crypto')

const { ERROR_MESSAGES } = require('./errors')

const ALLOWED_TIME_SINCE_AUTH_IN_SECONDS = 5 * 60 // 5 min

const LOGIN_DATA_FIELDS = new Set([
    'id', // NOTE (YEgorLu): as far as I know user id can change only if user changed real phone number, changed phone number in telegram and then logged out from app.
    'first_name', // NOTE (YEgorLu): can change if user changes language in app
    'last_name', // NOTE (YEgorLu): can change if user changes language in app
    'username',
    'photo_url',
    'auth_date', // NOTE (YEgorLu): this is a date when user successfully authorized on oauth.telegram. Unix timestamp = Date.now() / 1000
    'hash', // NOTE (YEgorLu): this is a sign of other fields
])

/** @typedef {{
 id: string,
 first_name: string,
 last_name: string,
 username: string,
 photo_url: string,
 auth_date: string,
 hash: string
 }} TgAuthData
 */

/**
 * Validates that telegram oauth data was received by provided bot
 * @link https://core.telegram.org/widgets/login#checking-authorization
 * @param {TgAuthData} data - tgAuthData
 * @param {string} botToken
 * @param {number} secondsSinceAuth - time limit for authorization to be valid
 * @returns {string | null} error message
 */
function validateTgAuthData (data, botToken, secondsSinceAuth = ALLOWED_TIME_SINCE_AUTH_IN_SECONDS) {

    // 1. Check that data contains all and only allowed fields
    if (Object.keys(data).length !== LOGIN_DATA_FIELDS.size) {
        return ERROR_MESSAGES.VALIDATION_AUTH_DATA_KEYS_MISMATCH
    }
    for (const key in data) {
        if (!LOGIN_DATA_FIELDS.has(key)) {
            return ERROR_MESSAGES.VALIDATION_AUTH_DATA_KEYS_MISMATCH
        }
    }

    // 2. Check that data is not outdated
    if ((Math.floor(Date.now() / 1000) - parseInt(data.auth_date)) > secondsSinceAuth) {
        return ERROR_MESSAGES.VALIDATION_AUTH_DATA_EXPIRED
    }

    // 3. Build secret key using bot token
    const secret = crypto.createHash('sha256')
        .update(botToken?.trim())
        .digest()

    // 4. Build check string from tg auth data
    const checkString = Object.keys(data)
        .sort()
        .filter((k) => data[k])
        .filter((k) => ![ 'hash' ].includes(k))
        .map(k => (`${k}=${data[k]}`))
        .join('\n')

    // 5. Calculate sign for auth data
    const hmac = crypto.createHmac('sha256', secret)
        .update(checkString)
        .digest('hex')

    // 6. Our generated sign must equal received sign
    if (hmac !== data.hash) {
        return ERROR_MESSAGES.VALIDATION_AUTH_DATA_SIGN_INVALID
    }

    return null
}

module.exports = {
    validateTgAuthData,
}