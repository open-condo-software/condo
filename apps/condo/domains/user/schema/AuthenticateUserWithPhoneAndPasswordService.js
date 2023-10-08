const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { WRONG_PHONE_FORMAT } = require('@condo/domains/common/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { STAFF } = require('@condo/domains/user/constants/common')
const { User } = require('@condo/domains/user/utils/serverSchema')

const { USER_NOT_FOUND, WRONG_PASSWORD } = require('../constants/errors')

/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const ERRORS = {
    WRONG_PHONE_FORMAT: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: BAD_USER_INPUT,
        type: WRONG_PHONE_FORMAT,
        variable: ['data', 'phone'],
        message: 'Wrong format of provided phone number',
        correctExample: '+79991234567',
        messageForUser: 'api.common.WRONG_PHONE_FORMAT',
    },
    USER_NOT_FOUND: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: BAD_USER_INPUT,
        type: USER_NOT_FOUND,
        message: 'Unable to find user by provided phone. Try to register',
        variable: ['data', 'phone'],
        messageForUser: 'api.user.authenticateUserWithPhoneAndPassword.USER_NOT_FOUND',
    },
    WRONG_PASSWORD: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: BAD_USER_INPUT,
        type: WRONG_PASSWORD,
        message: 'Wrong password',
        variable: ['data', 'password'],
        messageForUser: 'api.user.authenticateUserWithPhoneAndPassword.WRONG_PASSWORD',
    },
}

const AuthenticateUserWithPhoneAndPasswordService = new GQLCustomSchema('AuthenticateUserWithPhoneAndPasswordService', {
    types: [
        {
            access: true,
            type: 'input AuthenticateUserWithPhoneAndPasswordInput { phone: String! password: String! }',
        },
        {
            access: true,
            type: 'type AuthenticateUserWithPhoneAndPasswordOutput { item: User, token: String! }',
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'authenticateUserWithPhoneAndPassword(data: AuthenticateUserWithPhoneAndPasswordInput!): AuthenticateUserWithPhoneAndPasswordOutput',
            resolver: async (parent, args, context) => {
                const { data: { phone: inputPhone, password } } = args
                const phone = normalizePhone(inputPhone)
                if (!phone) {
                    throw new GQLError(ERRORS.WRONG_PHONE_FORMAT, context)
                }
                const users = await User.getAll(context, { phone, type: STAFF, deletedAt: null })
                if (users.length !== 1) {
                    throw new GQLError(ERRORS.USER_NOT_FOUND, context)
                }
                const user = await getById('User', users[0].id)
                const { keystone } = await getSchemaCtx('User')
                const { auth: { User: { password: PasswordStrategy } } } = keystone
                const list = PasswordStrategy.getList()
                const { success } = await PasswordStrategy._matchItem(user, { password }, list.fieldsByPath['password'] )
                if (!success) {
                    throw new GQLError(ERRORS.WRONG_PASSWORD, context)
                }
                const token = await context.startAuthedSession({ item: users[0], list: keystone.lists['User'] })
                return {
                    item: user,
                    token,
                }
            },
        },
    ],
})

module.exports = {
    AuthenticateUserWithPhoneAndPasswordService,
}
