const get = require('lodash/get')
const isEmpty = require('lodash/isEmpty')
const pick = require('lodash/pick')

const conf = require('@open-condo/config')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT, INTERNAL_ERROR } } = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { WRONG_PHONE_FORMAT } = require('@condo/domains/common/constants/errors')
const { DV_VERSION_MISMATCH, WRONG_FORMAT } = require('@condo/domains/common/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { SMS_VERIFY_CODE_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const {
    SMS_CODE_TTL,
    CONFIRM_PHONE_ACTION_EXPIRY,
    LOCK_TIMEOUT,
    CONFIRM_PHONE_SMS_MAX_RETRIES,
} = require('@condo/domains/user/constants/common')
const {
    MAX_SMS_FOR_IP_BY_DAY,
    MAX_SMS_FOR_PHONE_BY_DAY,
} = require('@condo/domains/user/constants/common')
const {
    CAPTCHA_CHECK_FAILED,
    UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
    SMS_CODE_EXPIRED,
    SMS_CODE_MAX_RETRIES_REACHED,
    SMS_CODE_VERIFICATION_FAILED,
    GQL_ERRORS,
    GENERATE_TOKEN_FAILED,
} = require('@condo/domains/user/constants/errors')
const { SMS_COUNTER_LIMIT_TYPE } = require('@condo/domains/user/constants/limits')
const { captchaCheck } = require('@condo/domains/user/utils/hCaptcha')
const {
    User,
    ConfirmPhoneAction,
    generateSmsCode,
} = require('@condo/domains/user/utils/serverSchema')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')
const { TOKEN_TYPES, generateTokenSafely } = require('@condo/domains/user/utils/tokens')


const redisGuard = new RedisGuard()

const ERRORS = {
    DV_VERSION_MISMATCH: {
        variable: ['data', 'dv'],
        code: BAD_USER_INPUT,
        type: DV_VERSION_MISMATCH,
        message: 'Wrong value for data version number',
    },
    WRONG_SENDER_FORMAT: {
        variable: ['data', 'sender'],
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        message: 'Invalid format of "sender" field value. {details}',
        correctExample: '{ "dv": 1, "fingerprint": "uniq-device-or-container-id" }',
        messageInterpolation: { details: 'Please, check the example for details' },
    },
    CAPTCHA_CHECK_FAILED: {
        variable: ['data', 'captcha'],
        code: BAD_USER_INPUT,
        type: CAPTCHA_CHECK_FAILED,
        message: 'Failed to check CAPTCHA',
        messageForUser: 'api.user.CAPTCHA_CHECK_FAILED',
    },
    UNABLE_TO_FIND_CONFIRM_PHONE_ACTION: {
        variable: ['data', 'token'],
        code: BAD_USER_INPUT,
        type: UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
        message: 'Confirm phone action was expired or it could not be found. Try to initiate phone confirmation again',
        messageForUser: 'api.user.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION',
    },
    WRONG_PHONE_FORMAT: {
        mutation: 'startConfirmPhoneAction',
        variable: ['data', 'phone'],
        code: BAD_USER_INPUT,
        type: WRONG_PHONE_FORMAT,
        message: 'Wrong format of provided phone number',
        correctExample: '+79991234567',
        messageForUser: 'api.common.WRONG_PHONE_FORMAT',
    },
    PHONE_AND_USER_ID_IS_MISSING: {
        mutation: 'startConfirmPhoneAction',
        code: BAD_USER_INPUT,
        type: 'PHONE_AND_USER_ID_IS_MISSING',
        message: 'Phone or user id is missing',
        messageForUser: 'api.user.startConfirmPhoneAction.PHONE_AND_USER_ID_IS_MISSING',
    },
    SHOULD_BE_ONE_IDENTIFIER_ONLY: {
        mutation: 'startConfirmPhoneAction',
        code: BAD_USER_INPUT,
        type: 'SHOULD_BE_ONE_IDENTIFIER_ONLY',
        message: 'You need to pass either only the phone or only the userId',
        messageForUser: 'api.user.startConfirmPhoneAction.SHOULD_BE_ONE_IDENTIFIER_ONLY',
    },
    SMS_CODE_EXPIRED: {
        mutation: 'completeConfirmPhoneAction',
        variable: ['data', 'smsCode'],
        code: BAD_USER_INPUT,
        type: SMS_CODE_EXPIRED,
        message: 'SMS code expired. Try to initiate phone confirmation again',
        messageForUser: 'api.user.completeConfirmPhoneAction.SMS_CODE_EXPIRED',
    },
    SMS_CODE_MAX_RETRIES_REACHED: {
        mutation: 'completeConfirmPhoneAction',
        variable: ['data', 'smsCode'],
        code: BAD_USER_INPUT,
        type: SMS_CODE_MAX_RETRIES_REACHED,
        message: 'Max retries reached for SMS code confirmation. Try to initiate phone confirmation again',
        messageForUser: 'api.user.completeConfirmPhoneAction.SMS_CODE_MAX_RETRIES_REACHED',
    },
    SMS_CODE_VERIFICATION_FAILED: {
        mutation: 'completeConfirmPhoneAction',
        variable: ['data', 'smsCode'],
        code: BAD_USER_INPUT,
        type: SMS_CODE_VERIFICATION_FAILED,
        message: 'SMS code verification mismatch',
        messageForUser: 'api.user.completeConfirmPhoneAction.SMS_CODE_VERIFICATION_FAILED',
    },
    GENERATE_TOKEN_ERROR: {
        mutation: 'completeConfirmPhoneAction',
        code: INTERNAL_ERROR,
        type: GENERATE_TOKEN_FAILED,
        message: 'Generate token failed',
    },
}

const phoneWhiteList = Object.keys(conf.SMS_WHITE_LIST ? JSON.parse(conf.SMS_WHITE_LIST) : {})
const ipWhiteList = conf.IP_WHITE_LIST ? JSON.parse(conf.IP_WHITE_LIST) : []
const maxSmsForIpByDay = Number(conf['MAX_SMS_FOR_IP_BY_DAY']) || MAX_SMS_FOR_IP_BY_DAY
const maxSmsForPhoneByDay = Number(conf['MAX_SMS_FOR_PHONE_BY_DAY']) || MAX_SMS_FOR_PHONE_BY_DAY
const APP_ID_HEADER = 'x-request-app'

const checkSMSDayLimitCounters = async (phone, rawIp, context) => {
    const ip = rawIp.split(':').pop()
    const byPhoneCounter = await redisGuard.incrementDayCounter(`${SMS_COUNTER_LIMIT_TYPE}:${phone}`)
    if (byPhoneCounter > maxSmsForPhoneByDay && !phoneWhiteList.includes(phone)) {
        throw new GQLError(GQL_ERRORS.SMS_FOR_PHONE_DAY_LIMIT_REACHED, context)
    }
    const byIpCounter = await redisGuard.incrementDayCounter(`${SMS_COUNTER_LIMIT_TYPE}:${ip}`)
    if (byIpCounter > maxSmsForIpByDay && !ipWhiteList.includes(ip)) {
        throw new GQLError(GQL_ERRORS.SMS_FOR_IP_DAY_LIMIT_REACHED, context)
    }
}

const ConfirmPhoneActionService = new GQLCustomSchema('ConfirmPhoneActionService', {
    types: [
        {
            access: true,
            type: 'input GetPhoneByConfirmPhoneActionTokenInput { token: String!, captcha: String! }',
        },
        {
            access: true,
            type: 'type GetPhoneByConfirmPhoneActionTokenOutput { phone: String!, isPhoneVerified: Boolean! }',
        },
        {
            access: true,
            type: 'input StartConfirmPhoneActionInput { dv: Int!, sender: SenderFieldInput!, captcha: String!, phone: String, user: UserWhereUniqueInput }',
        },
        {
            access: true,
            type: 'type StartConfirmPhoneActionOutput { token: String! }',
        },
        {
            access: true,
            type: 'input ResendConfirmPhoneActionSmsInput { dv: Int!, sender: SenderFieldInput!, captcha: String!, token: String! }',
        },
        {
            access: true,
            type: 'type ResendConfirmPhoneActionSmsOutput { status: String! }',
        },
        {
            access: true,
            type: 'input CompleteConfirmPhoneActionInput { dv: Int!, sender: SenderFieldInput!, captcha: String!, token: String!, smsCode: Int! }',
        },
        {
            access: true,
            type: 'type CompleteConfirmPhoneActionOutput { status: String! }',
        },
    ],
    queries: [
        {
            access: true,
            schema: 'getPhoneByConfirmPhoneActionToken(data: GetPhoneByConfirmPhoneActionTokenInput!): GetPhoneByConfirmPhoneActionTokenOutput',
            doc: {
                summary: 'Returns phone number information from ConfirmPhoneAction, that matches provided search conditions',
                errors: pick(ERRORS, [
                    CAPTCHA_CHECK_FAILED,
                    UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
                ]),
            },
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                const { token, captcha } = data
                const { error } = await captchaCheck(context, captcha)
                if (error) {
                    throw new GQLError({ ...ERRORS.CAPTCHA_CHECK_FAILED, mutation: 'getPhoneByConfirmPhoneActionToken', data: { error } }, context)
                }
                const now = extra.extraNow || Date.now()
                const actions = await ConfirmPhoneAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                }, 'phone isPhoneVerified')
                if (isEmpty(actions)) {
                    throw new GQLError({ ...ERRORS.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION, mutation: 'getPhoneByConfirmPhoneActionToken' }, context)
                }
                const { phone, isPhoneVerified } = actions[0]
                return { phone, isPhoneVerified }
            },
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'startConfirmPhoneAction(data: StartConfirmPhoneActionInput!): StartConfirmPhoneActionOutput',
            doc: {
                summary: 'Send confirmation phone SMS message and return confirmation token. You can use the token for completeConfirmPhoneAction mutation. And then use the token in other mutations to prove that the phone number is verified',
                errors: {
                    ...pick(ERRORS, [
                        CAPTCHA_CHECK_FAILED,
                        WRONG_PHONE_FORMAT,
                    ]),
                    TOO_MANY_REQUESTS: GQL_ERRORS.TOO_MANY_REQUESTS,
                    SMS_FOR_PHONE_DAY_LIMIT_REACHED: GQL_ERRORS.SMS_FOR_PHONE_DAY_LIMIT_REACHED,
                    SMS_FOR_IP_DAY_LIMIT_REACHED: GQL_ERRORS.SMS_FOR_IP_DAY_LIMIT_REACHED,
                },
            },
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                const {
                    phone: phoneFromInput,
                    user: userFromInput,
                    sender,
                    captcha,
                } = data

                checkDvAndSender(
                    data,
                    { ...ERRORS.DV_VERSION_MISMATCH, mutation: 'startConfirmPhoneAction' },
                    { ...ERRORS.WRONG_SENDER_FORMAT, mutation: 'startConfirmPhoneAction' },
                    context
                )

                if (!phoneFromInput && !userFromInput?.id) {
                    throw new GQLError(ERRORS.PHONE_AND_USER_ID_IS_MISSING, context)
                }
                if (phoneFromInput && userFromInput?.id) {
                    throw new GQLError(ERRORS.SHOULD_BE_ONE_IDENTIFIER_ONLY, context)
                }

                const { error } = await captchaCheck(context, captcha)
                if (error) {
                    throw new GQLError({
                        ...ERRORS.CAPTCHA_CHECK_FAILED,
                        mutation: 'startConfirmPhoneAction',
                        data: { error },
                    }, context)
                }

                let phone

                if (userFromInput?.id) {
                    const user = await User.getOne(context, { id: userFromInput.id, deletedAt: null }, 'id phone')
                    phone = user?.phone || null
                } else {
                    phone = phoneFromInput
                }

                const normalizedPhone = normalizePhone(phone)
                if (!normalizedPhone) {
                    throw new GQLError(ERRORS.WRONG_PHONE_FORMAT, context)
                }

                await checkSMSDayLimitCounters(normalizedPhone, context.req.ip, context)
                await redisGuard.checkLock(normalizedPhone, 'sendsms', context)
                await redisGuard.lock(normalizedPhone, 'sendsms', SMS_CODE_TTL)
                const { error: tokenError, token } = generateTokenSafely(TOKEN_TYPES.CONFIRM_PHONE)
                if (tokenError) {
                    throw new GQLError({ ...ERRORS.GENERATE_TOKEN_ERROR, data: { error: tokenError } }, context)
                }
                const now = extra.extraNow || Date.now()
                const requestedAt = new Date(now).toISOString()
                const expiresAt = new Date(now + CONFIRM_PHONE_ACTION_EXPIRY * 1000).toISOString()
                const smsCode = generateSmsCode(normalizedPhone)
                const smsCodeRequestedAt = new Date(now).toISOString()
                const smsCodeExpiresAt = new Date(now + SMS_CODE_TTL * 1000).toISOString()
                const variables = {
                    dv: 1,
                    sender,
                    phone: normalizedPhone,
                    smsCode,
                    token,
                    smsCodeRequestedAt,
                    smsCodeExpiresAt,
                    requestedAt,
                    expiresAt,
                }

                const isInvalidData = await redisGuard.isLocked(captcha, 'validation-failed')
                if (isInvalidData) return { token }

                await ConfirmPhoneAction.create(context, variables)

                const appId = get(context.req, ['headers', APP_ID_HEADER])

                await sendMessage(context, {
                    to: { phone: normalizedPhone },
                    type: SMS_VERIFY_CODE_MESSAGE_TYPE,
                    meta: {
                        dv: 1,
                        smsCode,
                        appId,
                    },
                    sender: sender,
                })

                return { token }
            },
        },
        {
            access: true,
            schema: 'resendConfirmPhoneActionSms(data: ResendConfirmPhoneActionSmsInput!): ResendConfirmPhoneActionSmsOutput',
            doc: {
                summary: 'Resend the confirm phone SMS message for existing token',
                errors: {
                    ...pick(ERRORS, [
                        CAPTCHA_CHECK_FAILED,
                        UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
                    ]),
                    TOO_MANY_REQUESTS: GQL_ERRORS.TOO_MANY_REQUESTS,
                    SMS_FOR_PHONE_DAY_LIMIT_REACHED: GQL_ERRORS.SMS_FOR_PHONE_DAY_LIMIT_REACHED,
                    SMS_FOR_IP_DAY_LIMIT_REACHED: GQL_ERRORS.SMS_FOR_IP_DAY_LIMIT_REACHED,
                },
            },
            resolver: async (parent, args, context, info, extra) => {
                const { data } = args
                const { token, sender, captcha } = data
                checkDvAndSender(data, { ...ERRORS.DV_VERSION_MISMATCH, mutation: 'resendConfirmPhoneActionSms' }, { ...ERRORS.WRONG_SENDER_FORMAT, mutation: 'resendConfirmPhoneActionSms' }, context)
                const { error } = await captchaCheck(context, captcha)
                if (error) {
                    throw new GQLError({ ...ERRORS.CAPTCHA_CHECK_FAILED, mutation: 'resendConfirmPhoneActionSms', data: { error } }, context)
                }
                const now = extra.extraNow || Date.now()
                const actions = await ConfirmPhoneAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                }, 'id phone')
                if (isEmpty(actions)) {
                    throw new GQLError({ ...ERRORS.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION, mutation: 'resendConfirmPhoneActionSms' }, context)
                }
                const { id, phone } = actions[0]
                await checkSMSDayLimitCounters(phone, context.req.ip, context)
                await redisGuard.checkLock(phone, 'sendsms', context)
                await redisGuard.lock(phone, 'sendsms', SMS_CODE_TTL)
                const newSmsCode = generateSmsCode(phone)
                await ConfirmPhoneAction.update(context, id, {
                    dv: 1,
                    sender,
                    smsCode: newSmsCode,
                    smsCodeExpiresAt: new Date(now + SMS_CODE_TTL * 1000).toISOString(),
                    smsCodeRequestedAt: new Date(now).toISOString(),
                })
                const appId = get(context.req, ['headers', APP_ID_HEADER])
                await sendMessage(context, {
                    to: { phone },
                    type: SMS_VERIFY_CODE_MESSAGE_TYPE,
                    meta: {
                        dv: 1,
                        smsCode: newSmsCode,
                        appId,
                    },
                    sender,
                })
                return { status: 'ok' }
            },
        },
        {
            access: true,
            schema: 'completeConfirmPhoneAction(data: CompleteConfirmPhoneActionInput!): CompleteConfirmPhoneActionOutput',
            doc: {
                summary: 'The final step of a phone number confirmation. You should use the token from startConfirmPhoneAction and a secret code from the confirm phone SMS message. After success call, you can use the token in other mutations to prove that you have access to the phone number',
                errors: {
                    ...pick(ERRORS, [
                        CAPTCHA_CHECK_FAILED,
                        UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
                        SMS_CODE_EXPIRED,
                        SMS_CODE_MAX_RETRIES_REACHED,
                        SMS_CODE_VERIFICATION_FAILED,
                    ]),
                    TOO_MANY_REQUESTS: GQL_ERRORS.TOO_MANY_REQUESTS,
                },
            },
            resolver: async (parent, args, context, info, extra) => {
                const { data } = args
                const { token, smsCode, sender, captcha } = data
                checkDvAndSender(data, { ...ERRORS.DV_VERSION_MISMATCH, mutation: 'completeConfirmPhoneAction' }, { ...ERRORS.WRONG_SENDER_FORMAT, mutation: 'completeConfirmPhoneAction' }, context)
                const { error } = await captchaCheck(context, captcha)
                if (error) {
                    throw new GQLError({ ...ERRORS.CAPTCHA_CHECK_FAILED, mutation: 'completeConfirmPhoneAction', data: { error } }, context)
                }
                const now = extra.extraNow || Date.now()
                const actions = await ConfirmPhoneAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                }, 'id smsCode retries smsCodeExpiresAt')
                if (isEmpty(actions)) {
                    throw new GQLError({ ...ERRORS.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION, mutation: 'completeConfirmPhoneAction' }, context)
                }
                await redisGuard.checkLock(token, 'confirm', context)
                await redisGuard.lock(token, 'confirm', LOCK_TIMEOUT)
                const { id, smsCode: actionSmsCode, retries, smsCodeExpiresAt } = actions[0]
                const isExpired = (new Date(smsCodeExpiresAt) < new Date(now))
                if (isExpired) {
                    throw new GQLError(ERRORS.SMS_CODE_EXPIRED, context)
                }
                if (retries >= CONFIRM_PHONE_SMS_MAX_RETRIES) {
                    await ConfirmPhoneAction.update(context, id, {
                        dv: 1,
                        sender,
                        completedAt: new Date(now).toISOString(),
                    })
                    throw new GQLError(ERRORS.SMS_CODE_MAX_RETRIES_REACHED, context)
                }
                if (actionSmsCode !== smsCode) {
                    await ConfirmPhoneAction.update(context, id, {
                        dv: 1,
                        sender,
                        retries: retries + 1,
                    })
                    throw new GQLError(ERRORS.SMS_CODE_VERIFICATION_FAILED, context)
                }
                await ConfirmPhoneAction.update(context, id, {
                    dv: 1,
                    sender,
                    isPhoneVerified: true,
                })
                return { status: 'ok' }
            },
        },
    ],
})

module.exports = {
    ConfirmPhoneActionService,
}
