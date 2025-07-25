/**
 * Generated by `createservice user.ConfirmEmailActionService --type mutations`
 */

const pick = require('lodash/pick')

const conf = require('@open-condo/config')
const {
    GQLError,
    GQLErrorCode: { BAD_USER_INPUT, INTERNAL_ERROR },
} = require('@open-condo/keystone/errors')
const { checkDvAndSender } = require('@open-condo/keystone/plugins/dvAndSender')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const {
    DV_VERSION_MISMATCH,
    WRONG_FORMAT,
    WRONG_EMAIL_VALUE,
} = require('@condo/domains/common/constants/errors')
const { normalizeEmail } = require('@condo/domains/common/utils/mail')
const { EMAIL_VERIFY_CODE_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const {
    CONFIRM_EMAIL_ACTION_EXPIRY,
    CONFIRM_EMAIL_MAX_RETRIES,
    LOCK_TIMEOUT,
    EMAIL_CODE_TTL,
    MAX_EMAIL_FOR_IP_BY_DAY: DEFAULT_MAX_EMAIL_FOR_IP_BY_DAY,
    MAX_EMAIL_FOR_EMAIL_ADDRESS_BY_DAY: DEFAULT_MAX_EMAIL_FOR_EMAIL_ADDRESS_BY_DAY,
} = require('@condo/domains/user/constants/common')
const {
    CAPTCHA_CHECK_FAILED,
    UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION,
    GENERATE_TOKEN_FAILED,
    EMAIL_CODE_EXPIRED,
    EMAIL_CODE_MAX_RETRIES_REACHED,
    EMAIL_CODE_VERIFICATION_FAILED,
} = require('@condo/domains/user/constants/errors')
const { captchaCheck } = require('@condo/domains/user/utils/hCaptcha')
const {
    ConfirmEmailAction,
    generateSecureCode,
} = require('@condo/domains/user/utils/serverSchema')
const { getGuardKey } = require('@condo/domains/user/utils/serverSchema/confirmEmailAction')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')
const { generateTokenSafely, TOKEN_TYPES } = require('@condo/domains/user/utils/tokens')


/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
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
    UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION: {
        variable: ['data', 'token'],
        code: BAD_USER_INPUT,
        type: UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION,
        message: 'Confirm email action was expired or it could not be found. Try to initiate email confirmation again',
        messageForUser: 'api.user.UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION',
    },
    WRONG_EMAIL_FORMAT: {
        mutation: 'startConfirmEmailAction',
        variable: ['data', 'email'],
        code: BAD_USER_INPUT,
        type: WRONG_EMAIL_VALUE,
        message: 'Wrong format of provided email',
        correctExample: 'example@example.com',
        messageForUser: 'api.common.INVALID_EMAIL_FORMAT',
    },
    GENERATE_TOKEN_ERROR: {
        mutation: 'startConfirmEmailAction',
        code: INTERNAL_ERROR,
        type: GENERATE_TOKEN_FAILED,
        message: 'Generate token failed',
    },
    EMAIL_CODE_EXPIRED: {
        mutation: 'completeConfirmEmailAction',
        variable: ['data', 'secretCode'],
        code: BAD_USER_INPUT,
        type: EMAIL_CODE_EXPIRED,
        message: 'Email code expired. Try to initiate email confirmation again',
        messageForUser: 'api.user.completeConfirmEmailAction.EMAIL_CODE_EXPIRED',
    },
    EMAIL_CODE_MAX_RETRIES_REACHED: {
        mutation: 'completeConfirmEmailAction',
        variable: ['data', 'secretCode'],
        code: BAD_USER_INPUT,
        type: EMAIL_CODE_MAX_RETRIES_REACHED,
        message: 'Max retries reached for email confirmation. Try to initiate email confirmation again',
        messageForUser: 'api.user.completeConfirmEmailAction.EMAIL_CODE_MAX_RETRIES_REACHED',
    },
    EMAIL_CODE_VERIFICATION_FAILED: {
        mutation: 'completeConfirmEmailAction',
        variable: ['data', 'secretCode'],
        code: BAD_USER_INPUT,
        type: EMAIL_CODE_VERIFICATION_FAILED,
        message: 'Code verification mismatch',
        messageForUser: 'api.user.completeConfirmEmailAction.EMAIL_CODE_VERIFICATION_FAILED',
    },
}


const DAY_IN_SEC = 60 * 60 * 24
const MAX_EMAIL_FOR_IP_BY_DAY = Number(conf['MAX_EMAIL_FOR_IP_BY_DAY']) || DEFAULT_MAX_EMAIL_FOR_IP_BY_DAY
const MAX_EMAIL_FOR_EMAIL_ADDRESS_BY_DAY = Number(conf['MAX_EMAIL_FOR_EMAIL_ADDRESS_BY_DAY']) || DEFAULT_MAX_EMAIL_FOR_EMAIL_ADDRESS_BY_DAY
const EMAIL_WHITE_LIST = Object.keys(conf.EMAIL_WHITE_LIST ? JSON.parse(conf.EMAIL_WHITE_LIST) : {})
const IP_WHITE_LIST = conf.IP_WHITE_LIST ? JSON.parse(conf.IP_WHITE_LIST) : []

const redisGuard = new RedisGuard()

async function checkEmailSendingLimits (context, email, ip) {
    const guards = [
        {
            key: getGuardKey('sendEmailCode', email),
            windowLimit: 1,
            windowSizeInSec: EMAIL_CODE_TTL,
        },
    ]

    if (!IP_WHITE_LIST.includes(ip)) {
        guards.push({
            key: getGuardKey('email', ip),
            windowLimit: MAX_EMAIL_FOR_IP_BY_DAY,
            windowSizeInSec: DAY_IN_SEC,
        })
    }

    if (!EMAIL_WHITE_LIST.includes(email)) {
        guards.push({
            key: getGuardKey('email', email),
            windowLimit: MAX_EMAIL_FOR_EMAIL_ADDRESS_BY_DAY,
            windowSizeInSec: DAY_IN_SEC,
        })
    }

    await redisGuard.checkMultipleCustomLimitCounters(guards, context)
}

const ConfirmEmailActionService = new GQLCustomSchema('ConfirmEmailActionService', {
    types: [
        {
            access: true,
            type: 'input GetEmailByConfirmEmailActionTokenInput { dv: Int!, sender: SenderFieldInput!, token: String!, captcha: String! }',
        },
        {
            access: true,
            type: 'type GetEmailByConfirmEmailActionTokenOutput { email: String!, isEmailVerified: Boolean! }',
        },
        {
            access: true,
            type: 'input StartConfirmEmailActionInput { dv: Int!, sender: SenderFieldInput!, captcha: String!, email: String! }',
        },
        {
            access: true,
            type: 'type StartConfirmEmailActionOutput { token: String! }',
        },
        {
            access: true,
            type: 'input ResendConfirmEmailActionInput { dv: Int!, sender: SenderFieldInput!, captcha: String!, token: String! }',
        },
        {
            access: true,
            type: 'type ResendConfirmEmailActionOutput { status: String! }',
        },
        {
            access: true,
            type: 'input CompleteConfirmEmailActionInput { dv: Int!, sender: SenderFieldInput!, captcha: String!, token: String!, secretCode: String! }',
        },
        {
            access: true,
            type: 'type CompleteConfirmEmailActionOutput { status: String! }',
        },
    ],

    queries: [
        {
            access: true,
            schema: 'getEmailByConfirmEmailActionToken(data: GetEmailByConfirmEmailActionTokenInput!): GetEmailByConfirmEmailActionTokenOutput',
            doc: {
                summary: 'Returns email information from ConfirmEmailAction, that matches provided search conditions',
                errors: {
                    ...pick(ERRORS, [
                        CAPTCHA_CHECK_FAILED,
                        UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION,
                        DV_VERSION_MISMATCH,
                        'WRONG_SENDER_FORMAT',
                    ]),
                },
            },
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                const { token, captcha } = data
                checkDvAndSender(data, {
                    ...ERRORS.DV_VERSION_MISMATCH, mutation: 'getEmailByConfirmEmailActionToken',
                }, {
                    ...ERRORS.WRONG_SENDER_FORMAT, mutation: 'getEmailByConfirmEmailActionToken',
                }, context)
                const { error } = await captchaCheck(context, captcha)
                if (error) {
                    throw new GQLError({ 
                        ...ERRORS.CAPTCHA_CHECK_FAILED,
                        mutation: 'getEmailByConfirmEmailActionToken',
                        error,
                    }, context)
                }
                const now = extra.extraNow || Date.now()
                const confirmActions = await ConfirmEmailAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                }, 'email isEmailVerified')
                if (!confirmActions || confirmActions.length !== 1) {
                    throw new GQLError({
                        ...ERRORS.UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION,
                        mutation: 'getEmailByConfirmEmailActionToken',
                    }, context)
                }
                const { email, isEmailVerified } = confirmActions[0]
                return { email, isEmailVerified }
            },
        },
    ],

    mutations: [
        {
            access: true,
            schema: 'startConfirmEmailAction(data: StartConfirmEmailActionInput!): StartConfirmEmailActionOutput',
            doc: {
                summary: 'Send confirmation email and return confirmation token. You can use the token for completeConfirmEmailAction mutation. And then use the token in other mutations to prove that the email is verified',
                errors: {
                    ...pick(ERRORS, [
                        DV_VERSION_MISMATCH,
                        'WRONG_SENDER_FORMAT',
                        CAPTCHA_CHECK_FAILED,
                        UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION,
                        'WRONG_EMAIL_FORMAT',
                        'GENERATE_TOKEN_ERROR',
                    ]),
                },
            },
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                const { email, sender, captcha } = data

                const ip = context.req.ip

                checkDvAndSender(data, {
                    ...ERRORS.DV_VERSION_MISMATCH, mutation: 'startConfirmEmailAction',
                }, {
                    ...ERRORS.WRONG_SENDER_FORMAT, mutation: 'startConfirmEmailAction',
                }, context)

                const { error } = await captchaCheck(context, captcha)
                if (error) {
                    throw new GQLError({
                        ...ERRORS.CAPTCHA_CHECK_FAILED,
                        mutation: 'startConfirmEmailAction',
                        error,
                    }, context)
                }

                const normalizedEmail = normalizeEmail(email)
                if (!normalizedEmail) {
                    throw new GQLError(ERRORS.WRONG_EMAIL_FORMAT, context)
                }

                await checkEmailSendingLimits(context, email, ip)

                const { error: tokenError, token } = generateTokenSafely(TOKEN_TYPES.CONFIRM_EMAIL)
                if (tokenError) {
                    throw new GQLError({ ...ERRORS.GENERATE_TOKEN_ERROR, data: { error: tokenError } }, context)
                }

                const secretCode = generateSecureCode(4)
                const now = extra.extraNow || Date.now()
                const requestedAt = new Date(now).toISOString()
                const expiresAt = new Date(now + CONFIRM_EMAIL_ACTION_EXPIRY * 1000).toISOString()
                const secretCodeRequestedAt = new Date(now).toISOString()
                const secretCodeExpiresAt = new Date(now + EMAIL_CODE_TTL * 1000).toISOString()

                const payload = {
                    dv: 1,
                    sender,
                    email: normalizedEmail,
                    secretCode,
                    token,
                    secretCodeRequestedAt,
                    secretCodeExpiresAt,
                    requestedAt,
                    expiresAt,
                }

                const isInvalidData = await redisGuard.isLocked(captcha, 'validation-failed')
                if (isInvalidData) return { token }

                await ConfirmEmailAction.create(context, payload)

                await sendMessage(context,  {
                    to: { email: normalizedEmail },
                    type: EMAIL_VERIFY_CODE_MESSAGE_TYPE,
                    meta: {
                        dv: 1,
                        secretCode,
                    },
                    sender,
                })

                return { token }
            },
        },
        {
            access: true,
            schema: 'resendConfirmEmailAction(data: ResendConfirmEmailActionInput!): ResendConfirmEmailActionOutput',
            doc: {
                summary: 'Resend the confirm email for existing token',
                errors: {
                    ...pick(ERRORS, [
                        DV_VERSION_MISMATCH,
                        'WRONG_SENDER_FORMAT',
                        CAPTCHA_CHECK_FAILED,
                        UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION,
                    ]),
                },
            },
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                const { token, sender, captcha } = data

                const ip = context.req.ip

                checkDvAndSender(data, {
                    ...ERRORS.DV_VERSION_MISMATCH, mutation: 'resendConfirmEmailAction',
                }, {
                    ...ERRORS.WRONG_SENDER_FORMAT, mutation: 'resendConfirmEmailAction',
                }, context)

                const { error } = await captchaCheck(context, captcha)
                if (error) {
                    throw new GQLError({
                        ...ERRORS.CAPTCHA_CHECK_FAILED,
                        mutation: 'resendConfirmEmailAction',
                        error,
                    }, context)
                }

                const now = extra.extraNow || Date.now()
                const confirmActions = await ConfirmEmailAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                }, 'id email')
                if (!confirmActions || confirmActions.length !== 1) {
                    throw new GQLError({
                        ...ERRORS.UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION,
                        mutation: 'resendConfirmEmailAction',
                    }, context)
                }

                const { id: confirmActionId, email } = confirmActions[0]

                await checkEmailSendingLimits(context, email, ip)

                const newSecretCode = generateSecureCode(4)
                const secretCodeRequestedAt = new Date(now).toISOString()
                const secretCodeExpiresAt = new Date(now + EMAIL_CODE_TTL * 1000).toISOString()

                const payload = {
                    dv: 1,
                    sender,
                    secretCode: newSecretCode,
                    secretCodeRequestedAt,
                    secretCodeExpiresAt,
                }

                await ConfirmEmailAction.update(context, confirmActionId, payload)

                await sendMessage(context,  {
                    to: { email },
                    type: EMAIL_VERIFY_CODE_MESSAGE_TYPE,
                    meta: {
                        dv: 1,
                        secretCode: newSecretCode,
                    },
                    sender,
                })

                return { status: 'ok' }
            },
        },
        {
            access: true,
            schema: 'completeConfirmEmailAction(data: CompleteConfirmEmailActionInput!): CompleteConfirmEmailActionOutput',
            doc: {
                summary: 'The final step of a email confirmation. You should use the token from startConfirmEmailAction and a secret code from the confirm email message. After success call, you can use the token in other mutations to prove that you have access to the email address',
                errors: {
                    ...pick(ERRORS, [
                        DV_VERSION_MISMATCH,
                        'WRONG_SENDER_FORMAT',
                        CAPTCHA_CHECK_FAILED,
                        UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION,
                        EMAIL_CODE_EXPIRED,
                        EMAIL_CODE_MAX_RETRIES_REACHED,
                        EMAIL_CODE_VERIFICATION_FAILED,
                    ]),
                },
            },
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                const { token, secretCode, sender, captcha } = data

                checkDvAndSender(data, {
                    ...ERRORS.DV_VERSION_MISMATCH, mutation: 'completeConfirmEmailAction',
                }, {
                    ...ERRORS.WRONG_SENDER_FORMAT, mutation: 'completeConfirmEmailAction',
                }, context)

                const { error } = await captchaCheck(context, captcha)
                if (error) {
                    throw new GQLError({
                        ...ERRORS.CAPTCHA_CHECK_FAILED,
                        mutation: 'completeConfirmEmailAction',
                        error,
                    }, context)
                }

                await redisGuard.checkCustomLimitCounters(
                    getGuardKey('completeEmailCode', token),
                    LOCK_TIMEOUT,
                    1,
                    context,
                )

                const now = extra.extraNow || Date.now()

                const confirmActions = await ConfirmEmailAction.getAll(context,  {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                }, 'id secretCode retries secretCodeExpiresAt')
                if (!confirmActions || confirmActions.length !== 1) {
                    throw new GQLError({
                        ...ERRORS.UNABLE_TO_FIND_CONFIRM_EMAIL_ACTION,
                        mutation: 'completeConfirmEmailAction',
                    }, context)
                }

                const {
                    id: confirmActionId,
                    secretCode: confirmActionSecretCode,
                    retries,
                    secretCodeExpiresAt,
                } = confirmActions[0]

                const isExpired = (new Date(secretCodeExpiresAt) < new Date(now))
                if (isExpired) {
                    throw new GQLError(ERRORS.EMAIL_CODE_EXPIRED, context)
                }

                if (retries >= CONFIRM_EMAIL_MAX_RETRIES) {
                    await ConfirmEmailAction.update(context, confirmActionId, {
                        dv: 1,
                        sender,
                        completedAt: new Date(now).toISOString(),
                    })
                    throw new GQLError(ERRORS.EMAIL_CODE_MAX_RETRIES_REACHED, context)
                }

                if (confirmActionSecretCode !== secretCode) {
                    await ConfirmEmailAction.update(context, confirmActionId, {
                        dv: 1,
                        sender,
                        retries: retries + 1,
                    })
                    throw new GQLError(ERRORS.EMAIL_CODE_VERIFICATION_FAILED, context)
                }

                await ConfirmEmailAction.update(context, confirmActionId, {
                    dv: 1,
                    sender,
                    isEmailVerified: true,
                })

                return { status: 'ok' }
            },
        },
    ],
})

module.exports = {
    ConfirmEmailActionService,
}
