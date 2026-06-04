const crypto = require('crypto')
const { URL } = require('url')

const Ajv = require('ajv')
const addFormats = require('ajv-formats')

const { ERRORS } = require('./errors')
const { MaxMiniAppInitParamsSchema, MaxMiniAppInitParamsUserSchema } = require('./schemas')

const ALLOWED_TIME_SINCE_AUTH_IN_SECONDS = 5 * 60 // 5 min
const CONFIG_REQUIRED_FIELDS = [
    'botId',
    'botToken',
    'allowedUserType',
    'allowedRedirectUrls',
]
// NOTE: Max uses the same prefix as Telegram for the secret key
const MAX_WEB_APP_DATA_SECRET_PREFIX = 'WebAppData'

const ajv = new Ajv({ allowUnionTypes: true })
addFormats(ajv)
const loginDataValidator = ajv.compile({
    type: 'object',
    anyOf: [MaxMiniAppInitParamsSchema],
})
const maxMiniAppInitParamsValidator = ajv.compile({
    type: 'object',
    anyOf: [MaxMiniAppInitParamsSchema],
})
const userDataValidator = ajv.compile({
    type: 'object',
    anyOf: [MaxMiniAppInitParamsUserSchema],
})

/** @typedef {{
 id: string,
 first_name: string,
 last_name: string,
 username: string,
 photo_url: string,
 auth_date: string,
 hash: string
 }} MaxAuthData
 */

/** @typedef {{
 first_name: string,
 id: number,
 last_name: string,
 language_code: string,
 photo_url: string,
 username: string
 }} MaxMiniAppInitParamsUser
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
 receiver: MaxMiniAppInitParamsUser,
 start_param: string,
 user: string,
 }} MaxMiniAppInitData
 */

/**
 * Validates that max oauth data was received by provided bot
 * @link https://dev.max.ru/docs/webapps/validation
 * @param {MaxAuthData | MaxMiniAppInitData} data - maxAuthData
 * @param {string} botToken
 * @param {number} secondsSinceAuth - time limit for authorization to be valid
 * @returns {null | { type, code, message }} error message
 */
function getMaxAuthDataValidationError (data, botToken, secondsSinceAuth = ALLOWED_TIME_SINCE_AUTH_IN_SECONDS) {
    // 1. Check that data contains all and only allowed fields
    const isValid = loginDataValidator(data)
    if (!isValid) {
        return ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH
    }

    const isMiniAppInitData = maxMiniAppInitParamsValidator(data)
    if (isMiniAppInitData) {
        try {
            if (!userDataValidator(JSON.parse(data.user))) {
                return ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH
            }
        } catch (err) {
            return ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH
        }
    }
    
    // 2. Check that data is not outdated
    if ((Math.floor(Date.now() / 1000) - parseInt(data.auth_date)) > secondsSinceAuth) {
        return ERRORS.VALIDATION_AUTH_DATA_EXPIRED
    }

    // 3. Build secret key using bot token
    // Max uses the same prefix as Telegram for the secret key
    // nosemgrep: javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key
    const secret = crypto.createHmac('sha256', MAX_WEB_APP_DATA_SECRET_PREFIX)
        .update(botToken.trim())
        .digest()

    // 4. Build check string from max auth data
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
    const isSignEqual = hashBuf.byteLength === hmacBuf.byteLength && crypto.timingSafeEqual(hmacBuf, hashBuf)
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
    for (const [index, config] of oauthConfig.entries()) {
        for (const key of CONFIG_REQUIRED_FIELDS) {
            if (!Object.hasOwn(config, key)) {
                return { ...ERRORS.INVALID_CONFIG, data: { reason: `Missing required field "${key}" at index ${index}` } }
            }
        }
        if (!Array.isArray(config.allowedRedirectUrls)) {
            return { ...ERRORS.INVALID_CONFIG, data: { reason: `Field "allowedRedirectUrls" should be array at index ${index}` } }
        }
        for (const [urlIndex, url] of config.allowedRedirectUrls.entries()) {
            try {
                new URL(url)
            } catch {
                return { ...ERRORS.INVALID_CONFIG, data: { reason: `Field "allowedRedirectUrls[${urlIndex}]" is not a valid URL at index ${index}` } }
            }
        }
        if (typeof config.allowedUserType !== 'string' || !config.allowedUserType) {
            return { ...ERRORS.INVALID_CONFIG, data: { reason: `Field "allowedUserType" must be a non-empty string at index ${index}` } }
        }
    }
    return null
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
        const decoded = decodeURIComponent(requestUrl)
        url = new URL(decoded)
    } catch (e) {
        return false
    }
    const urlForCheck = `${url.origin}${url.pathname === '/' ? '' : url.pathname}`
    const result = allowedUrls.indexOf(urlForCheck) !== -1
    return result
}


module.exports = {
    getMaxAuthDataValidationError,
    getOauthConfigValidationError,
    isRedirectUrlValid,
}
