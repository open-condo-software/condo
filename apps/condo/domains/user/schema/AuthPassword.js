const { getById, getSchemaCtx } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { PHONE_CLEAR_REGEXP } = require('@condo/domains/common/constants/regexps')
const get = require('lodash/get')
const { User } = require('@condo/domains/user/utils/serverSchema')


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
                const { phone: inputPhone, password } = info.variableValues
                const phone = inputPhone.replace(PHONE_CLEAR_REGEXP, '')

                const users = await User.getAll(context, { phone })
                if (users.length !== 1) {
                    const msg = '[notfound.error] Unable to find user. Try to register'
                    throw new Error(msg)
                }

                const { keystone } = await getSchemaCtx(AuthenticateUserWithPhoneAndPasswordService)  

                const { auth: { User: { password: PasswordStrategy } } } = keystone
                
                const { success, message } = await PasswordStrategy.validate({ phone, password })
                
                if (!success) {
                    throw new Error(message)
                }
                
                await context.startAuthedSession({ item: users[0], list: keystone.lists['User'] })

                const result = {
                    item: await getById('User', users[0].id),
                }
                return result
            },
        },
    ],
})

module.exports = {
    AuthenticateUserWithPhoneAndPasswordService,
}
