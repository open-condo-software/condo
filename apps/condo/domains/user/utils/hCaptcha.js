const { isEmpty, get, isObject } = require('lodash')
const fetch = require('node-fetch')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')

const { CAPTCHA_CHECK_ENABLED } = require('@app/condo/domains/common/constants/featureflags')
const { REQUEST_SOURCES, getRequestSource } = require('@condo/domains/common/utils/request')


const CAPTHCA_CONFIG = conf.HCAPTCHA_CONFIG ? JSON.parse(conf.HCAPTCHA_CONFIG) : {}
const SITE_KEY = CAPTHCA_CONFIG.SITE_KEY
const IOS_KEY = CAPTHCA_CONFIG.IOS_KEY
const ANDROID_KEY = CAPTHCA_CONFIG.ANDROID_KEY
const API_KEY = CAPTHCA_CONFIG.API_KEY
const CAPTCHA_SCORE_URL = 'https://api.hcaptcha.com/siteverify'
const SAFE_CAPTCHA_SCORE = 0.5
const THROW_ERRORS_ON_LOW_CAPTCHA_SCORE = conf.THROW_ERRORS_ON_LOW_CAPTCHA_SCORE === 'true'
const DISABLE_CAPTCHA_CHECK = conf.DISABLE_CAPTCHA_CHECK === 'true'

const logger = getLogger('hCaptcha')

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

/*

NOTE: Error codes

missing-input-secret	            Your secret key is missing.
invalid-input-secret	            Your secret key is invalid or malformed.
missing-input-response	            The response parameter (verification token) is missing.
invalid-input-response	            The response parameter (verification token) is invalid or malformed.
bad-request	                        The request is invalid or malformed.
invalid-or-already-seen-response	The response parameter has already been checked, or has another issue.
not-using-dummy-passcode	        You have used a testing sitekey but have not used its matching secret.
sitekey-secret-mismatch	            The sitekey is not registered with the provided secret.

 */

const captchaCheck = async (context = {}, token) => {
    if (DISABLE_CAPTCHA_CHECK) {
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
        logger.info({ msg: 'Captcha result', result, API_KEY, token, siteKey: getCaptchaKey(source) })

        if (serverAnswer.ok) {
            if (!get(result, 'success', false)) {
                return { error: `Captcha is invalid: ${get(result, 'error-codes')}` }
            }

            if (!THROW_ERRORS_ON_LOW_CAPTCHA_SCORE) return { error: null }

            // TODO(DOMA-8659): Only works in Enterprise plan!!! (risk score: human 0 -> 1 bot)
            // const riskScore = get(result, 'score', 1)
            // if (riskScore >= SAFE_CAPTCHA_SCORE) return { error: `Low captcha score ${riskScore}` }

            return { error: null }
        } else {
            return { error: 'Captcha check failed' }
        }
    } catch (error) {
        logger.error({ msg: 'hCaptcha internal error', error })
        return { error: 'hCaptcha internal error' }
    }
}

module.exports = {
    captchaCheck,
}
