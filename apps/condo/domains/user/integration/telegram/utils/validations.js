const crypto = require('crypto')

const Ajv = require('ajv')
const addFormats = require('ajv-formats')

const { ERROR_MESSAGES } = require('./errors')
const { TelegramMiniAppInitParamsSchema, TelegramOauthCallbackSchema } = require('./schemas')

const ALLOWED_TIME_SINCE_AUTH_IN_SECONDS = 5 * 60 // 5 min

const ajv = new Ajv()
addFormats(ajv)
const loginDataValidator = ajv.compile({
    type: 'object',
    anyOf: [TelegramMiniAppInitParamsSchema, TelegramOauthCallbackSchema],
})

/** @typedef {{
 id: string, // NOTE (YEgorLu): as far as I know user id can change only if user changed real phone number, changed phone number in telegram and then logged out from app.
 first_name: string, // NOTE (YEgorLu): can change if user changes language in app
 last_name: string, // NOTE (YEgorLu): can change if user changes language in app
 username: string,
 photo_url: string,
 auth_date: string, // NOTE (YEgorLu): this is a date when user successfully authorized on oauth.telegram. Unix timestamp = Date.now() / 1000
 hash: string // NOTE (YEgorLu): this is a sign of other fields
 }} TgAuthData
 */

/** @typedef {{
 added_to_attachment_menu: boolean,
 allows_write_to_pm: boolean,
 is_premium: boolean,
 first_name: string,
 id: number,
 is_bot: boolean,
 last_name: string,
 language_code: string,
 photo_url: string,
 username: string
 }} TgMiniAppInitParamsUser
  */

/** @typedef {{
 auth_date: string,
 can_send_after: number,
 chat: {
 id: number,
 type: 'group' | 'supergroup' | 'channel',
 title: string,
 username: string,
 photo_url: string,
 },
 chat_type: 'sender' | 'private' | 'group' | 'supergroup' | 'channel',
 chat_instance: string,
 hash: string,
 query_id: string,
 receiver: TgMiniAppInitParamsUser,
 start_param: string,
 user: TgMiniAppInitParamsUser,
 }} TgMiniAppInitData
 */

/**
 * Validates that telegram oauth data was received by provided bot
 * @link https://core.telegram.org/widgets/login#checking-authorization
 * @param {TgAuthData | TgMiniAppInitData} data - tgAuthData
 * @param {string} botToken
 * @param {number} secondsSinceAuth - time limit for authorization to be valid
 * @returns {string | null} error message
 */
function validateTgAuthData (data, botToken, secondsSinceAuth = ALLOWED_TIME_SINCE_AUTH_IN_SECONDS) {

    // 1. Check that data contains all and only allowed fields
    const isValid = loginDataValidator(data)
    if (!isValid) {
        return ERROR_MESSAGES.VALIDATION_AUTH_DATA_KEYS_MISMATCH
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