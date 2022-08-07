const isEmpty = require('lodash/isEmpty')
const conf = require('@condo/config')
const captchaConfig = conf.GOOGLE_RECAPTCHA_CONFIG ? JSON.parse(conf.GOOGLE_RECAPTCHA_CONFIG) : {}
const CAPTCHA_SCORE_URL = captchaConfig.CAPTCHA_SCORE_URL ? captchaConfig.CAPTCHA_SCORE_URL : 'https://www.google.com/recaptcha/api/siteverify'
const SERVER_KEY = captchaConfig.SERVER_KEY
const { SAFE_CAPTCHA_SCORE, TROW_ERRORS_ON_LOW_CAPTCHA_SCORE } = require('@condo/domains/user/constants/common')

if (isEmpty(SERVER_KEY)) {
    console.error('Google reCaptcha not configured')
}

const onCaptchaCheck = ({ success, challenge_ts, hostname, score, action }) => {
    console.log(
        (score < SAFE_CAPTCHA_SCORE) ? '\x1b[31m' : '\x1b[32m',
        `Recaptcha: ${action} - [${score}]: ${success}`,         
        challenge_ts, 
        hostname,
        '\x1b[0m'
    )
} 

const captchaCheck = async (response, action = '') => {
    if (conf.NODE_ENV === 'test') {
        return { error: null }
    }
    const serverAnswer = await fetch(CAPTCHA_SCORE_URL, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        method: 'POST',
        body: `secret=${SERVER_KEY}&response=${response}`,
    })

    if (serverAnswer.ok) {
        const result = await serverAnswer.json()
        if (result.action !== action) {
            console.error(`Captcha actions mismatch ${result.action} - ${action}`)
        }
        onCaptchaCheck(result)
        const error = (TROW_ERRORS_ON_LOW_CAPTCHA_SCORE && result.score < SAFE_CAPTCHA_SCORE) ? `Low captcha score ${result.score}` : null
        return { error }
    } else {
        return { error: '[error] captcha check failed' }
    }
}

module.exports = {
    captchaCheck,
}
