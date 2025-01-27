const dayjs = require('dayjs')
const { Store, Cookie } = require('express-session')
const { has } = require('lodash')

const conf = require('@open-condo/config')
const { getCookieOptions } = require('@open-condo/keystone/setup.utils')

const defaultCookieOptions = getCookieOptions(conf)

const INFINITE_LIKE_MAX_AGE = 1000 * (Math.pow(2, 31) - 1) // Around 68 years in milliseconds

const FORBIDDEN_SESSION_FIELDS = [
    'cookie',
    'keystoneListKey',
    'keystoneItemId',
]

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
 * @property {String} keystoneListKey - authed item list key. Defaults to 'User'
 * @property {String} keystoneItemId - authed item id
 * @property {String | Number} expires - number for time span, utc date string for static value
 * @property {Record<string, any>?} additionalFields - any object to store in session
 */

/**
 * Create or update session in store
 * @param {Store} sessionStore
 * @param {SessionConfig} config
 *
 * @example
 * // Set session manually, override expire date and add additional fields
 *
 * const sessionId = getRandomString()
 * const userId = user.id
 * const expiresAt = dayjs().add(2, 'month').toISOString()
 *
 * await setSession(context.req.sessionStore, {
 *      sessionId: getRandomString(),
 *      keystoneItemId: user.id,
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
 *  await destroySession(context.req.sessionStore, sessionId)
 *  // context.req.session = null
 */
function setSession (sessionStore, config) {
    const {
        sessionId,
        keystoneListKey = 'User',
        keystoneItemId,
        expires,
        additionalFields = {},
    } = config

    if (!(sessionStore instanceof Store)) {
        throw new Error('"sessionStore" as instance of Store is required')
    }
    if (!keystoneListKey) {
        throw new Error('"keystoneListKey" is required')
    }
    if (!keystoneItemId) {
        throw new Error('"keystoneItemId" is required')
    }
    for (const forbiddenField of FORBIDDEN_SESSION_FIELDS) {
        if (has(additionalFields, forbiddenField)) {
            throw new Error(`Field "${forbiddenField}" is forbidden for public use`)
        }
    }

    const session = {
        cookie: _makeCookie(expires),
        keystoneListKey,
        keystoneItemId,
        ...additionalFields,
    }

    return new Promise((res, rej) =>
        sessionStore.set(sessionId, session, (err) => err ? rej(err) : res())
    )
}

/**
 * @param {Store} sessionStore
 * @param {string} sessionId
 * */
function destroySession (sessionStore, sessionId) {
    if (!(sessionStore instanceof Store)) {
        throw new Error('\'sessionStore\' as instance of Store is required')
    }
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