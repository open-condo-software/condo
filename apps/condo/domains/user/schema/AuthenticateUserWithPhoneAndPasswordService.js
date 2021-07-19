const { getSchemaCtx, getById } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { User: UserServerUtils } = require('@condo/domains/user/utils/serverSchema')
const { WRONG_EMAIL_ERROR, WRONG_PASSWORD_ERROR, WRONG_PHONE_ERROR } = require('@condo/domains/user/constants/errors')
const { normalizePhone } = require('@condo/domains/common/utils/phone')

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
                // Todo(zuch): find a way to use several password auth strategy without breaking all tests
                // Maybe we can modify PasswordStrategy config identityField here from email to phone
                const { phone: inputPhone, password } = info.variableValues
                const phone = normalizePhone(inputPhone)
                if (!phone) {
                    throw new Error(`${WRONG_PHONE_ERROR}] phone format is not valid`)
                }
                const users = await UserServerUtils.getAll(context, { phone, type: 'staff' })
                if (users.length !== 1) {
                    const msg = `${WRONG_EMAIL_ERROR}] Unable to find user. Try to register`
                    throw new Error(msg)
                }
                // we need to use getById as we need to fetch email
                const user = await getById('User', users[0].id)
                // If we change identity field for PasswordStrategy from email to phone. We will break admin-ui-app
                // Maybe, we can cloneDeep PasswordStrategy
                const { keystone } = await getSchemaCtx('User')
                const { auth: { User: { password: PasswordStrategy } } } = keystone
                const { success, message } = await PasswordStrategy.validate({ email: user.email, password })
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
