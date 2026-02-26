const { getLogger } = require('@open-condo/keystone/logging')
const { composeNonResolveInputHook } = require('@open-condo/keystone/plugins/utils')
const { GQL_SCHEMA_PLUGIN } = require('@open-condo/keystone/plugins/utils/typing')

const { publish } = require('../core/Publisher')
const { buildTopic } = require('../core/topic')

const plugin = (fn) => {
    fn._type = GQL_SCHEMA_PLUGIN
    return fn
}

const logger = getLogger()

/**
 * Keystone schema plugin that automatically publishes entity changes
 * to one or more messaging channels.
 *
 * Publishes to: <appPrefix>.<channel>.<targetId>.<entityName>  (e.g. condo.organization.<orgId>.ticket)
 * Payload: { id: <itemId>, operation: 'create' | 'update' | 'delete' }
 *
 * The app prefix is automatically prepended by buildTopic (derived from package.json
 *
 * Each target in the `targets` array specifies:
 * - `channel` (required) — channel name (e.g. 'organization', 'user')
 * - `field`   (optional) — direct field on `updatedItem` that holds the target ID
 * - `resolve` (optional) — async function to resolve the target ID:
 *     `({ updatedItem, existingItem, operation, context }) => string|null`
 *
 * One of `field` or `resolve` is required per target.
 *
 * @example Direct field (Ticket has organization field)
 *   messaged({ targets: [{ channel: 'organization', field: 'organization' }] })
 *   // → condo.organization.<orgId>.ticket
 *
 * @example Relationship resolution (TicketComment → ticket.organization)
 *   messaged({ targets: [{ channel: 'organization', resolve: async ({ updatedItem }) => {
 *       const ticket = await getById('Ticket', updatedItem.ticket)
 *       return ticket?.organization
 *   }}] })
 *
 * @example Multi-target with holding org (Ticket → org + holding org)
 *   messaged({ targets: [
 *       { channel: 'organization', field: 'organization' },
 *       { channel: 'organization', resolve: async ({ updatedItem }) => {
 *           const links = await find('OrganizationLink', { to: updatedItem.organization, deletedAt: null })
 *           return links[0]?.from || null
 *       }},
 *   ] })
 *
 * @param {Object} config
 * @param {Array<{channel: string, field?: string, resolve?: function}>} config.targets - Publishing targets
 * @returns {Function} Keystone plugin
 */
const messaged = (config = {}) => plugin((schema, { schemaName }) => {
    const { targets } = config

    if (!targets || !Array.isArray(targets) || targets.length === 0) {
        throw new Error(`messaged plugin for "${schemaName}": "targets" array is required`)
    }

    for (const target of targets) {
        if (!target.channel) {
            throw new Error(`messaged plugin for "${schemaName}": each target must have a "channel"`)
        }
        if (!target.field && !target.resolve) {
            throw new Error(`messaged plugin for "${schemaName}": each target must have either "field" or "resolve"`)
        }
    }

    const entityName = schemaName.charAt(0).toLowerCase() + schemaName.slice(1)

    const { hooks: { afterChange: originalHook, ...restHooks } = {}, ...rest } = schema

    const messagedAfterChange = async ({ updatedItem, existingItem, operation, context }) => {
        let messagingOperation = operation

        if (operation === 'update' && updatedItem.deletedAt && !existingItem?.deletedAt) {
            messagingOperation = 'delete'
        }

        const data = { id: updatedItem.id, operation: messagingOperation }

        for (const target of targets) {
            try {
                const targetId = target.field
                    ? updatedItem[target.field]
                    : await target.resolve({ updatedItem, existingItem, operation, context })

                if (!targetId) continue

                const topic = buildTopic(target.channel, targetId, entityName)

                await publish({ topic, data })
            } catch (error) {
                logger.error({
                    msg: 'Failed to publish entity change',
                    entity: entityName,
                    channel: target.channel,
                    err: error,
                })
            }
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
