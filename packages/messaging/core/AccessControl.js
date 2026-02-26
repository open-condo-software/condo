const { getLogger } = require('@open-condo/keystone/logging')
const { getById } = require('@open-condo/keystone/schema')

const { CHANNEL_USER, CHANNEL_ORGANIZATION, CHANNEL_DEFINITIONS } = require('./topic')

const logger = getLogger()

let _isActiveEmployee = null

/**
 * Initialize messaging access control with required dependencies.
 * @param {Object} config
 * @param {Function} config.isActiveEmployee - (context, userId, organizationId) => Promise<boolean>
 */
function configure (config = {}) {
    _isActiveEmployee = config.isActiveEmployee
}

/**
 * Check if a user has access to a specific topic.
 *
 * Channel rules:
 *   - user.<userId>: authorized + not deleted + own channel only
 *   - organization.<orgId>.<entity>: authorized + not deleted + active employee
 *
 * @param {Object} context - Keystone context
 * @param {string} userId
 * @param {string} topic
 * @returns {Promise<{ allowed: boolean, reason?: string, user?: string, organization?: string }>}
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

        if (channel === CHANNEL_ORGANIZATION) {
            const organizationId = parts[1]
            if (!organizationId) {
                return { allowed: false, reason: 'Invalid organization topic' }
            }

            if (!_isActiveEmployee) {
                logger.error({ msg: 'isActiveEmployee not configured' })
                return { allowed: false, reason: 'Internal configuration error' }
            }

            const isEmployee = await _isActiveEmployee(context, userId, organizationId)
            if (!isEmployee) {
                return { allowed: false, reason: 'Not an active employee of this organization' }
            }

            return { allowed: true, user: userId, organization: organizationId }
        }

        return { allowed: false, reason: 'Unknown channel' }
    } catch (error) {
        logger.error({ msg: 'Error checking access', err: error })
        return { allowed: false, reason: 'Internal error' }
    }
}

/**
 * Get channels available to a user.
 * Always includes the user's own channel.
 * Includes organization channel if user is an active employee.
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
            if (ch.name === CHANNEL_ORGANIZATION) {
                if (organizationId && _isActiveEmployee) {
                    const isEmployee = await _isActiveEmployee(context, userId, organizationId)
                    if (isEmployee) {
                        channels.push(ch.buildAvailableChannel(channelContext))
                    }
                }
            } else {
                channels.push(ch.buildAvailableChannel(channelContext))
            }
        }

        return channels
    } catch (error) {
        logger.error({ msg: 'Error getting available channels', err: error })
        return []
    }
}

module.exports = { configure, checkAccess, getAvailableChannels }
