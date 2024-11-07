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
 * @param {string[]?} args.organizations - allowed organizations
 * @param {string[]?} args.b2bPermissionKeys - active permissions
 * @param {Record<string, boolean>?} args.b2bPermissions
 * @returns {{organizations: string[] | null, b2bPermissionKeys: string[] | null}}
 */
function makeSessionData (args) {
    let { organizations = [], b2bPermissionKeys = [], b2bPermissions = {} } = args

    if (organizations === null || !Array.isArray(organizations)) {
        organizations = []
    }

    if (b2bPermissionKeys === null || !Array.isArray(b2bPermissionKeys)) {
        b2bPermissionKeys = []
    }
    
    Object.keys(b2bPermissions)
        .filter(key => b2bPermissions[key] === true)
        .forEach(key => b2bPermissionKeys.push(key))

    organizations = organizations.filter(Boolean)

    return {
        organizations: organizations.length ? uniq(organizations) : null,
        b2bPermissionKeys: b2bPermissionKeys.length ? uniq(b2bPermissionKeys) : null,
    }
}

module.exports = {
    parseSession,
    makeSessionData,
}