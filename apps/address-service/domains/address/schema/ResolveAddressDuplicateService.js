const { getLogger } = require('@open-condo/keystone/logging')
const { GQLCustomSchema, getById } = require('@open-condo/keystone/schema')

const access = require('@address-service/domains/address/access/ResolveAddressDuplicateService')
const { mergeAddresses } = require('@address-service/domains/address/utils/mergeAddresses')
const { Address } = require('@address-service/domains/address/utils/serverSchema')

const logger = getLogger('ResolveAddressDuplicateService')

const RESOLVE_ACTION_MERGE = 'merge'
const RESOLVE_ACTION_DISMISS = 'dismiss'

const ResolveAddressDuplicateService = new GQLCustomSchema('ResolveAddressDuplicateService', {
    types: [
        {
            access: true,
            type: 'input ResolveAddressDuplicateInput { dv: Int!, sender: SenderFieldInput!, addressId: ID!, action: String!, winnerId: ID }',
        },
        {
            access: true,
            type: 'type ResolveAddressDuplicateOutput { status: String! }',
        },
    ],

    mutations: [
        {
            access: access.canResolveAddressDuplicate,
            schema: 'resolveAddressDuplicate(data: ResolveAddressDuplicateInput!): ResolveAddressDuplicateOutput',
            resolver: async (parent, args, context) => {
                const { data: { dv, sender, addressId, action, winnerId } } = args
                const dvSender = { dv, sender }

                const address = await getById('Address', addressId)
                if (!address) {
                    throw new Error(`Address ${addressId} not found`)
                }

                if (!address.possibleDuplicateOf) {
                    throw new Error(`Address ${addressId} has no possibleDuplicateOf set`)
                }

                if (action === RESOLVE_ACTION_DISMISS) {
                    // Clear possibleDuplicateOf — addresses remain separate
                    await Address.update(context, addressId, {
                        ...dvSender,
                        possibleDuplicateOf: { disconnectAll: true },
                    })

                    logger.info({ msg: 'Dismissed duplicate', addressId })
                    return { status: 'dismissed' }
                }

                if (action === RESOLVE_ACTION_MERGE) {
                    if (!winnerId) {
                        throw new Error('winnerId is required for merge action')
                    }

                    const targetId = address.possibleDuplicateOf
                    if (winnerId !== addressId && winnerId !== targetId) {
                        throw new Error(`winnerId must be either ${addressId} or ${targetId}`)
                    }

                    const loserId = winnerId === addressId ? targetId : addressId

                    await mergeAddresses(context, winnerId, loserId, dvSender)

                    logger.info({ msg: 'Merged duplicate', winnerId, loserId })
                    return { status: 'merged' }
                }

                throw new Error(`Unknown action: ${action}. Must be "merge" or "dismiss"`)
            },
        },
    ],
})

module.exports = {
    ResolveAddressDuplicateService,
}
