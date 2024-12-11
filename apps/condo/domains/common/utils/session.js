const { Session } = require('express-session')
const get = require('lodash/get')
const uniq = require('lodash/uniq')

const { nonNull } = require('@open-condo/miniapp-utils/helpers/collections')

const ARGS_CONFIG = {
    arrays: {
        allowedOrganizations: [_uniqItems, _nonNullItems],
        enabledB2BPermissions: [_uniqItems, _nonNullItems],
    },
}

/** Gives restrictions from session. If field === true - no restrictions were made
 *  @param {Session} session
 *  @example
 *  parseSession(context.req.session)
 *  @returns {SessionData}
 * */
function parseSession (session) {
    if (!(session instanceof Session)) {
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
    const arrayArgsEntries = Object.keys(ARGS_CONFIG.arrays)
        .map(key => {
            let value = args[key]
            if (value === null || value === undefined) {
                return [key, true]
            }
            if (!Array.isArray(value)) {
                value = [value]
            }
            for (let transform of ARGS_CONFIG.arrays[key]) {
                value = transform(value)
            }
            return [key, value]
        })

    const {
        allowedOrganizations,
        enabledB2BPermissions,
    } = Object.fromEntries(arrayArgsEntries)

    return {
        allowedOrganizations,
        enabledB2BPermissions,
    }
}

function _uniqItems (array) {
    return uniq(array)
}

function _nonNullItems (array) {
    return array.filter(nonNull)
}

module.exports = {
    parseSession,
    makeSessionData,
}