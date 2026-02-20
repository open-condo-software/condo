const { getLogger } = require('@open-condo/keystone/logging')
const { getById } = require('@open-condo/keystone/schema')

const { channelRegistry } = require('./ChannelRegistry')

const logger = getLogger()

let _getPermittedOrganizations = null

/**
 * Initialize messaging access control with required dependencies.
 * @param {Object} config
 * @param {Function} config.getPermittedOrganizations - Function to get organizations where user has permissions
 */
function configure (config = {}) {
    _getPermittedOrganizations = config.getPermittedOrganizations
}

/**
 * Check if a user has access to a specific topic.
 * @param {Object} context - Keystone context
 * @param {string} userId
 * @param {string} organizationId
 * @param {string} topic
 * @returns {Promise<{ allowed: boolean, reason?: string, user?: string, organization?: string }>}
 */
async function checkAccess (context, userId, organizationId, topic) {
    try {
        const channelName = topic.split('.')[0]
        const channelConfig = channelRegistry.get(channelName)

        if (!channelConfig) {
            return { allowed: false, reason: 'Channel not found' }
        }

        const accessConfig = channelConfig.access?.read

        if (!accessConfig) {
            return { allowed: false, reason: 'No access configuration for channel' }
        }

        const user = await getById('User', userId)
        if (!user || user.deletedAt) {
            return { allowed: false, reason: 'User not found or deleted' }
        }

        if (typeof accessConfig === 'function') {
            const authentication = { item: user }
            const allowed = await accessConfig({ authentication, context, organizationId, topic })

            if (allowed) {
                return { allowed: true, user: userId, organization: organizationId }
            }
            return { allowed: false, reason: 'Access denied by custom function' }
        }

        if (accessConfig === true) {
            return { allowed: true }
        }

        if (typeof accessConfig === 'string') {
            if (!_getPermittedOrganizations) {
                logger.error({ msg: 'getPermittedOrganizations not configured' })
                return { allowed: false, reason: 'Internal configuration error' }
            }

            const organizations = await _getPermittedOrganizations(context, user, [accessConfig])
            const hasAccess = organizations.includes(organizationId)

            if (hasAccess) {
                return { allowed: true, user: userId, organization: organizationId }
            }
            return { allowed: false, reason: 'Permission denied' }
        }

        return { allowed: false, reason: 'Invalid access configuration' }
    } catch (error) {
        logger.error({ msg: 'Error checking access', err: error })
        return { allowed: false, reason: 'Internal error' }
    }
}

/**
 * Get all channels available to a user in a given organization.
 * @param {Object} context - Keystone context
 * @param {string} userId
 * @param {string} organizationId
 * @returns {Promise<Array<{ name: string, topics: string[], permission?: string }>>}
 */
async function getAvailableChannels (context, userId, organizationId) {
    try {
        const user = await getById('User', userId)
        if (!user || user.deletedAt) {
            return []
        }

        const allChannels = channelRegistry.getAll()
        const availableChannels = []

        for (const channelConfig of allChannels) {
            try {
                const accessConfig = channelConfig.access?.read

                if (!accessConfig) {
                    continue
                }

                let hasAccess = false
                let permission = null

                if (accessConfig === true) {
                    hasAccess = true
                } else if (typeof accessConfig === 'string') {
                    permission = accessConfig
                    if (_getPermittedOrganizations) {
                        const organizations = await _getPermittedOrganizations(context, user, [permission])
                        hasAccess = organizations.includes(organizationId)
                    } else {
                        logger.error({ msg: 'getPermittedOrganizations not configured' })
                        hasAccess = false
                    }
                } else if (typeof accessConfig === 'function') {
                    const authentication = { item: user }
                    const testTopic = `${channelConfig.name}.${organizationId}`
                    hasAccess = await accessConfig({ authentication, context, organizationId, topic: testTopic })
                }

                if (hasAccess) {
                    availableChannels.push({
                        name: channelConfig.name,
                        topics: channelConfig.topics,
                        ...(permission && { permission }),
                    })
                }
            } catch (error) {
                logger.error({ msg: 'Error checking access for channel', channel: channelConfig.name, err: error })
            }
        }

        return availableChannels
    } catch (error) {
        logger.error({ msg: 'Error getting available channels', err: error })
        return []
    }
}

module.exports = { configure, checkAccess, getAvailableChannels }
