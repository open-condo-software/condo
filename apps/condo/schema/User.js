const faker = require('faker')

const { LocalFileAdapter } = require('@keystonejs/file-adapters')
const { File, Checkbox, Text, DateTimeUtc, Relationship } = require('@keystonejs/fields')

const conf = require('@core/config')
const access = require('@core/keystone/access')
const { SENDER_FIELD } = require('./_common')
const { DV_FIELD } = require('./_common')
const { ForgotPasswordService } = require('@core/keystone/schemas/User')
const { User: BaseUser } = require('@core/keystone/schemas/User')
const { ForgotPasswordAction: BaseForgotPasswordAction } = require('@core/keystone/schemas/User')
const { RegisterNewUserService: BaseRegisterNewUserService } = require('@core/keystone/schemas/User')
const { Json } = require('@core/keystone/fields')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const { admin } = require('@condo/domains/common/utils/firebase.back.utils')

const AVATAR_FILE_ADAPTER = new LocalFileAdapter({
    src: `${conf.MEDIA_ROOT}/avatars`,
    path: `${conf.MEDIA_URL}/avatars`,
})

const USER_OWNED_FIELD = {
    schemaDoc: 'Ref to the user. The object will be deleted if the user ceases to exist',
    type: Relationship,
    ref: 'User',
    isRequired: true,
    knexOptions: { isNotNullable: true }, // Relationship only!
    kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
    access: {
        read: true,
        create: false, // TODO(pahaz): check access!
        update: access.userIsAdmin,
        delete: false,
    },
}

const ForgotPasswordAction = BaseForgotPasswordAction._override({
    fields: {
        user: USER_OWNED_FIELD,

        requestedAt: {
            factory: () => new Date(Date.now()).toISOString(),
            type: DateTimeUtc,
            isRequired: true,
        },
        expiresAt: {
            factory: () => new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString(),
            type: DateTimeUtc,
            isRequired: true,
        },
        usedAt: {
            type: DateTimeUtc,
            defaultValue: null,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: {
        auth: true,
        read: access.userIsAdmin,
        create: access.userIsAdmin,
        update: access.userIsAdmin,
        delete: access.userIsAdmin,
    },
})

const RegisterNewUserService = BaseRegisterNewUserService._override({
    types: [
        {
            access: true,
            type: 'input RegisterNewUserInput { dv: Int!, sender: JSON!, name: String!, email: String!, password: String!, firebaseIdToken: String, meta: JSON }',
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

module.exports = {
    ForgotPasswordAction,
    ForgotPasswordService,
    RegisterNewUserService,
}
