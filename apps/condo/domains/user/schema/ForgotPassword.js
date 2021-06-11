const { v4: uuid } = require('uuid')
const { Text, Relationship, DateTimeUtc } = require('@keystonejs/fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')
const { GQLListSchema, GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@core/keystone/access')
const conf = require('@core/config')
const { RESET_PASSWORD_MESSAGE_TYPE } = require('@condo/domains/notification/constants')
const RESET_PASSWORD_TOKEN_EXPIRY = conf.USER__RESET_PASSWORD_TOKEN_EXPIRY || 1000 * 60 * 60 * 24
const { sendMessage } = require('@condo/domains/notification/utils/serverSchema')
const { MIN_PASSWORD_LENGTH } = require('@condo/domains/user/constants/common')
const { COUNTRIES, RUSSIA_COUNTRY } = require('@condo/domains/common/constants/countries')
const { WRONG_EMAIL_ERROR, MULTIPLE_ACCOUNTS_MATCHES, RESET_TOKEN_NOT_FOUND, PASSWORD_TOO_SHORT } = require('@condo/domains/user/constants/errors')
const { SENDER_FIELD, DV_FIELD } = require('@condo/domains/common/schema/fields')


const USER_OWNED_FIELD = {
    schemaDoc: 'Ref to the user. The object will be deleted if the user ceases to exist',
    type: Relationship,
    ref: 'User',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
    access: {
        read: true,
        create: true, // needed to be set to true - if false then guest user will not be able to reset password
        update: access.userIsAdmin,
        delete: false,
    },
}

const ForgotPasswordAction = new GQLListSchema('ForgotPasswordAction', {
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,        
        user: USER_OWNED_FIELD,
        token: {
            type: Text,
            isUnique: true,
            isRequired: true,
        },
        requestedAt: {
            type: DateTimeUtc,
            isRequired: true,
        },
        expiresAt: {
            type: DateTimeUtc,
            isRequired: true,
        },
        usedAt: {
            type: DateTimeUtc,
            defaultValue: null,
        },
    },
    access: {
        auth: true,
        create: access.userIsAdmin,
        read: access.userIsAdmin,
        update: access.userIsAdmin,
        delete: access.userIsAdmin,
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    adminDoc: 'A list of forgotten password user actions',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultColumns: 'user, requestedAt, usedAt, expiresAt',
    },
})

const ForgotPasswordService = new GQLCustomSchema('ForgotPasswordService', {
    mutations: [
        {
            access: true,
            schema: 'startPasswordRecovery(email: String!, sender: JSON!, dv:Int!): String',
            resolver: async (parent, args, context, info, extra = {}) => {
                const { email, sender, dv } = args
                const extraToken = extra.extraToken || uuid()
                const extraTokenExpiration = extra.extraTokenExpiration || parseInt(RESET_PASSWORD_TOKEN_EXPIRY)
                const extraNowTimestamp = extra.extraNowTimestamp || Date.now()

                const requestedAt = new Date(extraNowTimestamp).toISOString()
                const expiresAt = new Date(extraNowTimestamp + extraTokenExpiration).toISOString()
                const { errors: userErrors, data: userData } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query findUserByEmail($email: String!) {
                          allUsers(where: { email: $email }) {
                            id
                            email
                          }
                        }
                    `,
                    variables: { email },
                })
                if (userErrors || !userData.allUsers || !userData.allUsers.length) {
                    throw new Error(`${WRONG_EMAIL_ERROR}] Unable to find user when trying to start password recovery`)
                }

                if (userData.allUsers.length !== 1) {
                    throw new Error(`${MULTIPLE_ACCOUNTS_MATCHES}] Unable to find exact one user to start password recovery`)
                }

                const userId = userData.allUsers[0].id

                const variables = {
                    dv,
                    sender,
                    userId,
                    token: extraToken,
                    requestedAt,
                    expiresAt,
                }

                const { errors: createErrors } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation createForgotPasswordAction(
                          $dv: Int,
                          $sender: JSON,
                          $userId: ID!,
                          $token: String,
                          $requestedAt: String,
                          $expiresAt: String,
                        ) {
                          createForgotPasswordAction(data: {
                            dv: $dv,
                            sender: $sender,
                            user: { connect: { id: $userId }},
                            token: $token,
                            requestedAt: $requestedAt,
                            expiresAt: $expiresAt,
                          }) {
                            id
                            token
                            user {
                              id
                            }
                            requestedAt
                            expiresAt
                            usedAt
                          }
                        }
                    `,
                    variables,
                })
                if (createErrors) {
                    throw new Error('[error]: Unable to create forgotten password action')
                }

                // prepare emit context
                const { errors: userAndTokenErrors, data } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query GetUserAndToken($user: ID!, $now: String!) {
                          User( where: { id: $user }) {
                            id
                            email
                          }
                          allForgotPasswordActions( where: { user: { id: $user }, expiresAt_gte: $now, usedAt: null }) {
                            token
                            requestedAt
                            expiresAt
                          }
                        }
                    `,
                    variables: { user: userId, now: requestedAt },
                })

                if (userAndTokenErrors) {
                    throw new Error('[error]: Unable to construct forgot password context')
                }
                const { token } = data.allForgotPasswordActions[0]
                const user = data.User
                const lang = COUNTRIES[RUSSIA_COUNTRY].locale
                await sendMessage(context, {
                    lang,
                    to: {
                        user: {
                            id: user.id,
                        },
                    },
                    type: RESET_PASSWORD_MESSAGE_TYPE,
                    meta: {
                        token,
                        dv: 1,
                    },
                    sender: sender,
                })
                return 'ok'
            },
        },
        {
            access: true,
            schema: 'changePasswordWithToken(token: String!, password: String!): String',
            resolver: async (parent, args, context, info, extra) => {

                const { token, password } = args
                const now = extra.extraNow || (new Date(Date.now())).toISOString()

                if (password.length < MIN_PASSWORD_LENGTH) {
                    throw new Error(`${PASSWORD_TOO_SHORT}] Password too short`)
                }

                const { errors, data } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query findUserFromToken($token: String!, $now: String!) {
                          passwordTokens: allForgotPasswordActions(where: { token: $token, expiresAt_gte: $now, usedAt: null }) {
                            id
                            token
                            user {
                              id
                              email
                            }
                          }
                        }
                    `,
                    variables: { token, now },
                })

                if (errors || !data.passwordTokens || !data.passwordTokens.length) {
                    throw new Error(`${RESET_TOKEN_NOT_FOUND}] Unable to find token`)
                }

                const user = data.passwordTokens[0].user.id
                const tokenId = data.passwordTokens[0].id

                // mark token as used
                const { errors: markAsUsedError } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation markTokenAsUsed($tokenId: ID!, $now: String!) {
                          updateForgotPasswordAction(id: $tokenId, data: {usedAt: $now}) {
                            id
                            usedAt
                          }
                        }           
                    `,
                    variables: { tokenId, now },
                })

                if (markAsUsedError) {
                    throw new Error('[error] Unable to mark token as used')
                }

                const { errors: passwordError } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation updateUserPassword($user: ID!, $password: String!) {
                          updateUser(id: $user, data: { password: $password }) {
                            id
                          }
                        }
                    `,
                    variables: { user, password },
                })

                if (passwordError) {
                    throw new Error('[error] Unable to change password')
                }

                return 'ok'
            },
        },
    ],
})



module.exports = {
    ForgotPasswordAction,
    ForgotPasswordService,
}
