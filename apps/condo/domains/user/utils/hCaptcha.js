const { isEmpty, get, isObject } = require('lodash')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const { CAPTCHA_CHECK_ENABLED } = require('@app/condo/domains/common/constants/featureflags')
const { REQUEST_SOURCES, getRequestSource } = require('@condo/domains/common/utils/request')


const CAPTHCA_CONFIG = conf.HCAPTCHA_CONFIG ? JSON.parse(conf.HCAPTCHA_CONFIG) : {}
const SITE_KEY = CAPTHCA_CONFIG.SITE_KEY
const IOS_KEY = CAPTHCA_CONFIG.IOS_KEY
const ANDROID_KEY = CAPTHCA_CONFIG.ANDROID_KEY
const API_KEY = CAPTHCA_CONFIG.API_KEY
const CAPTCHA_SCORE_URL = 'https://api.hcaptcha.com/siteverify'
const DISABLE_CAPTCHA = conf.DISABLE_CAPTCHA === 'true'

const ERROR_MESSAGES = {
    'missing-input-secret': 'Your secret key is missing.',
    'invalid-input-secret': 'Your secret key is invalid or malformed.',
    'missing-input-response': 'The response parameter (verification token) is missing.',
    'invalid-input-response': 'The response parameter (verification token) is invalid or malformed.',
    'bad-request': 'The request is invalid or malformed.',
    'invalid-or-already-seen-response': 'The response parameter has already been checked, or has another issue.',
    'not-using-dummy-passcode': 'You have used a testing sitekey but have not used its matching secret.',
    'sitekey-secret-mismatch': 'The sitekey is not registered with the provided secret.',
}


const logger = getLogger()

if (isEmpty(CAPTHCA_CONFIG) || !SITE_KEY || !IOS_KEY || !ANDROID_KEY || !API_KEY) {
    console.error('hCaptcha not configured')
    logger.error('hCaptcha not configured')
}

const getCaptchaKey = (source) => {
    switch (source) {
        case REQUEST_SOURCES.ANDROID_APP:
            return ANDROID_KEY
        case REQUEST_SOURCES.IOS_APP:
            return IOS_KEY
        case REQUEST_SOURCES.SITE:
            return SITE_KEY
        default:
            throw new Error('Unexpected request source to captcha check')
    }
}

const convertToForm = (data) => {
    if (!isObject(data) || isEmpty(data)) return ''

    const formBody = []
    for (const property in data) {
        const encodedKey = encodeURIComponent(property)
        const encodedValue = encodeURIComponent(data[property])
        formBody.push(encodedKey + '=' + encodedValue)
    }
    return formBody.join('&')
}

const captchaCheck = async (context = {}, token) => {
    if (DISABLE_CAPTCHA) {
        return { error: null }
    }

    try {
        // TODO(DOMA-8544): Remove feature flag after mobile app release
        const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, CAPTCHA_CHECK_ENABLED)
        if (!isFeatureEnabled) {
            logger.info({ msg: 'Captcha check id disabled' })
            return { error: null }
        }

        const source = getRequestSource(context)

        const serverAnswer = await fetch(CAPTCHA_SCORE_URL, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
            },
            method: 'POST',
            body: convertToForm({
                secret: API_KEY,
                response: token,
                siteKey: getCaptchaKey(source),
            }),
        })

        const result = await serverAnswer.json()
        logger.info({ msg: 'captcha result', data: { result, API_KEY, token, siteKey: getCaptchaKey(source) } })

        if (serverAnswer.ok) {
            if (!get(result, 'success', false)) {
                const errorCode = get(result, 'error-codes')
                const errorMessage = get(ERROR_MESSAGES, errorCode, 'Unknown error')
                return { error: `Captcha is invalid: ${errorCode} (${errorMessage})` }
            }
            return { error: null }
        } else {
            return { error: 'Captcha check failed' }
        }
    } catch (err) {
        logger.error({ msg: 'hCaptcha internal error', err })
        return { error: 'hCaptcha internal error' }
    }
}

module.exports = {
    captchaCheck,
}
