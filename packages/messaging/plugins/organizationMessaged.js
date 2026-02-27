const { getLogger } = require('@open-condo/keystone/logging')
const { composeNonResolveInputHook } = require('@open-condo/keystone/plugins/utils')
const { GQL_SCHEMA_PLUGIN } = require('@open-condo/keystone/plugins/utils/typing')
const { getById, find } = require('@open-condo/keystone/schema')

const { publish } = require('../core/Publisher')
const { CHANNEL_ORGANIZATION } = require('../core/topic')
const { buildTopic } = require('../core/topic')

const plugin = (fn) => {
    fn._type = GQL_SCHEMA_PLUGIN
    return fn
}

const logger = getLogger()

/**
 * Keystone schema plugin that publishes entity changes to organization channel.
 *
 * Automatically resolves the organization ID using the same pattern as
 * addOrganizationFieldPlugin, and publishes to both the direct organization
 * and the holding organization (via OrganizationLink) if one exists.
 *
 * @example Model with direct organization field (e.g. Ticket)
 *   organizationMessaged()
 *   // → publishes to condo.organization.<orgId>.ticket
 *   // → publishes to condo.organization.<holdingOrgId>.ticket (if holding exists)
 *
 * @example Model without organization field (e.g. TicketComment → ticket.organization)
 *   organizationMessaged({ fromField: 'ticket' })
 *   // resolves organization via getById(Ticket, updatedItem.ticket).organization
 *
 * @param {Object} [config]
 * @param {string} [config.fromField] - Relationship field to resolve organization from.
 *   If omitted, uses `updatedItem.organization` directly.
 * @returns {Function} Keystone plugin
 */
const organizationMessaged = (config = {}) => plugin(({ fields = {}, hooks: { afterChange: originalHook, ...restHooks } = {}, ...rest }, { schemaName }) => {
    const { fromField } = config
    const entityName = schemaName.charAt(0).toLowerCase() + schemaName.slice(1)

    const resolveOrganizationId = async (updatedItem) => {
        if (fromField) {
            const relatedId = updatedItem[fromField]
            if (!relatedId) return null

            const refSchemaName = fields[fromField].ref
            const relatedObj = await getById(refSchemaName, relatedId)
            return relatedObj?.organization || null
        }

        return updatedItem.organization || null
    }

    const resolveHoldingOrganizationId = async (organizationId) => {
        if (!organizationId) return null

        const links = await find('OrganizationLink', {
            to: { id: organizationId },
            deletedAt: null,
        })

        return links[0]?.from || null
    }

    const messagedAfterChange = async ({ updatedItem, existingItem, operation }) => {
        let messagingOperation = operation
        if (operation === 'update' && updatedItem.deletedAt && !existingItem?.deletedAt) {
            messagingOperation = 'delete'
        }

        const data = { id: updatedItem.id, operation: messagingOperation }

        try {
            const organizationId = await resolveOrganizationId(updatedItem)
            if (!organizationId) return

            const topic = buildTopic(CHANNEL_ORGANIZATION, organizationId, entityName)
            await publish({ topic, data })

            const holdingOrgId = await resolveHoldingOrganizationId(organizationId)
            if (holdingOrgId) {
                const holdingTopic = buildTopic(CHANNEL_ORGANIZATION, holdingOrgId, entityName)
                await publish({ topic: holdingTopic, data })
            }
        } catch (error) {
            logger.error({
                msg: 'Failed to publish organization entity change',
                entity: entityName,
                err: error,
            })
        }
    }

    const afterChange = composeNonResolveInputHook(originalHook, messagedAfterChange)

    return {
        fields,
        hooks: {
            afterChange,
            ...restHooks,
        },
        ...rest,
    }
})

module.exports = {
    organizationMessaged,
}
