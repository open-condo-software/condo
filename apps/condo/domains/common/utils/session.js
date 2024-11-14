const get = require('lodash/get')
const has = require('lodash/has')
const uniq = require('lodash/uniq')

const POSSIBLE_SESSION_PATHS = [
    'req.session',
    'session',
]

function _getSession (sessionOrWrapper) {
    for (const sessionPath of POSSIBLE_SESSION_PATHS) {
        if (has(sessionOrWrapper, sessionPath)) {
            return get(sessionOrWrapper, sessionPath)
        }
    }

    return sessionOrWrapper
}

/** Gives restrictions from session. If field is null - no restrictions were made
 *  @example
 *  parseSession(context)
 *  parseSession(context.req)
 *  parseSession(context.req.session)
 *  @returns {SessionData}
 * */
function parseSession (sessionOrWrapper) {
    const session = _getSession(sessionOrWrapper)
    if (!session) {
        return makeSessionData()
    }
    const allowedOrganizations = get(session, 'allowedOrganizations')
    const enabledB2BPermissions = get(session, 'enabledB2BPermissions')
    return makeSessionData({
        allowedOrganizations,
        enabledB2BPermissions,
    })
}

/**
 * @typedef SessionDataArgs
 * @prop {string[]?} allowedOrganizations - ids
 * @prop {string[]?} enabledB2BPermissions - keys
 */

/**
 * @typedef SessionData
 * @property {string[] | null} allowedOrganizations
 * @property {string[] | null } enabledB2BPermissions
 */

/**
 * @param {SessionDataArgs?} args
 * @returns {{allowedOrganizations: string[] | null, enabledB2BPermissions: string[] | null}}
 */
function makeSessionData (args = {}) {
    Object.keys(args).forEach(key => {
        args[key] = args[key] ? uniq(args[key].filter(Boolean)) : args[key]
    })

    const {
        allowedOrganizations,
        enabledB2BPermissions,
    } = args

    return {
        allowedOrganizations: allowedOrganizations || null,
        enabledB2BPermissions: enabledB2BPermissions || null,
    }
}

module.exports = {
    parseSession,
    makeSessionData,
}