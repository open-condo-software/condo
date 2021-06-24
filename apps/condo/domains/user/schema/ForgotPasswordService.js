const { v4: uuid } = require('uuid')
const conf = require('@core/config')
const { WRONG_EMAIL_ERROR, MULTIPLE_ACCOUNTS_MATCHES, RESET_TOKEN_NOT_FOUND, PASSWORD_TOO_SHORT } = require('@condo/domains/user/constants/errors')
const { RESET_PASSWORD_MESSAGE_TYPE } = require('@condo/domains/notification/constants')
const RESET_PASSWORD_TOKEN_EXPIRY = conf.USER__RESET_PASSWORD_TOKEN_EXPIRY || 1000 * 60 * 60 * 24
const { MIN_PASSWORD_LENGTH } = require('@condo/domains/user/constants/common')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { ForgotPasswordAction: ForgotPasswordActionUtil, User } = require('@condo/domains/user/utils/serverSchema')
const isEmpty = require('lodash/isEmpty')

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
            type: 'input StartPasswordRecoveryInput { email: String!, sender: JSON!, dv: Int! }',
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
            type: 'type ChangePasswordWithTokenOutput { status: String! }',
        },

    ],
    queries: [
        {
            access: true,
            schema: 'checkPasswordRecoveryToken(data: CheckPasswordRecoveryTokenInput!): CheckPasswordRecoveryTokenOutput',
            resolver: async (parent, args, context, info, extra) => {
                const { data: { token } } = args
                const now = extra.extraNow || Date.now()
                const actions = await ForgotPasswordActionUtil.getAll(context, {
                    token,
                    expiresAt_gte: new Date(now).toISOString(),
                })
                if (isEmpty(actions)) {
                    throw new Error('[error]: Unable to find valid token')
                }

                return { status: 'ok' }
            },
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'startPasswordRecovery(data: StartPasswordRecoveryInput!): StartPasswordRecoveryOutput',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { data: { email, sender, dv } } = args
                const extraToken = extra.extraToken || uuid()
                const extraTokenExpiration = extra.extraTokenExpiration || parseInt(RESET_PASSWORD_TOKEN_EXPIRY)
                const extraNowTimestamp = extra.extraNowTimestamp || Date.now()

                const requestedAt = new Date(extraNowTimestamp).toISOString()
                const expiresAt = new Date(extraNowTimestamp + extraTokenExpiration).toISOString()

                const users = await User.getAll(context, {
                    email,
                })

                if (isEmpty(users)) {
                    throw new Error(`${WRONG_EMAIL_ERROR}] Unable to find user when trying to start password recovery`)
                }

                if (users.length !== 1) {
                    throw new Error(`${MULTIPLE_ACCOUNTS_MATCHES}] Unable to find exact one user to start password recovery`)
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

                // prepare emit context
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale
                await sendMessage(context, {
                    lang,
                    to: {
                        user: {
                            id: userId,
                        },
                    },
                    type: RESET_PASSWORD_MESSAGE_TYPE,
                    meta: {
                        token: extraToken,
                        dv: 1,
                    },
                    sender: sender,
                })
                return { status: 'ok' }
            },
        },
        {
            access: true,
            schema: 'changePasswordWithToken(data: ChangePasswordWithTokenInput!): ChangePasswordWithTokenOutput',
            resolver: async (parent, args, context, info, extra) => {
                const { data: { token, password } } = args
                const now = extra.extraNow || (new Date(Date.now())).toISOString()

                if (password.length < MIN_PASSWORD_LENGTH) {
                    throw new Error(`${PASSWORD_TOO_SHORT}] Password is too short`)
                }
                const forgotPasswordData = await ForgotPasswordActionUtil.getAll(context, {
                    token,
                    expiresAt_gte: now,
                })

                if (isEmpty(forgotPasswordData) || !forgotPasswordData.length) {
                    throw new Error(`${RESET_TOKEN_NOT_FOUND}] Unable to find token`)
                }

                const userId = forgotPasswordData[0].user.id
                const tokenId = forgotPasswordData[0].id

                // mark token as used
                await ForgotPasswordActionUtil.update(context, tokenId, {
                    usedAt: now,
                })

                await User.update(context, userId, {
                    password,
                })

                return { status: 'ok' }
            },
        },
    ],
})

module.exports = {
    ForgotPasswordService,
}
