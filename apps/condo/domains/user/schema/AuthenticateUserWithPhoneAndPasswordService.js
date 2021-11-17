const { getSchemaCtx, getById } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { User: UserServerUtils } = require('@condo/domains/user/utils/serverSchema')
const { WRONG_EMAIL_ERROR, WRONG_PASSWORD_ERROR, WRONG_PHONE_ERROR } = require('@condo/domains/user/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')
const { STAFF } = require('@condo/domains/user/constants/common')


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
                    throw new Error(`${WRONG_PHONE_ERROR}] phone format is not valid`)
                }
                const users = await UserServerUtils.getAll(context, { phone, type: STAFF })
                if (users.length !== 1) {
                    const msg = `${WRONG_EMAIL_ERROR}] Unable to find user. Try to register`
                    throw new Error(msg)
                }
                const user = await getById('User', users[0].id)
                const { keystone } = await getSchemaCtx('User')
                const { auth: { User: { password: PasswordStrategy } } } = keystone
                const list = PasswordStrategy.getList()
                const { success, message } = await PasswordStrategy._matchItem(user, { password }, list.fieldsByPath['password'] )
                if (!success) {
                    throw new Error(`${WRONG_PASSWORD_ERROR}] ${message}`)
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
