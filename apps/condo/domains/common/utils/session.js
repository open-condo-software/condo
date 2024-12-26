const { Session } = require('express-session')
const get = require('lodash/get')
const uniq = require('lodash/uniq')

const { nonNull } = require('@open-condo/miniapp-utils')

const PAYLOAD_SCHEMA = {
    allowedOrganizations: {
        type: 'array',
        transforms: [_uniqItems, _nonNullItems],
    },
    enabledB2BAppPermissions: {
        type: 'array',
        transforms: [_uniqItems, _nonNullItems],
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
    const enabledB2BAppPermissions = get(session, 'enabledB2BAppPermissions')
    return makeSessionData({
        allowedOrganizations,
        enabledB2BAppPermissions,
    })
}

/**
 * @typedef SessionDataArgs
 * @prop {string[]?} allowedOrganizations - ids
 * @prop {string[]?} enabledB2BAppPermissions - keys
 */

/**
 * @typedef SessionData
 * @property {string[] | null} allowedOrganizations
 * @property {string[] | null } enabledB2BAppPermissions
 */

/**
 * @param {SessionDataArgs?} payload
 * @returns {{allowedOrganizations: string[] | null, enabledB2BAppPermissions: string[] | null}}
 */
function makeSessionData (payload = {}) {
    const parsedPayloadEntries = Object.entries(PAYLOAD_SCHEMA)
        .map(([key, config]) => {
            let value = payload[key]
            if (value === undefined) {
                return [key, true]
            }
            if (value === null) {
                return [key, false]
            }
            if (config.type === 'array') {
                if (!Array.isArray(value)) {
                    value = [value]
                }
                for (let transform of config.transforms) {
                    value = transform(value)
                }
            }
            return [key, value]
        })

    const {
        allowedOrganizations,
        enabledB2BAppPermissions,
    } = Object.fromEntries(parsedPayloadEntries)

    return {
        allowedOrganizations,
        enabledB2BAppPermissions,
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