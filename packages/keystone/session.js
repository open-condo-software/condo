const dayjs = require('dayjs')
const { Store, Cookie } = require('express-session')
const { has, get } = require('lodash')

const conf = require('@open-condo/config')
const { prepareDefaultKeystoneConfig } = require('@open-condo/keystone/setup.utils')

const { cookie: defaultCookieOptions } = prepareDefaultKeystoneConfig(conf)

const INFINITE_LIKE_MAX_AGE = 1000 * (Math.pow(2, 31) - 1) // Around 68 years in milliseconds

const POSSIBLE_SESSION_STORE_PATHS = [
    'req.sessionStore',
    'sessionStore',
]

const FORBIDDEN_SESSION_FIELDS = [
    'cookie',
    'keystoneListKey',
    'keystoneItemId',
]

/** @returns {null | Store} */
function _getSessionStore (sessionStoreOrWrapper) {
    if (sessionStoreOrWrapper instanceof Store) {
        return sessionStoreOrWrapper
    }
    for (const path of POSSIBLE_SESSION_STORE_PATHS) {
        if (get(sessionStoreOrWrapper, path) instanceof Store) {
            return get(sessionStoreOrWrapper, path)
        }
    }
    return null
}

/** @param {String | Number} expires */
function _makeCookie (expires) {
    let maxAge
    if (typeof expires === 'number') {
        maxAge = expires
    } else if (typeof expires === 'string') {
        maxAge = dayjs(expires).valueOf() - dayjs().valueOf()
    } else {
        maxAge = INFINITE_LIKE_MAX_AGE
    }

    /** @type {CookieOptions} */
    const options = {
        ...defaultCookieOptions,
        maxAge,
    }

    return new Cookie(options).toJSON()
}

/**
 * @typedef SessionConfig
 * @property {String} sessionId - key in store
 * @property {String} userId - user id
 * @property {String | Number} expires - number for time span, utc date string for static value
 * @property {Record<string, any>?} additionalFields - any object to store in session
 */

/**
 * Create or update session in store
 * @param sessionStoreOrWrapper - sessionStore, keystone context or request
 * @param {SessionConfig} config
 *
 * @example
 * // Set session manually, override expire date and add additional fields
 *
 * const sessionId = getRandomString()
 * const userId = user.id
 * const expiresAt = dayjs().add(2, 'month').toISOString()
 *
 * await setSession(context, {
 *      sessionId: getRandomString(),
 *      userId: user.id,
 *      expires: expiresAt
 *      additionalFields: {
 *          rights: ['canManageIntegrations']
 *      }
 *  })
 *
 *  // context.req.session:
 *  /*
 *      // key name: sess:<sessionId>
 *      // expires: <close to expiresAt - Date.now(), difference in few seconds / minutes>
 *     {
 *          "cookie": {
 *              "originalMaxAge": 1736261386329,
 *              "expires": "2024-11-25T11:43:42.920Z",
 *              "secure": false,
 *              "httpOnly": true,
 *              "path": "/",
 *              "sameSite": "Lax"
 *          },
 *          "keystoneListKey": "User",
 *          "keystoneItemId": "uuid"
 *          "rights": ["canManageIntegrations]
 *      }
 *  *\/
 *
 *  await destroySession(context, sessionId)
 *  // context.req.session = null
 */
function setSession (sessionStoreOrWrapper, config) {
    const { sessionId, userId, expires, additionalFields = {} } = config
    const sessionStore = _getSessionStore(sessionStoreOrWrapper)
    if (!sessionStore) {
        throw new Error('Session Store is required')
    }
    if (!userId) {
        throw new Error('User id is required')
    }
    for (const forbiddenField of FORBIDDEN_SESSION_FIELDS) {
        if (has(additionalFields, forbiddenField)) {
            throw new Error(`Field ${forbiddenField} is forbidden for public use`)
        }
    }

    const session = {
        cookie: _makeCookie(expires),
        keystoneListKey: 'User',
        keystoneItemId: userId,
        ...additionalFields,
    }

    return new Promise((res, rej) =>
        sessionStore.set(sessionId, session, (err) => err ? rej(err) : res())
    )
}

function destroySession (sessionStoreOrWrapper, sessionId) {
    const sessionStore = _getSessionStore(sessionStoreOrWrapper)
    if (!sessionStore) {
        throw new Error('Session Store is required')
    }

    return new Promise((res, rej) => {
        sessionStore.destroy(sessionId, (err) => err ? rej(err) : res())
    })
}

module.exports = {
    setSession,
    destroySession,
}