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
            schema: 'startPasswordRecovery(email: String!): String',
            access: true,
            resolver: async (_, { email }, context, info, { query }) => {
                const token = uuid()
                const tokenExpiration = parseInt(RESET_PASSWORD_TOKEN_EXPIRY)

                const nowTimestamp = Date.now()
                const requestedAt = new Date(nowTimestamp).toISOString()
                const expiresAt = new Date(nowTimestamp + tokenExpiration).toISOString()

                // before hook
                await ForgotPasswordService.emit('beforeStartPasswordRecovery', {
                    email, requestedAt, expiresAt, token,
                })

                const { errors: userErrors, data: userData } = await query(
                    `
                        query findUserByEmail($email: String!) {
                          allUsers(where: { email: $email }) {
                            id
                            email
                          }
                        }
                    `,
                    { variables: { email }, skipAccessControl: true },
                )

                if (userErrors || !userData.allUsers || !userData.allUsers.length) {
                    throw new Error('[unknown-user]: Unable to find user when trying to start password recovery')
                }

                if (userData.allUsers.length !== 1) {
                    throw new Error('[unknown-user]: Unable to find exact one user to start password recovery')
                }

                const userId = userData.allUsers[0].id

                const variables = {
                    userId,
                    token,
                    requestedAt,
                    expiresAt,
                }

                const { errors: createErrors } = await query(
                    `
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
                    { variables, skipAccessControl: true },
                )

                if (createErrors) {
                    console.error(createErrors)
                    throw new Error('[error]: Unable to create forgotten password action')
                }

                // prepare emit context
                const { errors: userAndTokenErrors, data } = await query(
                    `
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
                    { skipAccessControl: true, variables: { user: userId, now: requestedAt } },
                )

                if (userAndTokenErrors) {
                    console.error(userAndTokenErrors)
                    throw new Error('[error]: Unable to construct forgot password context')
                }

                const ForgotPasswordAction = data.allForgotPasswordActions[0]
                const User = data.User

                // hook for send mail!
                await ForgotPasswordService.emit('afterStartPasswordRecovery', {
                    User,
                    ForgotPasswordAction,
                    forgotPasswordUrl: `${SERVER_URL}/auth/change-password?token=${ForgotPasswordAction.token}`,
                })

                return 'ok'
            },
        },
        {
            schema: 'changePasswordWithToken(token: String!, password: String!): String',
            access: true,
            resolver: async (_, { token, password }, context, info, { query }) => {
                const now = (new Date(Date.now())).toISOString()

                // before hook
                await ForgotPasswordService.emit('beforeChangePasswordWithToken', {
                    now, token, password,
                })

                const { errors, data } = await query(
                    // check usedAt
                    `
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
                    { variables: { token, now }, skipAccessControl: true },
                )

                if (errors || !data.passwordTokens || !data.passwordTokens.length) {
                    const msg = '[error] Unable to find token'
                    console.error(msg, errors)
                    throw new Error(msg)
                }

                const user = data.passwordTokens[0].user.id
                const tokenId = data.passwordTokens[0].id

                // mark token as used
                const { errors: markAsUsedError } = await query(
                    `
                        mutation markTokenAsUsed($tokenId: ID!, $now: DateTime!) {
                          updateForgotPasswordAction(id: $tokenId, data: {usedAt: $now}) {
                            id
                            usedAt
                          }
                        }           
                    `,
                    { variables: { tokenId, now }, skipAccessControl: true },
                )

                if (markAsUsedError) {
                    const msg = '[error] Unable to mark token as used'
                    console.error(msg, markAsUsedError)
                    throw new Error(msg)
                }

                // change password
                const { errors: passwordError } = await query(
                    `
                        mutation UpdateUserPassword($user: ID!, $password: String!) {
                          updateUser(id: $user, data: { password: $password }) {
                            id
                          }
                        }
                    `,
                    { variables: { user, password }, skipAccessControl: true },
                )

                if (passwordError) {
                    const msg = 'Unable to change password'
                    console.error(msg, passwordError)
                    throw new Error(msg)
                }

                // hook for send mail!
                await ForgotPasswordService.emit('afterChangePasswordWithToken', {
                    User: data.passwordTokens[0].user,
                    ForgotPasswordAction: data.passwordTokens[0],
                })

                return 'ok'
            },
        },
    ],
})

const RegisterService = new GQLCustomSchema('RegisterService', {
    mutations: [
        {
            access: true,
            schema: 'registerNewUser(name: String!, email: String!, password: String!, captcha: String!): User',
            resolver: async (_, { name, email, password }, context, info, { query }) => {
                await RegisterService.emit('beforeRegisterNewUser', { name, email, password })

                // TODO(pahaz): check email is valid!
                // TODO(pahaz): check phone is valid!
                const { errors: errors1, data: data1 } = await query(
                    `
                        query findUserByEmail($email: String!) {
                          users: allUsers(where: { email: $email }) {
                            id
                          }
                        }
                    `,
                    { variables: { email }, skipAccessControl: true },
                )

                if (errors1) {
                    throw errors1.message
                }

                if (data1.users.length !== 0) {
                    throw new Error(`[register:email:multipleFound] User with this email is already registered`)
                }

                if (password.length < 8) {
                    throw new Error(`[register:password:minLength] Password length less then 7 character`)
                }

                const result = await query(
                    `
                        mutation createNewUser($email: String!, $password: String!, $name: String!) {
                          user: createUser(data: { email: $email, password: $password, name: $name }) {
                            id
                            name
                            email
                            isAdmin
                            isActive
                          }
                        }
                    `,
                    { variables: { name, email, password }, skipAccessControl: true },
                )

                if (result.errors) {
                    throw result.errors.message
                }

                // Send mail hook!
                await RegisterService.emit('afterRegisterNewUser', { User: result.data.user })

                return result.data.user
            },
        },
    ],
})

module.exports = {
    User,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterService,
}
