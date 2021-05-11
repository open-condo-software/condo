const { DateTimeUtc, Relationship } = require('@keystonejs/fields')

const access = require('@core/keystone/access')
const { ForgotPasswordService } = require('@core/keystone/schemas/User')
const { ForgotPasswordAction: BaseForgotPasswordAction } = require('@core/keystone/schemas/User')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

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

module.exports = {
    ForgotPasswordAction,
    ForgotPasswordService,
}
