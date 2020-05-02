const { v4: uuid } = require('uuid')
const faker = require('faker')
const { Text, Checkbox, Password, CalendarDay, File, Relationship, DateTime } = require('@keystonejs/fields')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const getYear = require('date-fns/get_year')
const { byTracking, atTracking } = require('@keystonejs/list-plugins')

const { GQLListSchema, GQLCustomSchema } = require('../core/schema')
const { Stars, MultiCheck } = require('../core/custom-fields')
const access = require('../core/access')
const conf = require('../config')

const avatarFileAdapter = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/avatars`,
    path: `${conf.MEDIA_URL}/avatars`,
})

const User = new GQLListSchema('User', {
    // labelResolver: item => `${item.name}`,
    fields: {
        name: {
            factory: () => faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}'),
            type: Text,
        },
        email: {
            factory: () => faker.internet.exampleEmail(),
            type: Text,
            isUnique: true,
            // 2. Only authenticated users can read/update their own email, not any other user's.
            // Admins can read/update anyone's email.
            access: access.userIsAdminOrIsThisItem,
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
        avatar: { type: File, adapter: avatarFileAdapter },
        rating: { type: Stars, starCount: 5 },
        settings: { type: MultiCheck, options: ['Feature1', 'Feature2'] },
        aboutMyself: { type: Wysiwyg },
        dob: { type: CalendarDay, format: 'Do MMMM YYYY', yearRangeFrom: 1901, yearRangeTo: getYear(new Date()) },
    },
    access: {
        // read: access.userIsAdminOrOwner,
        read: access.canReadOnlyActive,
        create: access.userIsAdmin,
        update: access.userIsAdminOrIsThisItem,
        delete: true,
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
            isRequired: true,
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
        accessedAt: {
            type: DateTime,
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
        defaultColumns: 'user, requestedAt, accessedAt, expiresAt',
    },
    hooks: {
        afterChange: async ({ updatedItem, existingItem, actions: { query } }) => {
            if (existingItem) return null

            // prepare mail context and send mail!
            const now = new Date().toISOString()
            const { errors, data } = await query(
                `
                    query GetUserAndToken($user: ID!, $now: DateTime!) {
                      User( where: { id: $user }) {
                        id
                        email
                      }
                      allForgotPasswordActions( where: { user: { id: $user }, expiresAt_gte: $now }) {
                        token
                        expiresAt
                      }
                    }
                `,
                { skipAccessControl: true, variables: { user: updatedItem.user.toString(), now } },
            )

            if (errors) {
                console.error(errors, `Unable to construct password updated email.`)
                return
            }

            const { allForgotPasswordActions, User } = data
            const forgotPasswordKey = allForgotPasswordActions[0].token
            const url = conf.SERVER_URL
            const props = {
                forgotPasswordUrl: `${url}/change-password?key=${forgotPasswordKey}`,
                recipientEmail: User.email,
            }

            // const options = {
            //     subject: 'Request for password reset',
            //     to: User.email,
            //     from: process.env.MAILGUN_FROM,
            //     domain: process.env.MAILGUN_DOMAIN,
            //     apiKey: process.env.MAILGUN_API_KEY,
            // };
            //
            // await sendEmail('forgot-password.jsx', props, options);
        },
    },
})

const ForgotPasswordService = new GQLCustomSchema('ForgotPasswordService', {
    mutations: [
        {
            schema: 'startPasswordRecovery(email: String!): String',
            access: true,
            resolver: async (_, { email }, context, info, { query }) => {
                const token = uuid()
                const tokenExpiration = parseInt(conf.USER__RESET_PASSWORD_TOKEN_EXPIRY)

                const now = Date.now()
                const requestedAt = new Date(now).toISOString()
                const expiresAt = new Date(now + tokenExpiration).toISOString()

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

                const userId = userData.allUsers[0].id

                const variables = {
                    userId,
                    token,
                    requestedAt,
                    expiresAt,
                }

                const { errors } = await query(
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
                          }
                        }
                    `,
                    { variables, skipAccessControl: true },
                )

                if (errors) {
                    throw new Error('[error]: Unable to create forgotten password action')
                }

                return 'ok'
            },
        },
        {
            schema: 'changePasswordWithToken(token: String!, password: String!): String',
            access: true,
            resolver: async (_, { token, password }, context, info, { query }) => {
                const now = (new Date(Date.now())).toISOString()

                const { errors, data } = await query(
                    // check usedAt
                    `
                        query findUserFromToken($token: String!, $now: DateTime!) {
                          passwordTokens: allForgotPasswordActions(where: { token: $token, expiresAt_gte: $now }) {
                            id
                            token
                            user {
                              id
                            }
                          }
                        }
                    `,
                    { variables: { token, now }, skipAccessControl: true },
                )

                if (errors || !data.passwordTokens || !data.passwordTokens.length) {
                    const msg = `Unable to find token`
                    console.error(msg, errors, data)
                    if (errors) {
                        throw errors.message
                    } else {
                        throw new Error(msg)
                    }
                }

                const user = data.passwordTokens[0].user.id
                const tokenId = data.passwordTokens[0].id

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
                    console.error(`Unable to change password`, passwordError)
                    throw passwordError.message
                }

                await query(
                    `mutation DeletePasswordToken($tokenId: ID!) {
                        deleteForgotPasswordAction(id: $tokenId) {
                          id
                        }
                      }
                    `,
                    { variables: { tokenId }, skipAccessControl: true },
                )

                return 'ok'
            },
        },
    ],
})

module.exports = {
    User,
    ForgotPasswordAction,
    ForgotPasswordService,
}
