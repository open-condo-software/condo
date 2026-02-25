const { GQLError, GQLErrorCode: { BAD_USER_INPUT, NOT_FOUND } } = require('@open-condo/keystone/errors')
const { getLogger } = require('@open-condo/keystone/logging')
const { GQLCustomSchema, getById } = require('@open-condo/keystone/schema')

const access = require('@address-service/domains/address/access/ResolveAddressDuplicateService')
const { mergeAddresses } = require('@address-service/domains/address/utils/mergeAddresses')
const { Address } = require('@address-service/domains/address/utils/serverSchema')

const logger = getLogger('ResolveAddressDuplicateService')

const RESOLVE_ACTION_MERGE = 'merge'
const RESOLVE_ACTION_DISMISS = 'dismiss'

const ERRORS = {
    ADDRESS_NOT_FOUND: {
        mutation: 'resolveAddressDuplicate',
        code: NOT_FOUND,
        type: 'ADDRESS_NOT_FOUND',
        message: 'Address {addressId} not found',
    },
    NO_POSSIBLE_DUPLICATE_OF: {
        mutation: 'resolveAddressDuplicate',
        code: BAD_USER_INPUT,
        type: 'NO_POSSIBLE_DUPLICATE_OF',
        message: 'Address {addressId} has no possibleDuplicateOf set',
    },
    TARGET_MISSING_OR_SOFT_DELETED: {
        mutation: 'resolveAddressDuplicate',
        code: BAD_USER_INPUT,
        type: 'TARGET_MISSING_OR_SOFT_DELETED',
        message: 'Target Address {targetId} is missing or soft-deleted',
    },
    WINNER_ID_REQUIRED: {
        mutation: 'resolveAddressDuplicate',
        code: BAD_USER_INPUT,
        type: 'WINNER_ID_REQUIRED',
        message: 'winnerId is required for merge action',
    },
    WINNER_ID_MUST_EQUAL_TARGET: {
        mutation: 'resolveAddressDuplicate',
        code: BAD_USER_INPUT,
        type: 'WINNER_ID_MUST_EQUAL_TARGET',
        message: 'winnerId must be equal to possibleDuplicateOf ({targetId})',
    },
    UNKNOWN_ACTION: {
        mutation: 'resolveAddressDuplicate',
        code: BAD_USER_INPUT,
        type: 'UNKNOWN_ACTION',
        message: 'Unknown action: {action}. Must be "merge" or "dismiss"',
    },
}

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
                if (!address || address.deletedAt) {
                    throw new GQLError({
                        ...ERRORS.ADDRESS_NOT_FOUND,
                        messageInterpolation: { addressId },
                    }, context)
                }

                if (!address.possibleDuplicateOf) {
                    throw new GQLError({
                        ...ERRORS.NO_POSSIBLE_DUPLICATE_OF,
                        messageInterpolation: { addressId },
                    }, context)
                }

                const targetId = address.possibleDuplicateOf
                const targetAddress = await getById('Address', targetId)
                if (!targetAddress || targetAddress.deletedAt) {
                    throw new GQLError({
                        ...ERRORS.TARGET_MISSING_OR_SOFT_DELETED,
                        messageInterpolation: { targetId },
                    }, context)
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
                        throw new GQLError(ERRORS.WINNER_ID_REQUIRED, context)
                    }

                    if (winnerId !== targetId) {
                        throw new GQLError({
                            ...ERRORS.WINNER_ID_MUST_EQUAL_TARGET,
                            messageInterpolation: { targetId },
                        }, context)
                    }

                    const loserId = addressId

                    await mergeAddresses(context, winnerId, loserId, dvSender)

                    logger.info({ msg: 'Merged duplicate', winnerId, loserId })
                    return { status: 'merged' }
                }

                throw new GQLError({
                    ...ERRORS.UNKNOWN_ACTION,
                    messageInterpolation: { action },
                }, context)
            },
        },
    ],
})

module.exports = {
    ResolveAddressDuplicateService,
}
