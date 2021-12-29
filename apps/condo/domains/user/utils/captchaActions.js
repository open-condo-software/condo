const actionKeys = /** @readnoly @type {const} */ ([
    'START_CONFIRM_PHONE',
    'GET_CONFIRM_PHONE_TOKEN_INFO',
    'RESEND_SMS',
    'COMPLETE_VERIFY_PHONE',
])

const CAPTCHA_ACTIONS = actionKeys.reduce((p, c) => ({ ...p, [ c ]: c.toLowerCase() }), /** @readnoly @type {Record<typeof actionKeys[number], string>} */({}))

module.exports = {
    CAPTCHA_ACTIONS,
}