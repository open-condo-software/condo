const { v4: uuid } = require('uuid')
const isEmpty = require('lodash/isEmpty')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { captchaCheck } = require('@condo/domains/user/utils/googleRecaptcha3')
const {
    CAPTCHA_CHECK_FAILED,
    CONFIRM_PHONE_ACTION_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_EXPIRED,
    CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED,
    CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED,
} = require('@condo/domains/user/constants/errors')
const {
    ConfirmPhoneAction,
    generateSmsCode,
} = require('@condo/domains/user/utils/serverSchema')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { PHONE_WRONG_FORMAT_ERROR } = require('@condo/domains/common/constants/errors')
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

const redisGuard = new RedisGuard()


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
            type: 'input StartConfirmPhoneActionInput { phone: String!, dv:Int!, sender: SenderFieldInput!, captcha: String! }',
        },
        {
            access: true,
            type: 'type StartConfirmPhoneActionOutput { token: String! }',
        },
        {
            access: true,
            type: 'input ResendConfirmPhoneActionSmsInput { token: String!, sender: SenderFieldInput!, captcha: String! }',
        },
        {
            access: true,
            type: 'type ResendConfirmPhoneActionSmsOutput { status: String! }',
        },
        {
            access: true,
            type: 'input CompleteConfirmPhoneActionInput { token: String!, smsCode: Int!, captcha: String! }',
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
            resolver: async (parent, args, context, info, extra = {}) => {
                const { token, captcha } = args.data
                const { error } = await captchaCheck(captcha, 'get_confirm_phone_token_info')
                if (error) {
                    throw new Error(`${CAPTCHA_CHECK_FAILED}] ${error}`)
                }
                const now = extra.extraNow || Date.now()
                const actions = await ConfirmPhoneAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                })
                if (isEmpty(actions)) {
                    throw new Error(`${CONFIRM_PHONE_ACTION_EXPIRED}] unable to find confirm phone action by token`)
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
            resolver: async (parent, args, context, info, extra = {}) => {
                const { phone: inputPhone, sender, dv, captcha } = args.data
                const { error } = await captchaCheck(captcha, 'start_confirm_phone')
                if (error) {
                    throw new Error(`${CAPTCHA_CHECK_FAILED}] ${error}`)
                }
                const phone = normalizePhone(inputPhone)
                if (!phone) {
                    throw new Error(`${PHONE_WRONG_FORMAT_ERROR}]: not valid phone number provided`)
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
                    dv,
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
            resolver: async (parent, args, context, info, extra) => {
                const { token, sender, captcha } = args.data
                const { error } = await captchaCheck(captcha, 'resend_sms')
                if (error) {
                    throw new Error(`${CAPTCHA_CHECK_FAILED}] ${error}`)
                }
                const now = extra.extraNow || Date.now()
                const actions = await ConfirmPhoneAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                })
                if (isEmpty(actions)) {
                    throw new Error(`${CONFIRM_PHONE_ACTION_EXPIRED}] unable to find confirm phone action by token`)
                }
                const { id, phone } = actions[0]
                await redisGuard.checkSMSDayLimitCounters(phone, context.req.ip)
                await redisGuard.checkLock(phone, 'sendsms')
                await redisGuard.lock(phone, 'sendsms', SMS_CODE_TTL)
                const newSmsCode = generateSmsCode(phone)
                await ConfirmPhoneAction.update(context, id, {
                    smsCode: newSmsCode,
                    smsCodeExpiresAt:  new Date(now + SMS_CODE_TTL * 1000).toISOString(),
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
                    sender: sender,
                })
                return { status: 'ok' }
            },
        },
        {
            access: true,
            schema: 'completeConfirmPhoneAction(data: CompleteConfirmPhoneActionInput!): CompleteConfirmPhoneActionOutput',
            resolver: async (parent, args, context, info, extra) => {
                const { token, smsCode, captcha } = args.data
                const { error } = await captchaCheck(captcha, 'complete_verify_phone')
                if (error) {
                    throw new Error(`${CAPTCHA_CHECK_FAILED}] ${error}`)
                }
                const now = extra.extraNow || Date.now()
                const actions = await ConfirmPhoneAction.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    completedAt: null,
                })
                if (isEmpty(actions)) {
                    throw new Error(`${CONFIRM_PHONE_ACTION_EXPIRED}] unable to find confirm phone action`)
                }
                await redisGuard.checkLock(token, 'confirm')
                await redisGuard.lock(token, 'confirm', LOCK_TIMEOUT)
                const { id, smsCode: actionSmsCode, retries, smsCodeExpiresAt } = actions[0]
                const isExpired = (new Date(smsCodeExpiresAt) < new Date(now))
                if (isExpired) {
                    throw new Error(`${CONFIRM_PHONE_SMS_CODE_EXPIRED}] SMS code expired `)
                }
                if (retries >= CONFIRM_PHONE_SMS_MAX_RETRIES) {
                    await ConfirmPhoneAction.update(context, id, {
                        completedAt: new Date(now).toISOString(),
                    })
                    throw new Error(`${CONFIRM_PHONE_SMS_CODE_MAX_RETRIES_REACHED}] Retries limit is excided try to confirm from start`)
                }
                if (actionSmsCode !== smsCode) {
                    await ConfirmPhoneAction.update(context, id, {
                        retries: retries + 1,
                    })
                    throw new Error(`${CONFIRM_PHONE_SMS_CODE_VERIFICATION_FAILED}]: SMSCode mismatch`)
                }
                await ConfirmPhoneAction.update(context, id, {
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