const jwtDecode = require('jwt-decode')
const { get, isNil } = require('lodash')

const { normalizePhone } = require('@condo/domains/common/utils/phone')

const { getSessionParam } = require('./params')


function validateState (req) {
    const state = getSessionParam(req, 'checks.state')
    const stateQP = get(req, 'query.state')

    // validate that state in session are same as in the QP
    // in case if session state is empty - the app2app flow are used - no checks possible for state parameter
    if (!isNil(state) && state !== stateQP) throw new Error('state is incorrect')
}

function validateNonce (req, tokenSet) {
    const { idToken } = tokenSet
    const { nonce } = jwtDecode(idToken)
    const nonceOriginal = getSessionParam(req, 'checks.nonce') || get(req, 'query.nonce')

    if (!isNil(nonceOriginal) && nonceOriginal !== nonce) throw new Error('nonce is incorrect')
}

function hasSamePhone (user, userInfo) {
    const userInfoPhone = normalizePhone(userInfo.phoneNumber)
    return userInfoPhone === user.phone
}

module.exports = {
    validateState,
    validateNonce,
    hasSamePhone,
}