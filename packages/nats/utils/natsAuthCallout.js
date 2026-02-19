const { getById } = require('@open-condo/keystone/schema')

const { streamRegistry } = require('../streams')

// Module-level storage for injected dependencies
let _getPermittedOrganizations = null

/**
 * Initialize NATS auth utilities with required dependencies
 * @param {Object} config
 * @param {Function} config.getPermittedOrganizations - Function to get organizations where user has permissions
 */
function configure (config = {}) {
    _getPermittedOrganizations = config.getPermittedOrganizations
}

async function checkNatsAccess (context, userId, organizationId, subject) {
    try {
        const streamName = subject.split('.')[0]
        const streamConfig = streamRegistry.get(streamName)

        if (!streamConfig) {
            return { allowed: false, reason: 'Stream not found' }
        }

        const accessConfig = streamConfig.access?.read

        if (!accessConfig) {
            return { allowed: false, reason: 'No access configuration for stream' }
        }

        const user = await getById('User', userId)
        if (!user || user.deletedAt) {
            return { allowed: false, reason: 'User not found or deleted' }
        }

        if (typeof accessConfig === 'function') {
            const authentication = { item: user }
            const allowed = await accessConfig({ authentication, context, organizationId, subject })

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
                console.error('[NATS Auth] getPermittedOrganizations not configured')
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
        console.error('[NATS Auth] Error:', error)
        return { allowed: false, reason: 'Internal error' }
    }
}

async function getAvailableStreams (context, userId, organizationId) {
    try {
        const user = await getById('User', userId)
        if (!user || user.deletedAt) {
            return []
        }

        const allStreams = streamRegistry.getAll()
        const availableStreams = []

        for (const streamConfig of allStreams) {
            try {
                const accessConfig = streamConfig.access?.read

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
                        console.error('[NATS] getPermittedOrganizations not configured')
                        hasAccess = false
                    }
                } else if (typeof accessConfig === 'function') {
                    const authentication = { item: user }
                    const testSubject = `${streamConfig.name}.${organizationId}`
                    hasAccess = await accessConfig({ authentication, context, organizationId, subject: testSubject })
                }

                if (hasAccess) {
                    availableStreams.push({
                        name: streamConfig.name,
                        subjects: streamConfig.subjects,
                        ...(permission && { permission }),
                    })
                }
            } catch (error) {
                // streamConfig.name is a controlled value from the internal stream registry, not user input
                // nosemgrep: javascript.lang.security.audit.unsafe-formatstring.unsafe-formatstring
                console.error(`[NATS] Error checking access for stream ${streamConfig.name}:`, error)
            }
        }

        return availableStreams
    } catch (error) {
        console.error('[NATS] Error getting available streams:', error)
        return []
    }
}

module.exports = { configure, checkNatsAccess, getAvailableStreams }
