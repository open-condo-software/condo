const { EMAIL_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')


/**
 * Get guard key for ConfirmEmailActionService
 *
 * @param {'email' | 'sendEmailCode' | 'completeEmailCode'} action
 * @param {string} identifier
 */
function getGuardKey (action, identifier) {
    if (action === 'sendEmailCode') {
        return ['sendEmailCode', identifier].join(':')
    }
    if (action === 'completeEmailCode') {
        return ['sendEmailCode', identifier].join(':')
    }
    return [EMAIL_COUNTER_LIMIT_TYPE, identifier].join(':')
}

module.exports = {
    getGuardKey,
}
