const crypto = require('node:crypto')
const { URL } = require('node:url')

const { ERRORS } = require('./errors')
const { XmaMiniAppInitParamsSchema, XmaMiniAppInitParamsUserSchema } = require('./schemas')

const ALLOWED_TIME_SINCE_AUTH_IN_SECONDS = 5 * 60 // 5 min
const CONFIG_REQUIRED_FIELDS = [
    'botId',
    'botToken',
    'allowedUserType',
    'allowedRedirectUrls',
]
// NOTE: XMA uses the same prefix as Telegram for the secret key
const XMA_WEB_APP_DATA_SECRET_PREFIX = 'WebAppData'

/** @typedef {{
 id: string,
 first_name: string,
 last_name: string,
 username: string,
 photo_url: string,
 auth_date: string,
 hash: string
 }} XmaAuthData
 */

/** @typedef {{
 first_name: string,
 id: number,
 last_name: string,
 language_code: string,
 photo_url: string,
 username: string
 }} XmaMiniAppInitParamsUser
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
 receiver: XmaMiniAppInitParamsUser,
 start_param: string,
 user: string,
 }} XmaMiniAppInitData
 */

/**
 * Validates that xma oauth data was received by provided bot
 * @link https://dev.m**.ru/docs/webapps/validation
 * @param {XmaAuthData | XmaMiniAppInitData} data - xmaAuthData
 * @param {string} botToken
 * @param {number} secondsSinceAuth - time limit for authorization to be valid
 * @returns {null | { type, code, message }} error message
 */
function getXmaAuthDataValidationError (data, botToken, secondsSinceAuth = ALLOWED_TIME_SINCE_AUTH_IN_SECONDS) {
    // 1. Check that data contains all and only allowed fields
    const isValid = XmaMiniAppInitParamsSchema.safeParse(data).success
    if (!isValid) {
        return ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH
    }

    const isMiniAppInitData = XmaMiniAppInitParamsSchema.safeParse(data).success
    if (isMiniAppInitData) {
        try {
            if (!XmaMiniAppInitParamsUserSchema.safeParse(JSON.parse(data.user)).success) {
                return ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH
            }
        } catch (err) { // NOSONAR
            return ERRORS.VALIDATION_AUTH_DATA_KEYS_MISMATCH
        }
    }
    
    // 2. Check that data is not outdated
    if ((Math.floor(Date.now() / 1000) - Number.parseInt(data.auth_date)) > secondsSinceAuth) {
        return ERRORS.VALIDATION_AUTH_DATA_EXPIRED
    }

    // 3. Build secret key using bot token
    // XMA uses the same prefix as Telegram for the secret key
    // nosemgrep: javascript.lang.security.audit.hardcoded-hmac-key.hardcoded-hmac-key
    const secret = crypto.createHmac('sha256', XMA_WEB_APP_DATA_SECRET_PREFIX) // NOSONAR — public API prefix per https://dev.m**.ru/docs/webapps/validation, not a secret
        .update(botToken.trim())
        .digest()

    // 4. Build check string from xma auth data
    const checkString = Object.keys(data)
        .sort() // NOSONAR — deterministic ASCII sort required by signature spec, localeCompare would break validation
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

function getConfigItemValidationReason (config, index) {
    for (const key of CONFIG_REQUIRED_FIELDS) {
        if (!Object.hasOwn(config, key)) {
            return `Missing required field "${key}" at index ${index}`
        }
    }
    if (!Array.isArray(config.allowedRedirectUrls)) {
        return `Field "allowedRedirectUrls" should be array at index ${index}`
    }
    for (const [urlIndex, url] of config.allowedRedirectUrls.entries()) {
        try {
            const parsed = new URL(url)
            const normalized = `${parsed.origin}${parsed.pathname === '/' ? '' : parsed.pathname}`
            if (url !== normalized) {
                return `Field "allowedRedirectUrls[${urlIndex}]" should be normalized to "${normalized}" at index ${index}`
            }
        } catch {
            return `Field "allowedRedirectUrls[${urlIndex}]" is not a valid URL at index ${index}`
        }
    }
    if (typeof config.allowedUserType !== 'string' || !config.allowedUserType) {
        return `Field "allowedUserType" must be a non-empty string at index ${index}`
    }
    return null
}

function getConfigValidationError (xmaConfig) {
    const uniqueBotIds = new Set(xmaConfig.map(conf => conf.botId))
    if (uniqueBotIds.size !== xmaConfig.length) {
        const duplicateNames = [...uniqueBotIds].filter(botId => xmaConfig.filter(conf => conf.botId === botId).length > 1)
        return { ...ERRORS.INVALID_CONFIG, data: { reason: `Duplicate bot ids: "${duplicateNames.join('", "')}"` } }
    }
    for (const [index, config] of xmaConfig.entries()) {
        const reason = getConfigItemValidationReason(config, index)
        if (reason) {
            return { ...ERRORS.INVALID_CONFIG, data: { reason } }
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
    } catch (e) { // NOSONAR
        return false
    }
    const urlForCheck = `${url.origin}${url.pathname === '/' ? '' : url.pathname}`
    
    return allowedUrls.includes(urlForCheck)
}


module.exports = {
    getXmaAuthDataValidationError,
    getConfigValidationError,
    isRedirectUrlValid,
    XMA_WEB_APP_DATA_SECRET_PREFIX,
}
