const { v4: uuid } = require('uuid')
const conf = require('@core/config')
const { RESET_PASSWORD_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const RESET_PASSWORD_TOKEN_EXPIRY = conf.USER__RESET_PASSWORD_TOKEN_EXPIRY || 1000 * 60 * 60 * 24
const { MIN_PASSWORD_LENGTH, STAFF } = require('@condo/domains/user/constants/common')
const { GQLCustomSchema, getById } = require('@core/keystone/schema')
const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { ConfirmPhoneAction: ConfirmPhoneActionUtil, ForgotPasswordAction: ForgotPasswordActionUtil, User } = require('@condo/domains/user/utils/serverSchema')
const isEmpty = require('lodash/isEmpty')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@core/keystone/errors')
const { TOKEN_NOT_FOUND, PASSWORD_IS_TOO_SHORT, USER_NOT_FOUND } = require('../constants/errors')

/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const errors = {
    checkPasswordRecoveryToken: {
        UNABLE_TO_FIND_FORGOT_PASSWORD_ACTION: {
            mutation: 'checkPasswordRecoveryToken',
            variable: ['data', 'token'],
            code: BAD_USER_INPUT,
            type: TOKEN_NOT_FOUND,
            message: 'Unable to find non-expired token',
            messageForUser: 'api.user.checkPasswordRecoveryToken.TOKEN_NOT_FOUND',
        },
    },
    startPasswordRecovery: {
        USER_NOT_FOUND: {
            mutation: 'startPasswordRecovery',
            variable: ['data', 'phone'],
            code: BAD_USER_INPUT,
            type: 'USER_BY_PHONE_NOT_FOUND',
            message: 'Unable to find user with specified phone',
            messageForUser: 'api.user.startPasswordRecovery.USER_NOT_FOUND',
        },
        MULTIPLE_USERS_FOUND: {
            mutation: 'startPasswordRecovery',
            variable: ['data', 'phone'],
            code: BAD_USER_INPUT,
            type: 'MULTIPLE_USERS_FOUND',
            message: 'Unable to find exact one user to start password recovery',
            messageForUser: 'api.user.startPasswordRecovery.MULTIPLE_USERS_FOUND',
        },
    },
    changePasswordWithToken: {
        PASSWORD_IS_TOO_SHORT: {
            mutation: 'changePasswordWithToken',
            variable: ['data', 'password'],
            code: BAD_USER_INPUT,
            type: PASSWORD_IS_TOO_SHORT,
            message: 'Password length is less then {min} characters',
            messageForUser: 'api.user.changePasswordWithToken.PASSWORD_IS_TOO_SHORT',
            messageInterpolation: {
                min: MIN_PASSWORD_LENGTH,
            },
        },
        TOKEN_NOT_FOUND: {
            mutation: 'changePasswordWithToken',
            variable: ['data', 'token'],
            code: BAD_USER_INPUT,
            type: TOKEN_NOT_FOUND,
            message: 'Unable to find non-expired ConfirmPhoneAction by specified token',
            messageForUser: 'api.user.changePasswordWithToken.TOKEN_NOT_FOUND',
        },
        USER_NOT_FOUND: {
            mutation: 'changePasswordWithToken',
            variable: ['data', 'phone'],
            code: BAD_USER_INPUT,
            type: USER_NOT_FOUND,
            message: 'Unable to find user with specified phone',
            messageForUser: 'api.user.changePasswordWithToken.USER_NOT_FOUND',
        },
    },
}

const ForgotPasswordService = new GQLCustomSchema('ForgotPasswordService', {
    types: [
        {
            access: true,
            type: 'input CheckPasswordRecoveryTokenInput { token: String! }',
        },
        {
            access: true,
            type: 'type CheckPasswordRecoveryTokenOutput { status: String! }',
        },
        {
            access: true,
            type: 'input StartPasswordRecoveryInput { phone: String!, sender: SenderFieldInput!, dv: Int! }',
        },
        {
            access: true,
            type: 'type StartPasswordRecoveryOutput { status: String! }',
        },
        {
            access: true,
            type: 'input ChangePasswordWithTokenInput { token: String!, password: String! }',
        },
        {
            access: true,
            type: 'type ChangePasswordWithTokenOutput { status: String!, phone: String! }',
        },

    ],
    queries: [
        {
            access: true,
            schema: 'checkPasswordRecoveryToken(data: CheckPasswordRecoveryTokenInput!): CheckPasswordRecoveryTokenOutput',
            doc: {
                summary: 'Tells, whether specified password recovery token is exists and not expired',
                details: 'Returns "ok" status, if a token is found and not expired',
                errors: errors.checkPasswordRecoveryToken,
            },
            resolver: async (parent, args, context, info, extra) => {
                const { data: { token } } = args
                const now = extra.extraNow || Date.now()
                const [action] = await ForgotPasswordActionUtil.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                    usedAt: null,
                })
                if (!action) {
                    throw new GQLError(errors.checkPasswordRecoveryToken.UNABLE_TO_FIND_FORGOT_PASSWORD_ACTION, context)
                }
                return { status: 'ok' }
            },
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'startPasswordRecovery(data: StartPasswordRecoveryInput!): StartPasswordRecoveryOutput',
            doc: {
                summary: 'Beginning of a multi-step process of a password recovery.\n1. Start recovery and get token to confirm phone number\n2. Confirm phone number\n3. Call `changePasswordWithToken` mutation',
                errors: errors.startPasswordRecovery,
            },
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data: { phone: inputPhone, sender, dv } } = args
                const phone = normalizePhone(inputPhone)
                const extraToken = extra.extraToken || uuid()
                const extraTokenExpiration = extra.extraTokenExpiration || parseInt(RESET_PASSWORD_TOKEN_EXPIRY)
                const extraNowTimestamp = extra.extraNowTimestamp || Date.now()

                const requestedAt = new Date(extraNowTimestamp).toISOString()
                const expiresAt = new Date(extraNowTimestamp + extraTokenExpiration).toISOString()

                const users = await User.getAll(context, { phone, type: STAFF })

                if (isEmpty(users)) {
                    throw new GQLError(errors.startPasswordRecovery.USER_NOT_FOUND, context)
                }

                if (users.length !== 1) {
                    throw new GQLError(errors.startPasswordRecovery.MULTIPLE_USERS_FOUND, context)
                }

                const userId = users[0].id
                await ForgotPasswordActionUtil.create(context, {
                    dv,
                    sender,
                    user: { connect: { id: userId } },
                    token: extraToken,
                    requestedAt,
                    expiresAt,
                })
                // we need to check if user has email
                const { email } = await getById('User', users[0].id)
                const sendChannels = [{
                    to: { phone },
                }]
                if (!isEmpty(email)) {
                    sendChannels.push({
                        to: { email },
                    })
                }
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale
                await Promise.all(sendChannels.map(async channel => {
                    await sendMessage(context, {
                        lang,
                        to: {
                            user: {
                                id: userId,
                            },
                            ...channel.to,
                        },
                        type: RESET_PASSWORD_MESSAGE_TYPE,
                        meta: {
                            token: extraToken,
                            dv: 1,
                        },
                        sender: sender,
                    })
                }))

                return { status: 'ok' }
            },
        },
        {
            access: true,
            schema: 'changePasswordWithToken(data: ChangePasswordWithTokenInput!): ChangePasswordWithTokenOutput',
            doc: {
                schema: 'Changes password and authorizes this action via correct token, that should correspond to either ForgotPasswordAction (deprecated) or `ConfirmPhoneAction`',
                errors: errors.changePasswordWithToken,
            },
            resolver: async (parent, args, context, info, extra) => {
                const { data: { token, password } } = args
                const now = extra.extraNow || (new Date(Date.now())).toISOString()

                if (password.length < MIN_PASSWORD_LENGTH) {
                    throw new GQLError(errors.changePasswordWithToken.PASSWORD_IS_TOO_SHORT, context)
                }

                let [action] = await ForgotPasswordActionUtil.getAll(context, {
                    token,
                    expiresAt_gte: now,
                    usedAt: null,
                })

                let phone, userId

                if (action) {
                    userId = action.user.id
                    phone = await getById('User', userId).then(p => p.phone)
                    const tokenId = action.id

                    // mark token as used
                    await ForgotPasswordActionUtil.update(context, tokenId, {
                        usedAt: now,
                    })
                } else {
                    [action] = await ConfirmPhoneActionUtil.getAll(context, {
                        token, 
                        expiresAt_gte: now,
                        completedAt: null,
                        isPhoneVerified: true,
                    })
                    if (!action) {
                        throw new GQLError(errors.changePasswordWithToken.TOKEN_NOT_FOUND, context)
                    }
                    phone = action.phone
                    const [user] = await User.getAll(context, {
                        type: STAFF,
                        phone,
                    })
                    userId = user && user.id

                    if (!userId) {
                        throw new GQLError(errors.changePasswordWithToken.USER_NOT_FOUND, context)
                    }
                    await ConfirmPhoneActionUtil.update(context, action.id, {
                        completedAt: now,
                    })
                }
    
                await User.update(context, userId, {
                    password,
                })

                return { status: 'ok', phone }
            },
        },
    ],
})

module.exports = {
    ForgotPasswordService,
}
