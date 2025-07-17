const crypto = require('crypto')
const { URL } = require('url')

const Ajv = require('ajv')
const addFormats = require('ajv-formats')

const { ERRORS } = require('./errors')
const { TelegramMiniAppInitParamsSchema, TelegramOauthCallbackSchema, TelegramMiniAppInitParamsUserSchema } = require('./schemas')

const ALLOWED_TIME_SINCE_AUTH_IN_SECONDS = 5 * 60 // 5 min
const CONFIG_REQUIRED_FIELDS = [
    'botId',
    'botToken',
    'allowedUserType',
    'allowedRedirectUrls',
]
// NOTE: if auth data received from telegram mini app, we need to add prefix to secret
const TG_WEB_APP_DATA_SECRET_PREFIX = 'WebAppData'

const ajv = new Ajv({ allowUnionTypes: true })
addFormats(ajv)
const loginDataValidator = ajv.compile({
    type: 'object',
    anyOf: [TelegramMiniAppInitParamsSchema, TelegramOauthCallbackSchema],
})
const telegramMiniAppInitParamsValidator = ajv.compile({
    type: 'object',
    anyOf: [TelegramMiniAppInitParamsSchema],
})
const oauthCallbackValidator = ajv.compile({
    type: 'object',
    anyOf: [TelegramOauthCallbackSchema],
})
const userDataValidator = ajv.compile({
    type: 'object',
    anyOf: [TelegramMiniAppInitParamsUserSchema],
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
 user: string,
 }} TgMiniAppInitData
 */

/**
 * Validates that telegram oauth data was received by provided bot
 * @link https://core.telegram.org/widgets/login#checking-authorization
 * @param {TgAuthData | TgMiniAppInitData} data - tgAuthData
 * @param {string} botToken
 * @param {number} secondsSinceAuth - time limit for authorization to be valid
 * @returns {null | { type, code, message }} error message
 */
function getTgAuthDataValidationError (data, botToken, secondsSinceAuth = ALLOWED_TIME_SINCE_AUTH_IN_SECONDS) {
    // 1. Check that data contains all and only allowed fields
    const isValid = loginDataValidator(data)
    if (!isValid) {
        return ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH
    }

    const isMiniAppInitData = telegramMiniAppInitParamsValidator(data)
    if (isMiniAppInitData) {
        try {
            if (!userDataValidator(JSON.parse(data.user))) {
                return ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH
            }
        } catch {
            return ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH
        }
    }

    // 2. Check that data is not outdated
    if ((Math.floor(Date.now() / 1000) - parseInt(data.auth_date)) > secondsSinceAuth) {
        return ERRORS.VALIDATION_AUTH_DATA_EXPIRED
    }

    // 3. Build secret key using bot token
    // No point in hiding 'sha256' and TG_WEB_APP_DATA_SECRET_PREFIX, as telegram has this information publicly available
    // TG_WEB_APP_DATA_SECRET_PREFIX is just required prefix for secret token
    // nosemgrep: javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key
    const secret = (isMiniAppInitData ? crypto.createHmac('sha256', TG_WEB_APP_DATA_SECRET_PREFIX) : crypto.createHash('sha256'))
        .update(botToken.trim())
        .digest()

    // 4. Build check string from tg auth data
    const checkString = Object.keys(data)
        .sort()
        .filter((k) => ![ 'hash' ].includes(k))
        .map(k => (`${k}=${data[k]}`))
        .join('\n')

    // 5. Calculate sign for auth data
    const hmacBuf = crypto.createHmac('sha256', secret)
        .update(checkString)
        .digest()

    // 6. Our generated sign must equal received sign
    const hashBuf = Buffer.from(data.hash, 'hex')
    const isSignEqual = hashBuf.byteLength === hmacBuf.byteLength && crypto.timingSafeEqual(hmacBuf, Buffer.from(data.hash, 'hex'))
    if (!isSignEqual) {
        return ERRORS.VALIDATION_AUTH_DATA_SIGN_INVALID
    }

    return null
}

function getOauthConfigValidationError (oauthConfig) {
    const uniqueBotIds = new Set(oauthConfig.map(conf => conf.botId))
    if (uniqueBotIds.size !== oauthConfig.length) {
        const duplicateNames = [...uniqueBotIds].filter(botId => oauthConfig.filter(conf => conf.botId === botId).length > 1)
        return { ...ERRORS.INVALID_CONFIG, data: { reason: `Duplicate bot ids: "${duplicateNames.join('", "')}"` } }
    }
    oauthConfig.forEach((config, index) => {
        for (const key of CONFIG_REQUIRED_FIELDS) {
            if (!Object.hasOwn(config, key)) {
                return { ...ERRORS.INVALID_CONFIG, data: { reason: `Missing required field ${key} at index ${index}` } }
            }
        }
        if (!Array.isArray(config.allowedRedirectUrls)) {
            return { ...ERRORS.INVALID_CONFIG, data: { reason: `Field "allowedRedirectUrls" should be array at index ${index}` } }
        }
    })
}

function isValidTelegramMiniAppInitParams (data) {
    return telegramMiniAppInitParamsValidator(data)
}

/** 
 * @param {Array<string>} allowedUrls
 * @param {string} requestUrl
 */
function isRedirectUrlValid (allowedUrls, requestUrl) {
    let url
    if (!requestUrl || !allowedUrls || allowedUrls.length === 0) {
        return false
    }
    try {
        url = new URL(decodeURIComponent(requestUrl))
    } catch {
        return false
    }
    const urlForCheck = decodeURIComponent(`${url.origin}${url.pathname === '/' ? '' : url.pathname}`)
    return allowedUrls.indexOf(urlForCheck) !== -1
}


module.exports = {
    getTgAuthDataValidationError,
    getOauthConfigValidationError,
    isValidTelegramMiniAppInitParams,
    isRedirectUrlValid,
}