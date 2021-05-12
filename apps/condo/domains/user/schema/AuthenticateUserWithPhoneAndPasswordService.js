const { getById, getSchemaCtx } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { PHONE_CLEAR_REGEXP } = require('@condo/domains/common/constants/regexps')
const { User } = require('@condo/domains/user/utils/serverSchema')
const { WRONG_EMAIL_ERROR, WRONG_PASSWORD_ERROR } = require('@condo/domains/user/constants/errors')

const AuthenticateUserWithPhoneAndPasswordService = new GQLCustomSchema('AuthenticateUserWithPhoneAndPasswordService', {
    types: [
        {
            access: true,
            type: 'input AuthenticateUserWithPhoneAndPasswordInput { phone: String! password: String! }',
        },
        {
            access: true,
            type: 'type AuthenticateUserWithPhoneAndPasswordOutput { item: User }',
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'authenticateUserWithPhoneAndPassword(data: AuthenticateUserWithPhoneAndPasswordInput!): AuthenticateUserWithPhoneAndPasswordOutput',
            resolver: async (parent, args, context, info, extra = {}) => {
                // Todo(zuch): find a way to use several password auth strategy without breaking all tests
                const { phone: inputPhone, password } = info.variableValues
                const phone = inputPhone.replace(PHONE_CLEAR_REGEXP, '')
                const users = await User.getAll(context, { phone })
                if (users.length !== 1) {
                    const msg = `${WRONG_EMAIL_ERROR}] Unable to find user. Try to register`
                    throw new Error(msg)
                }
                const user = await getById('User', users[0].id)

                const { keystone } = await getSchemaCtx(AuthenticateUserWithPhoneAndPasswordService)  

                const { auth: { User: { password: PasswordStrategy } } } = keystone
                
                const { success, message } = await PasswordStrategy.validate({ email: user.email, password })
                
                if (!success) {
                    throw new Error(`${WRONG_PASSWORD_ERROR}] ${message}`)
                }
                
                await context.startAuthedSession({ item: users[0], list: keystone.lists['User'] })

                const result = {
                    item: user,
                }
                return result
            },
        },
    ],
})

module.exports = {
    AuthenticateUserWithPhoneAndPasswordService,
}
