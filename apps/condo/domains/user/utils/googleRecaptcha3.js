const { isEmpty } = require('lodash')

const conf = require('@open-condo/config')
const { getLogger } = require('@open-condo/keystone/logging')

const GOOGLE_RECAPTCHA_CONFIG = conf.GOOGLE_RECAPTCHA_CONFIG ? JSON.parse(conf.GOOGLE_RECAPTCHA_CONFIG) : {}
const CAPTCHA_SCORE_URL = GOOGLE_RECAPTCHA_CONFIG.CAPTCHA_SCORE_URL ? GOOGLE_RECAPTCHA_CONFIG.CAPTCHA_SCORE_URL : 'https://www.google.com/recaptcha/api/siteverify'
const SERVER_KEY = GOOGLE_RECAPTCHA_CONFIG.SERVER_KEY
const SAFE_CAPTCHA_SCORE = 0.5
const THROW_ERRORS_ON_LOW_CAPTCHA_SCORE = false

const logger = getLogger('googleRecaptcha3')

if (isEmpty(SERVER_KEY)) {
    logger.error('Google reCaptcha not configured')
}

const captchaCheck = async (response, action = '') => {
    if (conf.NODE_ENV === 'test') {
        return { error: null }
    }

    try {
        const serverAnswer = await fetch(CAPTCHA_SCORE_URL, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            method: 'POST',
            body: `secret=${SERVER_KEY}&response=${response}`,
        })

        const result = await serverAnswer.json()
        logger.info({ msg: 'Captcha result', result })

        if (serverAnswer.ok) {
            const isError = THROW_ERRORS_ON_LOW_CAPTCHA_SCORE && result.score < SAFE_CAPTCHA_SCORE
            if (result.action !== action) {
                logger.error(`Captcha actions mismatch ${result.action} - ${action}`)
            }
            return { error: (isError) ? `Low captcha score ${result.score}` : null }
        } else {
            return { error: 'captcha check failed' }
        }
    } catch (error) {
        logger.error({ msg: 'reCaptcha internal error', error })
        return { error: 'reCaptcha internal error' }
    }
}

module.exports = {
    captchaCheck,
}
