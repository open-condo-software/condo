const omit = require('lodash/omit')

const { GQLError } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { COMMON_ERRORS } = require('@condo/domains/common/constants/errors')
const access = require('@condo/domains/miniapp/access/GetVoIPCallStatusService')
const { CALL_STATUSES } = require('@condo/domains/miniapp/constants')
const { COMMON_VOIP_ERRORS } = require('@condo/domains/miniapp/utils/sendVoIPCallMessage')
const { getCallStatusById, parseCallStatusToken } = require('@condo/domains/miniapp/utils/voip')
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
        query: SERVICE_NAME,
    },
    WRONG_SENDER_FORMAT: {
        ...COMMON_ERRORS.WRONG_SENDER_FORMAT,
        query: SERVICE_NAME,
    },
    TOKEN_INVALID: {
        ...COMMON_VOIP_ERRORS.TOKEN_INVALID,
        query: SERVICE_NAME,
    },
    CALL_NOT_FOUND: {
        ...COMMON_VOIP_ERRORS.CALL_NOT_FOUND,
        query: SERVICE_NAME,
        variable: ['data', 'token'],
    },
}

async function checkLimitsByCall (context, id) {
    await redisGuard.checkCustomLimitCounters(
        `${SERVICE_NAME}-${id}`,
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

                const id = parseCallStatusToken(token)
                if (!id) {
                    throw new GQLError(ERRORS.TOKEN_INVALID, context)
                }

                await checkLimitsByCall(context, id)

                const callStatus = await getCallStatusById(id)
                if (!callStatus) {
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
