import cookie from 'js-cookie'

const sample = require('lodash/sample')

function makeId (length) {
    let result = ''
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    for (let i = 0; i < length; i++) {
        result += sample(characters)
    }
    return result
}

function getCurrentUserId () {
    let current = cookie.get('userId')
    if (!current) {
        current = makeId(12)
    }
    cookie.set('userId', current, { expires: 365 })
    return current
}

function getClientSideSenderInfo () {
    return {
        dv: 1,
        fingerprint: getCurrentUserId(),
    }
}

export {
    getCurrentUserId,
    getClientSideSenderInfo,
}
