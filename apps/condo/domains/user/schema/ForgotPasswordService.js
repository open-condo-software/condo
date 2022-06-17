const { v4: uuid } = require('uuid')
const conf = require('@core/config')
const { RESET_PASSWORD_MESSAGE_TYPE } = require('@condo/domains/notification/constants/constants')
const RESET_PASSWORD_TOKEN_EXPIRY = conf.USER__RESET_PASSWORD_TOKEN_EXPIRY || 1000 * 60 * 60 * 24
const { MIN_PASSWORD_LENGTH, STAFF } = require('@condo/domains/user/constants/common')
const { GQLCustomSchema, getById } = require('@core/keystone/schema')
const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { ForgotPasswordAction, User } = require('@condo/domains/user/utils/serverSchema')
const isEmpty = require('lodash/isEmpty')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@core/keystone/errors')
const { TOKEN_NOT_FOUND, PASSWORD_IS_TOO_SHORT, USER_NOT_FOUND } = require('../constants/errors')
const { WRONG_PHONE_FORMAT, WRONG_VALUE } = require('@condo/domains/common/constants/errors')
const { findTokenAndRelatedUser, markTokenAsUsed } = require('../utils/serverSchema')

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
        WRONG_PHONE_FORMAT: {
            mutation: 'startPasswordRecovery',
            variable: ['data', 'phone'],
            code: BAD_USER_INPUT,
            type: WRONG_PHONE_FORMAT,
            message: 'Wrong format of provided phone number',
            correctExample: '+79991234567',
            messageForUser: 'api.common.WRONG_PHONE_FORMAT',
        },
    },
    changePasswordWithToken: {
        PASSWORD_IS_TOO_SHORT: {
            mutation: 'changePasswordWithToken',
            variable: ['data', 'password'],
            code: BAD_USER_INPUT,
            type: PASSWORD_IS_TOO_SHORT,
            message: 'Password length is less then {min} characters',
            messageForUser: 'api.user.PASSWORD_IS_TOO_SHORT',
            messageInterpolation: {
                min: MIN_PASSWORD_LENGTH,
            },
        },
        PASSWORD_IS_FREQUENTLY_USED: {
            mutation: 'changePasswordWithToken',
            variable: ['data', 'password'],
            code: BAD_USER_INPUT,
            type: WRONG_VALUE,
            message: 'The password is too simple. We found it in the list of stolen passwords. You need to use something more secure',
            messageForUser: 'api.user.PASSWORD_IS_FREQUENTLY_USED',
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
            type: 'input ChangePasswordWithTokenInput { token: String!, password: String!, sender: SenderFieldInput, dv: Int }',
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
                const [action] = await ForgotPasswordAction.getAll(context, {
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
                // TODO(DOMA-3209): check the dv, sender and phone value
                const { data: { phone: inputPhone, sender, dv } } = args
                const phone = normalizePhone(inputPhone)
                if (!phone) {
                    throw new GQLError(errors.startPasswordRecovery.WRONG_PHONE_FORMAT, context)
                }
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
                await ForgotPasswordAction.create(context, {
                    dv: 1,
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
                        sender,
                        dv: 1,
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
                // TODO(DOMA-3209): check the dv, sender value
                const { data: { token, password, sender, dv } } = args

                if (password.length < MIN_PASSWORD_LENGTH) {
                    throw new GQLError(errors.changePasswordWithToken.PASSWORD_IS_TOO_SHORT, context)
                }

                const [tokenType, tokenAction, user] = await findTokenAndRelatedUser(context, token)

                if (!tokenType || !tokenAction) {
                    throw new GQLError(errors.changePasswordWithToken.TOKEN_NOT_FOUND, context)
                }
                if (!user || !user.phone) {
                    throw new GQLError(errors.changePasswordWithToken.USER_NOT_FOUND, context)
                }

                await User.update(context, user.id, { dv: 1, sender, password }, {
                    errorMapping: {
                        '[password:minLength:User:password]': errors.changePasswordWithToken.PASSWORD_IS_TOO_SHORT,
                        '[password:rejectCommon:User:password]': errors.changePasswordWithToken.PASSWORD_IS_FREQUENTLY_USED,
                    },
                })

                await markTokenAsUsed(context, tokenType, tokenAction, sender)

                return { status: 'ok', phone: user.phone }
            },
        },
    ],
})

module.exports = {
    ForgotPasswordService,
}
