import cookie from 'js-cookie'

import { makeId } from './makeid.utils'

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
