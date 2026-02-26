const { getLogger } = require('@open-condo/keystone/logging')
const { composeNonResolveInputHook } = require('@open-condo/keystone/plugins/utils')
const { GQL_SCHEMA_PLUGIN } = require('@open-condo/keystone/plugins/utils/typing')

const { publish } = require('../core/Publisher')
const { buildOrganizationTopic } = require('../core/topic')

const logger = getLogger()

const plugin = (fn) => {
    fn._type = GQL_SCHEMA_PLUGIN
    return fn
}

/**
 * Keystone schema plugin that automatically publishes entity changes
 * to the organization messaging channel.
 *
 * Publishes to: organization.<orgId>.<entityName>
 * Payload: { id: <itemId>, operation: 'create' | 'update' | 'delete' }
 *
 * Usage:
 *   const Ticket = new GQLListSchema('Ticket', {
 *       plugins: [messaged({ organizationField: 'organization' })],
 *       ...
 *   })
 *
 * @param {Object} [config]
 * @param {string} [config.organizationField='organization'] - Field name that holds the organization reference
 * @returns {Function} Keystone plugin
 */
const messaged = (config = {}) => plugin((schema, { schemaName }) => {
    const organizationField = config.organizationField || 'organization'
    const entityName = schemaName.charAt(0).toLowerCase() + schemaName.slice(1)

    const { hooks: { afterChange: originalHook, ...restHooks } = {}, ...rest } = schema

    const messagedAfterChange = async ({ updatedItem, existingItem, operation }) => {
        try {
            const orgId = updatedItem[organizationField]
            if (!orgId) return

            let messagingOperation = operation

            if (operation === 'update' && updatedItem.deletedAt && !existingItem?.deletedAt) {
                messagingOperation = 'delete'
            }

            const topic = buildOrganizationTopic(orgId, entityName)

            await publish({
                topic,
                data: { id: updatedItem.id, operation: messagingOperation },
            })
        } catch (error) {
            logger.error({ msg: 'Failed to publish entity change', entity: entityName, err: error })
        }
    }

    const afterChange = composeNonResolveInputHook(originalHook, messagedAfterChange)

    return {
        hooks: {
            afterChange,
            ...restHooks,
        },
        ...rest,
    }
})

module.exports = {
    messaged,
}
