const { has, get } = require('lodash')
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
 * */
function parseSession (sessionOrWrapper) {
    const session = _getSession(sessionOrWrapper)
    if (!session) {
        return null
    }
    const organizations = get(session, 'organizations')
    const b2bPermissionKeys = get(session, 'b2bPermissionKeys')
    return makeSessionData({
        organizations,
        b2bPermissionKeys,
    })
}

/**
 * @typedef SessionDataArgs
 * @prop {string[]?} organizations - allowed organizations
 * @prop {string[]?} b2bPermissionKeys - active permissions
 * @prop {Record<string, boolean>?} b2bPermissions
 */

/**
 * @param {SessionDataArgs?} args
 * @returns {{organizations: string[] | null, b2bPermissionKeys: string[] | null}}
 */
function makeSessionData (args = {}) {
    let { organizations, b2bPermissionKeys, b2bPermissions } = args

    if (b2bPermissions !== null && b2bPermissions !== undefined) {
        const parsedAllowedPermissionKeys = Object.keys(b2bPermissions)
            .filter(key => b2bPermissions[key] === true)
            .map(key => key)

        b2bPermissionKeys = Array.isArray(b2bPermissionKeys) ? b2bPermissionKeys : []
        b2bPermissionKeys = b2bPermissionKeys.concat(parsedAllowedPermissionKeys)
    }

    return {
        organizations: organizations ? uniq(organizations).filter(Boolean) : null,
        b2bPermissionKeys: b2bPermissionKeys ? uniq(b2bPermissionKeys) : null,
    }
}

module.exports = {
    parseSession,
    makeSessionData,
}