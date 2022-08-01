const { v4: uuid } = require('uuid')
const isEmpty = require('lodash/isEmpty')
const pick = require('lodash/pick')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { captchaCheck } = require('@condo/domains/user/utils/googleRecaptcha3')
const {
    ConfirmPhoneAction,
    generateSmsCode,
} = require('@condo/domains/user/utils/serverSchema')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { WRONG_PHONE_FORMAT } = require('@condo/domains/common/constants/errors')
const {
    SMS_CODE_TTL,
    CONFIRM_PHONE_ACTION_EXPIRY,
    LOCK_TIMEOUT,
    CONFIRM_PHONE_SMS_MAX_RETRIES,
} = require('@condo/domains/user/constants/common')
const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { SMS_VERIFY_CODE_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const { RedisGuard } = require('@condo/domains/user/utils/serverSchema/guards')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@core/keystone/errors')
const { checkDvSender } = require('@condo/domains/common/utils/serverSchema/validators')
const { DV_VERSION_MISMATCH, WRONG_FORMAT } = require('@condo/domains/common/constants/errors')

const {
    CAPTCHA_CHECK_FAILED,
    UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
    SMS_CODE_EXPIRED,
    SMS_CODE_MAX_RETRIES_REACHED,
    SMS_CODE_VERIFICATION_FAILED, GQL_ERRORS,
} = require('../constants/errors')

const redisGuard = new RedisGuard()

const errors = {
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
        correctExample: '{ dv: 1, fingerprint: \'example-fingerprint-alphanumeric-value\'}',
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
            type: 'input StartConfirmPhoneActionInput { dv: Int!, sender: SenderFieldInput!, captcha: String!, phone: String! }',
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
                errors: pick(errors, [
                    CAPTCHA_CHECK_FAILED,
                    UNABLE_TO_FIND_CONFIRM_PHONE_ACTION,
                ]),
            },
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data } = args
                const { token, captcha } = data
                const { error } = await captchaCheck(captcha, 'get_confirm_phone_token_info')
                if (error) {
                    throw new GQLError({ ...errors.CAPTCHA_CHECK_FAILED, mutation: 'getPhoneByConfirmPhoneActionToken', data: { error } }, context)
                }
                const now = extra.extraNow || Date.now()
                const actions = await ConfirmPhoneAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                })
                if (isEmpty(actions)) {
                    throw new GQLError({ ...errors.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION, mutation: 'getPhoneByConfirmPhoneActionToken' }, context)
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
                    ...pick(errors, [
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
                const { phone: inputPhone, sender, captcha } = data
                checkDvSender(data, { ...errors.DV_VERSION_MISMATCH, mutation: 'startConfirmPhoneAction' }, { ...errors.WRONG_SENDER_FORMAT, mutation: 'startConfirmPhoneAction' }, context)
                const { error } = await captchaCheck(captcha, 'start_confirm_phone')
                if (error) {
                    throw new GQLError({ ...errors.CAPTCHA_CHECK_FAILED, mutation: 'startConfirmPhoneAction', data: { error } }, context)
                }
                const phone = normalizePhone(inputPhone)
                if (!phone) {
                    throw new GQLError(errors.WRONG_PHONE_FORMAT, context)
                }
                await redisGuard.checkSMSDayLimitCounters(phone, context.req.ip)
                await redisGuard.checkLock(phone, 'sendsms')
                await redisGuard.lock(phone, 'sendsms', SMS_CODE_TTL)
                const token = uuid()
                const now = extra.extraNow || Date.now()
                const requestedAt = new Date(now).toISOString()
                const expiresAt = new Date(now + CONFIRM_PHONE_ACTION_EXPIRY * 1000).toISOString()
                const smsCode = generateSmsCode(phone)
                const smsCodeRequestedAt = new Date(now).toISOString()
                const smsCodeExpiresAt = new Date(now + SMS_CODE_TTL * 1000).toISOString()
                const variables = {
                    dv: 1,
                    sender,
                    phone,
                    smsCode,
                    token,
                    smsCodeRequestedAt,
                    smsCodeExpiresAt,
                    requestedAt,
                    expiresAt,
                }
                await ConfirmPhoneAction.create(context, variables)
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale
                await sendMessage(context, {
                    lang,
                    to: { phone },
                    type: SMS_VERIFY_CODE_MESSAGE_TYPE,
                    meta: {
                        dv: 1,
                        smsCode,
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
                    ...pick(errors, [
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
                checkDvSender(data, { ...errors.DV_VERSION_MISMATCH, mutation: 'resendConfirmPhoneActionSms' }, { ...errors.WRONG_SENDER_FORMAT, mutation: 'resendConfirmPhoneActionSms' }, context)
                const { error } = await captchaCheck(captcha, 'resend_sms')
                if (error) {
                    throw new GQLError({ ...errors.CAPTCHA_CHECK_FAILED, mutation: 'resendConfirmPhoneActionSms', data: { error } }, context)
                }
                const now = extra.extraNow || Date.now()
                const actions = await ConfirmPhoneAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                })
                if (isEmpty(actions)) {
                    throw new GQLError({ ...errors.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION, mutation: 'resendConfirmPhoneActionSms' }, context)
                }
                const { id, phone } = actions[0]
                await redisGuard.checkSMSDayLimitCounters(phone, context.req.ip)
                await redisGuard.checkLock(phone, 'sendsms')
                await redisGuard.lock(phone, 'sendsms', SMS_CODE_TTL)
                const newSmsCode = generateSmsCode(phone)
                await ConfirmPhoneAction.update(context, id, {
                    dv: 1,
                    sender,
                    smsCode: newSmsCode,
                    smsCodeExpiresAt: new Date(now + SMS_CODE_TTL * 1000).toISOString(),
                    smsCodeRequestedAt: new Date(now).toISOString(),
                })
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale
                await sendMessage(context, {
                    lang,
                    to: { phone },
                    type: SMS_VERIFY_CODE_MESSAGE_TYPE,
                    meta: {
                        dv: 1,
                        smsCode: newSmsCode,
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
                    ...pick(errors, [
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
                checkDvSender(data, { ...errors.DV_VERSION_MISMATCH, mutation: 'completeConfirmPhoneAction' }, { ...errors.WRONG_SENDER_FORMAT, mutation: 'completeConfirmPhoneAction' }, context)
                const { error } = await captchaCheck(captcha, 'complete_verify_phone')
                if (error) {
                    throw new GQLError({ ...errors.CAPTCHA_CHECK_FAILED, mutation: 'completeConfirmPhoneAction', data: { error } }, context)
                }
                const now = extra.extraNow || Date.now()
                const actions = await ConfirmPhoneAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                })
                if (isEmpty(actions)) {
                    throw new GQLError({ ...errors.UNABLE_TO_FIND_CONFIRM_PHONE_ACTION, mutation: 'completeConfirmPhoneAction' }, context)
                }
                await redisGuard.checkLock(token, 'confirm')
                await redisGuard.lock(token, 'confirm', LOCK_TIMEOUT)
                const { id, smsCode: actionSmsCode, retries, smsCodeExpiresAt } = actions[0]
                const isExpired = (new Date(smsCodeExpiresAt) < new Date(now))
                if (isExpired) {
                    throw new GQLError(errors.SMS_CODE_EXPIRED, context)
                }
                if (retries >= CONFIRM_PHONE_SMS_MAX_RETRIES) {
                    await ConfirmPhoneAction.update(context, id, {
                        completedAt: new Date(now).toISOString(),
                    })
                    throw new GQLError(errors.SMS_CODE_MAX_RETRIES_REACHED, context)
                }
                if (actionSmsCode !== smsCode) {
                    await ConfirmPhoneAction.update(context, id, {
                        dv: 1,
                        sender,
                        retries: retries + 1,
                    })
                    throw new GQLError(errors.SMS_CODE_VERIFICATION_FAILED, context)
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
