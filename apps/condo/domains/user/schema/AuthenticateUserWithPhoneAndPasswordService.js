const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { GQLCustomSchema } = require('@open-condo/keystone/schema')

const { WRONG_PHONE_FORMAT } = require('@condo/domains/common/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { STAFF } = require('@condo/domains/user/constants/common')
const { WRONG_CREDENTIALS } = require('@condo/domains/user/constants/errors')
const { authGuards, validateUserCredentials } = require('@condo/domains/user/utils/serverSchema/auth')


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
    WRONG_CREDENTIALS: {
        mutation: 'authenticateUserWithPhoneAndPassword',
        code: BAD_USER_INPUT,
        type: WRONG_CREDENTIALS,
        message: 'Wrong phone or password',
        messageForUser: 'api.user.authenticateUserWithPhoneAndPassword.WRONG_CREDENTIALS',
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

                await authGuards({ phone, userType: STAFF }, context)

                if (!phone) {
                    throw new GQLError(ERRORS.WRONG_PHONE_FORMAT, context)
                }

                const { success, user } = await validateUserCredentials(
                    { phone, userType: STAFF },
                    { password }
                )

                if (!success) {
                    throw new GQLError(ERRORS.WRONG_CREDENTIALS, context)
                }

                const { keystone } = getSchemaCtx('User')
                const token = await context.startAuthedSession({ item: user, list: keystone.lists['User'] })

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
