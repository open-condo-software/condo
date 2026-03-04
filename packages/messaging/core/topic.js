const fs = require('fs')
const path = require('path')
const { fileURLToPath } = require('url')

const CHANNEL_USER = 'user'
const CHANNEL_ORGANIZATION = 'organization'

const RELAY_SUBSCRIBE_PREFIX = '_MESSAGING.subscribe'
const RELAY_UNSUBSCRIBE_PREFIX = '_MESSAGING.unsubscribe'
const ADMIN_REVOKE_PREFIX = '_MESSAGING.admin.revoke'
const ADMIN_UNREVOKE_PREFIX = '_MESSAGING.admin.unrevoke'
const ADMIN_REVOKE_ORG_PREFIX = '_MESSAGING.admin.revokeOrg'
const ADMIN_UNREVOKE_ORG_PREFIX = '_MESSAGING.admin.unrevokeOrg'

/**
 * Derives an app-specific prefix from the nearest package.json name.
 * @returns {string} e.g. 'condo' for @app/condo
 */
const getAppPrefix = () => {
    const toPath = urlOrPath => urlOrPath instanceof URL ? fileURLToPath(urlOrPath) : urlOrPath

    const cwd = process.cwd()
    let stopAt = 'apps'
    let directory = path.resolve(toPath(cwd) ?? '')
    const { root } = path.parse(directory)
    stopAt = path.resolve(directory, toPath(stopAt) ?? root)
    let packageJsonPath

    while (directory && directory !== stopAt && directory !== root) {
        packageJsonPath = path.isAbsolute('package.json') ? 'package.json' : path.join(directory, 'package.json')

        try {
            const stats = fs.statSync(packageJsonPath, { throwIfNoEntry: false })
            if (stats?.isFile()) {
                break
            }
        } catch (e) { console.error(e) }

        directory = path.dirname(directory)
    }

    return require(packageJsonPath).name.split('/')
        .pop()
        .replace(/:/g, '')
        .replace(/-/g, '_').toLowerCase()
}

const APP_PREFIX = getAppPrefix()

/**
 * Channel definitions registry
 *
 * @typedef {Object} ChannelDefinition
 * @property {string} name - Channel name constant (e.g. 'user', 'organization')
 * @property {function({userId: string, organizationId: string}): string[]} buildRelayPermissions -
 *   Given user context, return PUB allow patterns for relay subscribe topics.
 * @property {function({userId: string, organizationId: string}): {name: string, topic: string}} buildAvailableChannel -
 *   Given user context, return the channel info for the /messaging/channels endpoint.
 * @property {function({userId: string, organizationId: string}): boolean} isAvailable -
 *   Given user context, return true if this channel should be included.
 */
const CHANNEL_DEFINITIONS = [
    {
        name: CHANNEL_USER,
        isAvailable: ({ userId }) => !!userId,
        buildRelayPermissions: ({ userId }) => [
            `${RELAY_SUBSCRIBE_PREFIX}.${userId}.${APP_PREFIX}.${CHANNEL_USER}.${userId}.>`,
        ],
        buildAvailableChannel: ({ userId }) => ({
            name: CHANNEL_USER,
            topic: `${APP_PREFIX}.${CHANNEL_USER}.${userId}.>`,
        }),
    },
    {
        name: CHANNEL_ORGANIZATION,
        isAvailable: ({ organizationId }) => !!organizationId,
        buildRelayPermissions: ({ userId, organizationId }) => [
            `${RELAY_SUBSCRIBE_PREFIX}.${userId}.${APP_PREFIX}.${CHANNEL_ORGANIZATION}.${organizationId}.>`,
        ],
        buildAvailableChannel: ({ organizationId }) => ({
            name: CHANNEL_ORGANIZATION,
            topic: `${APP_PREFIX}.${CHANNEL_ORGANIZATION}.${organizationId}.>`,
        }),
    },
]

/**
 * Build a user channel topic (auto-prefixed with app name).
 * @param {string} userId
 * @param {string} entity - Entity name (e.g. 'notification')
 * @returns {string} e.g. `condo.user.abc-123.notification`
 */
function buildUserTopic (userId, entity) {
    return `${APP_PREFIX}.${CHANNEL_USER}.${userId}.${entity}`
}

/**
 * Build an organization channel topic (auto-prefixed with app name).
 * @param {string} organizationId
 * @param {string} entity - Entity name (e.g. 'ticket', 'ticketComment')
 * @returns {string} e.g. `condo.organization.org-1.ticket`
 */
function buildOrganizationTopic (organizationId, entity) {
    return `${APP_PREFIX}.${CHANNEL_ORGANIZATION}.${organizationId}.${entity}`
}

/**
 * Build a dot-separated topic from tokens (auto-prefixed with app name).
 * @param {...string} tokens
 * @returns {string} e.g. `condo.organization.org-1.ticket`
 */
function buildTopic (...tokens) {
    return [APP_PREFIX, ...tokens].join('.')
}

/**
 * Build the wildcard pattern for relay subscribe (used by server-side relay service).
 * @returns {string} `_MESSAGING.subscribe.>`
 */
function buildRelaySubscribePattern () {
    return `${RELAY_SUBSCRIBE_PREFIX}.>`
}

/**
 * Build the wildcard pattern for relay unsubscribe (used by server-side relay service).
 * @returns {string} `_MESSAGING.unsubscribe.>`
 */
function buildRelayUnsubscribePattern () {
    return `${RELAY_UNSUBSCRIBE_PREFIX}.>`
}

module.exports = {
    CHANNEL_USER,
    CHANNEL_ORGANIZATION,
    CHANNEL_DEFINITIONS,
    RELAY_SUBSCRIBE_PREFIX,
    RELAY_UNSUBSCRIBE_PREFIX,
    ADMIN_REVOKE_PREFIX,
    ADMIN_UNREVOKE_PREFIX,
    ADMIN_REVOKE_ORG_PREFIX,
    ADMIN_UNREVOKE_ORG_PREFIX,
    APP_PREFIX,
    getAppPrefix,
    buildUserTopic,
    buildOrganizationTopic,
    buildTopic,
    buildRelaySubscribePattern,
    buildRelayUnsubscribePattern,
}
