const crypto = require('crypto')

const cookieSignature = require('cookie-signature')
const { get, isNil } = require('lodash')
const uidSafe = require('uid-safe').sync

const conf = require('@open-condo/config')
const { setSession } = require('@open-condo/keystone/session')

const { RESIDENT, USER_TYPES } = require('@condo/domains/user/constants/common')


function getUserType (req) {
    let userType = RESIDENT
    const userTypeQP = get(req, 'query.userType')

    if (!isNil(userTypeQP)) {
        userType = userTypeQP
    }

    if (!USER_TYPES.includes(userType)) throw new Error('userType is incorrect')

    return userType
}

function getUniqueKey (){
    const randomPart = crypto.randomBytes(32).toString('hex')
    return crypto.createHmac('sha256', 'secret').update(randomPart).digest('hex')
}

async function startAuthedSession (userId, sessionStore) {
    const id = uidSafe(24)
    const payload = {
        sessionId: id,
        keystoneListKey: 'User',
        keystoneItemId: userId,
    }
    await setSession(sessionStore, payload)
    return cookieSignature.sign(id, conf.COOKIE_SECRET)
}

module.exports = {
    getUniqueKey,
    startAuthedSession,
    getUserType,
}