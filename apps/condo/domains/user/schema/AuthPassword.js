const { getById, getSchemaCtx } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')
const { PHONE_CLEAR_REGEXP } = require('@condo/domains/common/constants/regexps')

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
                await AuthenticateUserWithPhoneAndPasswordService.emit('beforeAuthenticateUserWithPhoneAndPassword', {
                    parent, args, context, info, extra,
                })
                const { phone: inputPhone, password } = info.variableValues
                const phone = inputPhone.replace(PHONE_CLEAR_REGEXP, '')
                console.log('Clear phone ', inputPhone, phone)

                const { errors: findErrors, data: findData } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query findUserByPhone($phone: String!) {
                          objs: allUsers(where: { phone: $phone }) {
                            id
                            phone
                          }
                        }
                    `,
                    variables: { phone },
                })

                if (findErrors || !findData.objs || findData.objs.length !== 1 || !findData.objs[0].id) {
                    const msg = '[notfound.error] Unable to find user. Try to register'
                    console.error(msg, findErrors)
                    throw new Error(msg)
                }

                const userData = findData.objs[0]

                const { keystone } = await getSchemaCtx(AuthenticateUserWithPhoneAndPasswordService)  

                const { auth:{ User: { password:PasswordStrategy } } } = keystone
                
                const { success, message } = await PasswordStrategy.validate({ phone, password })
                
                if (!success) {
                    console.error(message, 'Validate password')
                    throw new Error(message)
                }
                await context.startAuthedSession({ item: userData, list: keystone.lists['User'] })
                const result = {
                    item: await getById('User', userData.id),
                }
                await AuthenticateUserWithPhoneAndPasswordService.emit('afterAuthenticateUserWithFirebaseIdToken', {
                    parent, args, context, info, extra, result,
                })
                return result
            },
        },
    ],
})

module.exports = {
    AuthenticateUserWithPhoneAndPasswordService,
}
