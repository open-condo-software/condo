const { isEmpty, get } = require('lodash')


const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { fetch } = require('@open-condo/keystone/fetch')
const { getLogger } = require('@open-condo/keystone/logging')

const { CAPTCHA_CHECK_ENABLED } = require('@app/condo/domains/common/constants/featureflags')
const { REQUEST_SOURCES, getRequestSource } = require('@condo/domains/common/utils/request')


const GOOGLE_RECAPTCHA_CONFIG = conf.GOOGLE_RECAPTCHA_CONFIG ? JSON.parse(conf.GOOGLE_RECAPTCHA_CONFIG) : {}
const SITE_KEY = GOOGLE_RECAPTCHA_CONFIG.SITE_KEY
const IOS_KEY = GOOGLE_RECAPTCHA_CONFIG.IOS_KEY
const ANDROID_KEY = GOOGLE_RECAPTCHA_CONFIG.ANDROID_KEY
const PROJECT_ID = GOOGLE_RECAPTCHA_CONFIG.PROJECT_ID
const API_KEY = GOOGLE_RECAPTCHA_CONFIG.API_KEY
const CAPTCHA_SCORE_URL = `https://recaptchaenterprise.googleapis.com/v1/projects/${PROJECT_ID}/assessments?key=${API_KEY}`
const SAFE_CAPTCHA_SCORE = 0.5
const THROW_ERRORS_ON_LOW_CAPTCHA_SCORE = conf.THROW_ERRORS_ON_LOW_CAPTCHA_SCORE === 'true'
const DISABLE_CAPTCHA_CHECK = conf.DISABLE_CAPTCHA_CHECK === 'true'

const logger = getLogger('googleRecaptcha3')

if (isEmpty(GOOGLE_RECAPTCHA_CONFIG) || !SITE_KEY || !IOS_KEY || !ANDROID_KEY || !PROJECT_ID || !API_KEY) {
    console.error('Google reCaptcha not configured')
    logger.error('Google reCaptcha not configured')
}

const getReCaptchaKey = (source) => {
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

const captchaCheck = async (token, action = '', context = {}) => {
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
                'Content-Type': 'application/json; charset=utf-8',
            },
            method: 'POST',
            body: JSON.stringify({
                event: {
                    token: token,
                    siteKey: getReCaptchaKey(source),
                    expectedAction: action,
                },
            }),
        })

        const result = await serverAnswer.json()
        logger.info({ msg: 'Captcha result', result })

        if (serverAnswer.ok) {
            if (!get(result, 'tokenProperties.valid', false)) {
                return { error: `Captcha is invalid : ${get(result, 'tokenProperties.invalidReason')}` }
            }

            const tokenAction = get(result, 'tokenProperties.action', '')
            if (tokenAction !== action) {
                return { error: `Captcha actions mismatch: expected ${action}, but was ${tokenAction}` }
            }

            if (!THROW_ERRORS_ON_LOW_CAPTCHA_SCORE) return { error: null }

            const score = get(result, 'riskAnalysis.score', 0)
            if (score < SAFE_CAPTCHA_SCORE) return { error: `Low captcha score ${score}` }

            return { error: null }
        } else {
            return { error: 'Captcha check failed' }
        }
    } catch (error) {
        logger.error({ msg: 'reCaptcha internal error', error })
        return { error: 'reCaptcha internal error' }
    }
}

module.exports = {
    captchaCheck,
}
