const { v4: uuid } = require('uuid')
const { Text, Relationship, DateTimeUtc } = require('@keystonejs/fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')
const { GQLListSchema, GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@core/keystone/access')
const conf = require('@core/config')

const RESET_PASSWORD_TOKEN_EXPIRY = conf.USER__RESET_PASSWORD_TOKEN_EXPIRY || 1000 * 60 * 60 * 24
const SERVER_URL = conf.SERVER_URL


const USER_OWNED_FIELD = {
    schemaDoc: 'Ref to the user. The object will be deleted if the user ceases to exist',
    type: Relationship,
    ref: 'User',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
    access: {
        read: true,
        create: true, // TODO(pahaz): check access!
        update: access.userIsAdmin,
        delete: false,
    },
}

const ForgotPasswordAction = new GQLListSchema('ForgotPasswordAction', {
    fields: {
        user: USER_OWNED_FIELD,
        token: {
            factory: () => uuid(),
            type: Text,
            isUnique: true,
            isRequired: true,
        },
        requestedAt: {
            factory: () => new Date(Date.now()).toISOString(),
            type: DateTimeUtc,
            isRequired: true,
        },
        expiresAt: {
            factory: () => new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
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
            schema: 'startPasswordRecovery(email: String!): String',
            resolver: async (parent, args, context, info, extra = {}) => {
                await ForgotPasswordService.emit('beforeStartPasswordRecovery', {
                    parent, args, context, info, extra,
                })

                const { email } = args
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
                    throw new Error('[unknown-user]: Unable to find user when trying to start password recovery')
                }

                if (userData.allUsers.length !== 1) {
                    throw new Error('[unknown-user]: Unable to find exact one user to start password recovery')
                }

                const userId = userData.allUsers[0].id
                const user = userData.allUsers[0]
                console.log('User found ', userId, user)

                const variables = {
                    userId,
                    token: extraToken,
                    requestedAt,
                    expiresAt,
                }

                const { errors: createErrors } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation createForgotPasswordAction(
                          $userId: ID!,
                          $token: String,
                          $requestedAt: String,
                          $expiresAt: String,
                        ) {
                          createForgotPasswordAction(data: {
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
                    console.error(createErrors, variables)
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
                    console.error(userAndTokenErrors)
                    throw new Error('[error]: Unable to construct forgot password context')
                }

                const ForgotPasswordAction = data.allForgotPasswordActions[0]
                const User = data.User

                const result = {
                    User,
                    ForgotPasswordAction,
                    forgotPasswordUrl: `${SERVER_URL}/auth/change-password?token=${ForgotPasswordAction.token}`,
                }
                // hook for send mail!
                await ForgotPasswordService.emit('afterStartPasswordRecovery', {
                    parent, args, context, info, extra, result,
                })
                console.log('ForgotPasswordService AFTER', `${SERVER_URL}/auth/change-password?token=${ForgotPasswordAction.token}`)
                return 'ok'
            },
        },
        {
            access: true,
            schema: 'changePasswordWithToken(token: String!, password: String!): String',
            resolver: async (parent, args, context, info, extra) => {
                await ForgotPasswordService.emit('beforeChangePasswordWithToken', {
                    parent, args, context, info, extra,
                })

                const { token, password } = args
                const now = extra.extraNow || (new Date(Date.now())).toISOString()

                // check usedAt
                const { errors, data } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query findUserFromToken($token: String!, $now: String!) {
                          passwordTokens: allForgotPasswordActions(where: { token: $token, expiresAt_gte: $now }) {
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
                    const msg = '[error] Unable to find token'
                    console.error(msg, errors)
                    throw new Error(msg)
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
                    const msg = '[error] Unable to mark token as used'
                    console.error(msg, markAsUsedError)
                    throw new Error(msg)
                }

                // change password
                const { errors: passwordError } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation UpdateUserPassword($user: ID!, $password: String!) {
                          updateUser(id: $user, data: { password: $password }) {
                            id
                          }
                        }
                    `,
                    variables: { user, password },
                })

                if (passwordError) {
                    const msg = '[error] Unable to change password'
                    console.error(msg, passwordError)
                    throw new Error(msg)
                }

                // hook for send mail!
                const result = {
                    User: data.passwordTokens[0].user,
                    ForgotPasswordAction: data.passwordTokens[0],
                }
                await ForgotPasswordService.emit('afterChangePasswordWithToken', {
                    parent, args, context, info, extra, result,
                })
                return 'ok'
            },
        },
    ],
})



module.exports = {
    ForgotPasswordAction,
    ForgotPasswordService,
}
