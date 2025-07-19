import cookie from 'js-cookie'

import { makeId } from './makeid.utils'

/** @deprecated use one from @open-condo/miniapp-utils */
function getCurrentUserId () {
    let current = cookie.get('fingerprint')
    if (!current) {
        current = makeId(12)
    }
    cookie.set('fingerprint', current, { expires: 365 })
    return current
}

/** @deprecated use one from @open-condo/miniapp-utils */
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
