const { Wysiwyg } = require('@keystonejs/fields-wysiwyg-tinymce')
const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { Text, Checkbox, File, Relationship } = require('@keystonejs/fields')
const { User: BaseUser, ForgotPasswordAction, ForgotPasswordService, RegisterNewUserService: BaseRegisterNewUserService } = require('@core/keystone/schemas/User')
const conf = require('@core/config')
const access = require('@core/keystone/access')
const faker = require('faker')
const { admin } = require('@app/_back02keystone/utils/firebase')

const { Stars, Options, Json } = require('@app/_back02keystone/custom-fields')

const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/avatars`,
    path: `${conf.MEDIA_URL}/avatars`,
})

const User = BaseUser._override({
    fields: {
        avatar: { type: File, adapter: AVATAR_FILE_ADAPTER },
        rating: { type: Stars, starCount: 5 },
        settings: { type: Options, options: ['Feature1', 'Feature2'] },
        meta: { type: Json },
        aboutMyself: { type: Wysiwyg },
        phone: {
            factory: () => faker.phone.phoneNumberFormat(),
            type: Text,
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['phone'] && resolvedData['phone'].toLowerCase().replace(/[^+0-9]/g, '')
                },
            },
            // TODO(pahaz): think about mongodb!
            kmigratorOptions: { unique: true },  // Just for postgres (bug with mongo)
        },
        isPhoneVerified: {
            type: Checkbox,
            defaultValue: false,
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
        importId: {
            factory: () => faker.random.uuid(),
            type: Text,
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
            // TODO(pahaz): think about mongodb!
            kmigratorOptions: { unique: true },  // Just for postgres (bug with mongo)
        },
        purchasedFunctions: {
            type: Relationship,
            many: true,
            ref: 'Function'
        }
    },
})

const RegisterNewUserService = BaseRegisterNewUserService._override({
    types: [
        {
            access: true,
            type: 'input RegisterNewUserInput { name: String!, email: String!, password: String!, firebaseIdToken: String }',
        },
    ],
})

async function checkUnique (context, model, models, field, value) {
    const { errors, data } = await context.executeGraphQL({
        context: context.createContext({ skipAccessControl: true }),
        query: `
            query find($where: ${model}WhereInput!) {
              objs: all${models}(where: $where) {
                id
              }
            }
        `,
        variables: { where: { [field]: value } },
    })

    if (errors) {
        const msg = `[error] Unable to check field ${field} uniques`
        console.error(msg, errors)
        throw new Error(msg)
    }

    if (data.objs.length !== 0) {
        throw new Error(`[unique:${field}:multipleFound] ${models} with this ${field} is already exists`)
    }
}

RegisterNewUserService.on('beforeRegisterNewUser', async ({ parent, args, context, info, extra }) => {
    const idToken = args.data.firebaseIdToken
    if (!idToken) return

    delete args.data.firebaseIdToken
    const { uid, phone_number } = await admin.auth().verifyIdToken(idToken)
    await checkUnique(context, 'User', 'Users', 'phone', phone_number)
    await checkUnique(context, 'User', 'Users', 'importId', uid)
    extra.extraUserData = {
        phone: phone_number,
        isPhoneVerified: true,
        importId: uid,
    }
})

ForgotPasswordService.on('afterStartPasswordRecovery', ({ parent, args, context, info, extra, result }) => {
    console.log('Fake send security email!', JSON.stringify(result))
})

ForgotPasswordService.on('afterChangePasswordWithToken', ({ parent, args, context, info, extra, result }) => {
    console.log('Fake send security email!', JSON.stringify(result))
})

module.exports = {
    User,
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterNewUserService,
}
