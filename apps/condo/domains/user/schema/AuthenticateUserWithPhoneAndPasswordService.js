const { getSchemaCtx, getById } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { User: UserServerUtils } = require('@condo/domains/user/utils/serverSchema')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { STAFF } = require('@condo/domains/user/constants/common')
const { GQLError, GQLErrorCode: { BAD_USER_INPUT, FORBIDDEN } } = require('@core/keystone/errors')
const { WRONG_FORMAT } = require('@condo/domains/common/constants/errors')
const { USER_NOT_FOUND } = require('../constants/errors')

/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const errors = {
    WRONG_PHONE_FORMAT: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: BAD_USER_INPUT,
        type: WRONG_FORMAT,
        variable: ['data', 'phone'],
        message: 'Wrong format of provided phone number',
        correctExample: '+79991234567',
        messageForUser: 'api.user.authenticateUserWithPhoneAndPassword.WRONG_PHONE_FORMAT',
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
        code: FORBIDDEN,
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
            resolver: async (parent, args, context, info, extra = {}) => {
                const { phone: inputPhone, password } = info.variableValues
                const phone = normalizePhone(inputPhone)
                if (!phone) {
                    throw new GQLError(errors.WRONG_PHONE_FORMAT, context)
                }
                const users = await UserServerUtils.getAll(context, { phone, type: STAFF })
                if (users.length !== 1) {
                    throw new GQLError(errors.USER_NOT_FOUND, context)
                }
                const user = await getById('User', users[0].id)
                const { keystone } = await getSchemaCtx('User')
                const { auth: { User: { password: PasswordStrategy } } } = keystone
                const list = PasswordStrategy.getList()
                const { success } = await PasswordStrategy._matchItem(user, { password }, list.fieldsByPath['password'] )
                if (!success) {
                    throw new GQLError(errors.WRONG_PASSWORD, context)
                }
                const token = await context.startAuthedSession({ item: users[0], list: keystone.lists['User'] })
                const result = {
                    item: user,
                    token,
                }
                return result
            },
        },
    ],
})

module.exports = {
    AuthenticateUserWithPhoneAndPasswordService,
}
