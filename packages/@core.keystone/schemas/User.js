const { v4: uuid } = require('uuid')
const faker = require('faker')
const { Text, Checkbox, Password, CalendarDay, File, Relationship, DateTime } = require('@keystonejs/fields')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const getYear = require('date-fns/getYear')
const { byTracking, atTracking } = require('@keystonejs/list-plugins')

const { GQLListSchema, GQLCustomSchema } = require('@core/keystone/schema')
const access = require('@core/keystone/access')
const conf = require('@core/config')

const RESET_PASSWORD_TOKEN_EXPIRY = conf.USER__RESET_PASSWORD_TOKEN_EXPIRY || 1000 * 60 * 60 * 24
const SERVER_URL = conf.SERVER_URL
const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/avatars`,
    path: `${conf.MEDIA_URL}/avatars`,
})

const User = new GQLListSchema('User', {
    // labelResolver: item => `${item.name}`,
    fields: {
        email: {
            factory: () => faker.internet.exampleEmail().toLowerCase(),
            type: Text,
            isUnique: true,
            // 2. Only authenticated users can read/update their own email, not any other user's.
            // Admins can read/update anyone's email.
            access: access.userIsAdminOrIsThisItem,
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['email'] && resolvedData['email'].toLowerCase()
                },
            },
        },
        // TODO(pahaz): verification by email!
        isEmailVerified: {
            type: Checkbox,
            defaultValue: false,
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
        isAdmin: {
            type: Checkbox,
            defaultValue: false,
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
        name: {
            factory: () => faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}'),
            type: Text,
        },
        // TODO(pahaz): check is active on login!
        isActive: { type: Checkbox, defaultValue: true },
        password: {
            factory: () => faker.internet.password(),
            type: Password,
            access: {
                // 3. Only admins can see if a password is set. No-one can read their own or other user's passwords.
                read: access.userIsAdmin,
                create: access.userIsAdmin,
                // 4. Only authenticated users can update their own password. Admins can update anyone's password.
                update: access.userIsAdminOrIsThisItem,
            },
        },
        avatar: { type: File, adapter: AVATAR_FILE_ADAPTER },
        dob: { type: CalendarDay, format: 'Do MMMM YYYY', yearRangeFrom: 1901, yearRangeTo: getYear(new Date()) },
    },
    access: {
        // read: access.userIsAdminOrOwner,
        read: access.canReadOnlyActive,
        create: access.userIsAdmin,
        update: access.userIsAdminOrIsThisItem,
        delete: access.userIsAdmin,
        auth: true,
    },
    plugins: [byTracking(), atTracking()],
    adminDoc: 'A list of Users',
    adminConfig: {
        defaultPageSize: 50,
        maximumPageSize: 200,
        defaultSort: 'email',
        defaultColumns: 'avatar, name, email, isAdmin, isActive',
        // defaultSort: 'name',
    },
})

const ForgotPasswordAction = new GQLListSchema('ForgotPasswordAction', {
    fields: {
        user: {
            factory: () => ({ create: User._factory() }),
            type: Relationship,
            ref: 'User',
            isRequired: true,  // Nullable! without options
            // // uncomment or override IF you want to set NOT NULL
            // knexOptions: { isNotNullable: true }, // Relationship only!
            // kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
        },
        token: {
            factory: () => uuid(),
            type: Text,
            isUnique: true,
            isRequired: true,
        },
        requestedAt: {
            factory: () => new Date(Date.now()).toISOString(),
            type: DateTime,
            isRequired: true,
        },
        expiresAt: {
            factory: () => new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            type: DateTime,
            isRequired: true,
        },
        usedAt: {
            type: DateTime,
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
    plugins: [byTracking(), atTracking()],
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
                          $requestedAt: DateTime,
                          $expiresAt: DateTime,
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
                    console.error(createErrors)
                    throw new Error('[error]: Unable to create forgotten password action')
                }

                // prepare emit context
                const { errors: userAndTokenErrors, data } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query GetUserAndToken($user: ID!, $now: DateTime!) {
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
                        query findUserFromToken($token: String!, $now: DateTime!) {
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
                        mutation markTokenAsUsed($tokenId: ID!, $now: DateTime!) {
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

const RegisterNewUserService = new GQLCustomSchema('RegisterNewUserService', {
    types: [
        {
            access: true,
            type: 'input RegisterNewUserInput { name: String!, email: String!, password: String! }',
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'registerNewUser(data: RegisterNewUserInput!): User',
            resolver: async (parent, args, context, info, extra = {}) => {
                await RegisterNewUserService.emit('beforeRegisterNewUser', {
                    parent, args, context, info, extra,
                })

                const { data } = args
                const extraUserData = extra.extraUserData || {}
                const { email, password } = data

                {
                    // TODO(pahaz): check email is valid!
                    const { errors, data } = await context.executeGraphQL({
                        context: context.createContext({ skipAccessControl: true }),
                        query: `
                        query findUserByEmail($email: String!) {
                          users: allUsers(where: { email: $email }) {
                            id
                          }
                        }
                    `,
                        variables: { email },
                    })

                    if (errors) {
                        const msg = '[error] Unable to call find service'
                        console.error(msg, errors)
                        throw new Error(msg)
                    }

                    if (data.users.length !== 0) {
                        throw new Error('[register:email:multipleFound] User with this email is already registered')
                    }
                }

                if (password.length < 8) {
                    throw new Error('[register:password:minLength] Password length less then 7 character')
                }

                const { errors: errors2, data: data2 } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        mutation create($data: UserCreateInput!) {
                          user: createUser(data: $data) {
                            id
                            name
                            email
                            isAdmin
                            isActive
                          }
                        }
                    `,
                    variables: { data: { ...data, ...extraUserData } },
                })

                if (errors2) {
                    const msg = '[error] Unable to create user'
                    console.error(msg, errors2)
                    throw new Error(msg)
                }

                // Send mail hook!
                const result = {
                    User: data2.user,
                }
                await RegisterNewUserService.emit('afterRegisterNewUser', {
                    parent, args, context, info, extra, result,
                })
                return result.User
            },
        },
    ],
})

module.exports = {
    User,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterNewUserService,
}
