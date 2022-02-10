const { getSchemaCtx, getById } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { User: UserServerUtils } = require('@condo/domains/user/utils/serverSchema')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { STAFF } = require('@condo/domains/user/constants/common')
const { GQLError, GQLErrorCode } = require('@core/keystone/errors')

/**
 * List of possible errors, that this custom schema can throw
 * They will be rendered in documentation section in GraphiQL for this custom schema
 */
const errors = {
    WRONG_PHONE_FORMAT: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: GQLErrorCode.BAD_USER_INPUT,
        variable: ['data', 'phone'],
        message: 'Wrong format of provided phone number',
        correctExample: '+79991234567',
    },
    UNABLE_TO_FIND_USER_BY_PHONE: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: GQLErrorCode.NOT_FOUND,
        message: 'Unable to find user by provided phone. Try to register',
        variable: ['data', 'phone'],
    },
    WRONG_PASSWORD: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: GQLErrorCode.FORBIDDEN,
        message: 'Wrong password',
        variable: ['data', 'password'],
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
                    throw new GQLError(errors.WRONG_PHONE_FORMAT)
                }
                const users = await UserServerUtils.getAll(context, { phone, type: STAFF })
                if (users.length !== 1) {
                    throw new GQLError(errors.UNABLE_TO_FIND_USER_BY_PHONE)
                }
                const user = await getById('User', users[0].id)
                const { keystone } = await getSchemaCtx('User')
                const { auth: { User: { password: PasswordStrategy } } } = keystone
                const list = PasswordStrategy.getList()
                const { success } = await PasswordStrategy._matchItem(user, { password }, list.fieldsByPath['password'] )
                if (!success) {
                    throw new GQLError(errors.WRONG_PASSWORD)
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
