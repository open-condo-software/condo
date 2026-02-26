const { getLogger } = require('@open-condo/keystone/logging')
const { getById } = require('@open-condo/keystone/schema')

const { CHANNEL_USER, CHANNEL_DEFINITIONS } = require('./topic')

const logger = getLogger()

/**
 * Per-channel access checkers map.
 * Key: channel name (e.g. 'organization')
 * Value: async (context, userId, targetId) => boolean
 *
 * The 'user' channel has built-in logic (own channel only) and does not need a checker.
 * @type {Record<string, function>}
 */
let _accessCheckers = {}

/**
 * Register per-channel access checkers for messaging.
 *
 * The 'user' channel has a built-in access rule (own channel only).
 * All other channels (e.g. 'organization') require an explicit checker.
 *
 * @param {Object} config
 * @param {Record<string, function(Object, string, string): Promise<boolean>>} config.accessCheckers
 *   Map of channel name → async (context, userId, targetId) => boolean
 *
 * @example
 *   configure({
 *       accessCheckers: {
 *           organization: async (context, userId, organizationId) => {
 *               const employees = await find('OrganizationEmployee', { ... })
 *               return employees.length > 0
 *           },
 *       },
 *   })
 */
function configure (config = {}) {
    _accessCheckers = config.accessCheckers || {}
}

/**
 * Check if a user has access to a specific topic.
 *
 * Built-in rules:
 *   - user.<userId>: authorized + not deleted + own channel only
 *
 * Configurable rules (via accessCheckers):
 *   - <channel>.<targetId>[.<entity>]: calls registered checker for channel
 *
 * @param {Object} context - Keystone context
 * @param {string} userId
 * @param {string} topic
 * @returns {Promise<{ allowed: boolean, reason?: string, user?: string, [channel: string]: string }>}
 */
async function checkAccess (context, userId, topic) {
    try {
        const parts = topic.split('.')
        const channel = parts[0]

        const user = await getById('User', userId)
        if (!user || user.deletedAt) {
            return { allowed: false, reason: 'User not found or deleted' }
        }

        if (channel === CHANNEL_USER) {
            const topicUserId = parts[1]
            if (topicUserId !== userId) {
                return { allowed: false, reason: 'Cannot access other user channel' }
            }
            return { allowed: true, user: userId }
        }

        const targetId = parts[1]
        if (!targetId) {
            return { allowed: false, reason: `Invalid ${channel} topic: missing target ID` }
        }

        const checker = _accessCheckers[channel]
        if (!checker) {
            logger.error({ msg: 'No access checker registered for channel', channel })
            return { allowed: false, reason: `No access checker for channel: ${channel}` }
        }

        const allowed = await checker(context, userId, targetId)
        if (!allowed) {
            return { allowed: false, reason: `Access denied for ${channel} channel` }
        }

        return { allowed: true, user: userId, [channel]: targetId }
    } catch (error) {
        logger.error({ msg: 'Error checking access', err: error })
        return { allowed: false, reason: 'Internal error' }
    }
}

/**
 * Get channels available to a user.
 * Always includes channels with built-in access (user).
 * Includes other channels only if their access checker approves.
 *
 * @param {Object} context - Keystone context
 * @param {string} userId
 * @param {string} [organizationId]
 * @returns {Promise<Array<{ name: string, topic: string }>>}
 */
async function getAvailableChannels (context, userId, organizationId) {
    try {
        const user = await getById('User', userId)
        if (!user || user.deletedAt) {
            return []
        }

        const channelContext = { userId, organizationId }
        const channels = []

        for (const ch of CHANNEL_DEFINITIONS) {
            if (ch.name === CHANNEL_USER) {
                channels.push(ch.buildAvailableChannel(channelContext))
            } else {
                const checker = _accessCheckers[ch.name]
                const targetId = channelContext[ch.name + 'Id'] || channelContext[ch.name]
                if (targetId && checker) {
                    const allowed = await checker(context, userId, targetId)
                    if (allowed) {
                        channels.push(ch.buildAvailableChannel(channelContext))
                    }
                }
            }
        }

        return channels
    } catch (error) {
        logger.error({ msg: 'Error getting available channels', err: error })
        return []
    }
}

module.exports = { configure, checkAccess, getAvailableChannels }
