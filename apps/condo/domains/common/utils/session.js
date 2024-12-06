const { Session } = require('express-session')
const get = require('lodash/get')
const uniq = require('lodash/uniq')

const POSSIBLE_SESSION_PATHS = [
    'req.session',
    'session',
]

function _getSession (sessionOrWrapper) {
    if (sessionOrWrapper instanceof Session) {
        return sessionOrWrapper
    }
    for (const sessionPath of POSSIBLE_SESSION_PATHS) {
        if (get(sessionOrWrapper, sessionPath) instanceof Session) {
            return get(sessionOrWrapper, sessionPath)
        }
    }
    return null
}

/** Gives restrictions from session. If field is null - no restrictions were made
 * @param {Session | { session: Session } | { req: { session: Session } }} sessionOrWrapper
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