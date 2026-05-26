const omit = require('lodash/omit')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT, NOT_FOUND } } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const access = require('@condo/domains/miniapp/access/GetVoIPCallStatusService')
const { INVALID_CALL_ID_ERROR, CALL_NOT_FOUND_ERROR, CALL_STATUSES } = require('@condo/domains/miniapp/constants')
const { getCallStatus, isCallStatusTokenEqual, isCallIdValid, MIN_CALL_ID_LENGTH, MAX_CALL_ID_LENGTH, parseCallStatusJWTToken } = require('@condo/domains/miniapp/utils/voip')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')

const redisGuard = new RedisGuard()

const GET_VOIP_CALL_STATUS_LIMIT_BY_CALL_WINDOW_DURATION_IN_SECONDS = 60 // 1 minute
const GET_VOIP_CALL_STATUS_LIMIT_BY_CALL_MAX_REQUESTS_PER_WINDOW = 60 // 1 per second basically
const GET_VOIP_CALL_STATUS_LIMIT_BY_USER_WINDOW_DURATION_IN_SECONDS = 60 // 1 minute
const GET_VOIP_CALL_STATUS_LIMIT_BY_USER_MAX_REQUESTS_PER_WINDOW = GET_VOIP_CALL_STATUS_LIMIT_BY_CALL_MAX_REQUESTS_PER_WINDOW * 5 * 3 // 5 people in unit and 3 intercoms 

const SERVICE_NAME = 'getVoIPCallStatus'
const ERRORS = {
    DV_VERSION_MISMATCH: {
        ...COMMON_ERRORS.DV_VERSION_MISMATCH,
        mutation: SERVICE_NAME,
    },
    WRONG_SENDER_FORMAT: {
        ...COMMON_ERRORS.WRONG_SENDER_FORMAT,
        mutation: SERVICE_NAME,
    },
    INVALID_CALL_ID: {
        mutation: SERVICE_NAME,
        variable: ['data', 'callId'],
        type: INVALID_CALL_ID_ERROR,
        code: BAD_USER_INPUT,
        message: `"callId" contains invalid characters or does not have length between ${MIN_CALL_ID_LENGTH} and ${MAX_CALL_ID_LENGTH}`,
    },
    CALL_NOT_FOUND: {
        mutation: SERVICE_NAME,
        type: CALL_NOT_FOUND_ERROR,
        code: NOT_FOUND,
        message: 'Call not found or expired',
    },
}

async function checkLimitsByCall (context, { addressKey, app, callId }) {
    const searchKey = `${app.id}-${addressKey}-${callId}`

    await redisGuard.checkCustomLimitCounters(
        `${SERVICE_NAME}-${searchKey}`,
        GET_VOIP_CALL_STATUS_LIMIT_BY_CALL_WINDOW_DURATION_IN_SECONDS,
        GET_VOIP_CALL_STATUS_LIMIT_BY_CALL_MAX_REQUESTS_PER_WINDOW,
        context,
    )
}

async function checkLimitsByIp (context) {
    const ip = context.req.ip
    const userId = context.authedItem?.id

    const searchKey = `${ip}-${userId}`

    await redisGuard.checkCustomLimitCounters(
        `${SERVICE_NAME}-${searchKey}`,
        GET_VOIP_CALL_STATUS_LIMIT_BY_USER_WINDOW_DURATION_IN_SECONDS,
        GET_VOIP_CALL_STATUS_LIMIT_BY_USER_MAX_REQUESTS_PER_WINDOW,
        context,
    )
}

async function checkLimits (context, { addressKey, app, callId }) {
    const promiseResults = await Promise.allSettled([
        checkLimitsByCall(context, { addressKey, app, callId }),
        checkLimitsByIp(context),
    ])

    const errors = promiseResults.filter(p => p.status === 'rejected').map(p => p.reason)
    if (errors.length) {
        throw new AggregateError(errors)
    }
}

const GetVoIPCallStatusService = new GQLCustomSchema('GetVoIPCallStatusService', {
    types: [
        {
            access: true,
            type: `input GetVoIPCallStatusInput {
                dv: Int!,
                sender: SenderFieldInput!,
                """
                Token with data about the call. Received in voip push messages.
                """
                token: String!,
            }`,
        },
        {
            access: true,
            type: `enum GetVoIPCallStatusCallStatus { ${Object.keys(CALL_STATUSES).join(', ')} }`,
        },
        {
            access: true,
            type: `type GetVoIPCallStatusOutput {
                """
                Status of call
                """
                status: GetVoIPCallStatusCallStatus!
            }`,
        },
    ],

    queries: [
        {
            access: access.canGetVoIPCallStatus,
            schema: 'getVoIPCallStatus(data: GetVoIPCallStatusInput!): GetVoIPCallStatusOutput',
            doc: {
                summary: 'Query to get status of voip call. Cancel push message might not come / take a long time.',
                errors: omit(ERRORS, 'DV_VERSION_MISMATCH', 'WRONG_SENDER_FORMAT'),
            },
            resolver: async (parent, args, context) => {
                const { data: argsData } = args
                const { token } = argsData

                checkDvAndSender(argsData, ERRORS.DV_VERSION_MISMATCH, ERRORS.WRONG_SENDER_FORMAT, context)

                await checkLimitsByIp(context)

                const tokenData = parseCallStatusJWTToken(token)
                if (!tokenData) {
                    throw new GQLError(ERRORS.CALL_NOT_FOUND, context)
                }

                if (!isCallIdValid(tokenData.callId)) {
                    throw new GQLError(ERRORS.INVALID_CALL_ID, context)
                }

                await checkLimitsByCall(context, { addressKey: tokenData.addressKey, app: { id: tokenData.b2cAppId }, callId: tokenData.callId })                
                
                const callStatus = await getCallStatus(tokenData)
                if (!callStatus) {
                    throw new GQLError(ERRORS.CALL_NOT_FOUND, context)
                }

                if (!isCallStatusTokenEqual({ callStatus, callStatusToken: tokenData.callStatusToken })) {
                    throw new GQLError(ERRORS.CALL_NOT_FOUND, context)
                }

                return { status: callStatus.status }
            },
        },
    ],

})

module.exports = {
    GetVoIPCallStatusService,
    ERRORS,
}
