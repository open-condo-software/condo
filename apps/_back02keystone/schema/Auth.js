const { getById, getSchemaCtx } = require('@core/keystone/schema')
const { GQLCustomSchema } = require('@core/keystone/schema')

const { admin } = require('../utils/firebase')

const AuthenticateUserWithFirebaseIdTokenService = new GQLCustomSchema('AuthenticateUserWithFirebaseIdTokenService', {
    types: [
        {
            access: true,
            type: 'input AuthenticateUserWithFirebaseIdTokenInput { firebaseIdToken: String! }',
        },
        {
            access: true,
            type: 'type AuthenticateUserWithFirebaseIdTokenOutput { item: User }',
        },
    ],
    mutations: [
        {
            access: true,
            schema: 'authenticateUserWithFirebaseIdToken(data: AuthenticateUserWithFirebaseIdTokenInput!): AuthenticateUserWithFirebaseIdTokenOutput',
            resolver: async (parent, args, context, info, extra = {}) => {
                await AuthenticateUserWithFirebaseIdTokenService.emit('beforeAuthenticateUserWithFirebaseIdToken', {
                    parent, args, context, info, extra,
                })

                const { data } = args
                const { firebaseIdToken } = data
                if (!firebaseIdToken) throw new Error('[error] no firebaseIdToken')

                const { uid, phone_number } = await admin.auth().verifyIdToken(firebaseIdToken)

                const { errors: err1, data: data1 } = await context.executeGraphQL({
                    context: context.createContext({ skipAccessControl: true }),
                    query: `
                        query findUserByImportId($uid: String!) {
                          objs: allUsers(where: { importId: $uid }) {
                            id
                            importId
                            email
                            phone
                          }
                        }
                    `,
                    variables: { uid },
                })

                if (err1 || !data1.objs || data1.objs.length !== 1 || !data1.objs[0].id) {
                    const msg = '[notfound.error] Unable to find user. Try to register'
                    console.error(msg, err1)
                    throw new Error(msg)
                }

                const userObj = data1.objs[0]

                if (userObj.phone !== phone_number) {
                    // TODO(pahaz): need to replace obj.phone by Firebase.phone_number
                }

                const { keystone } = await getSchemaCtx(AuthenticateUserWithFirebaseIdTokenService)
                await context.startAuthedSession({ item: userObj, list: keystone.lists['User'] })

                const result = {
                    item: await getById('User', userObj.id),
                }
                await AuthenticateUserWithFirebaseIdTokenService.emit('afterAuthenticateUserWithFirebaseIdToken', {
                    parent, args, context, info, extra, result,
                })
                return result
            },
        },
    ],
})

module.exports = {
    AuthenticateUserWithFirebaseIdTokenService,
}
