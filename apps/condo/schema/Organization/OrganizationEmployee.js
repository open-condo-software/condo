const faker = require('faker')
const { v4: uuid } = require('uuid')

const { Text, Relationship, Uuid, Checkbox } = require('@keystonejs/fields')

const access = require('@core/keystone/access')
const { GQLListSchema } = require('@core/keystone/schema')
const { historical, versioned, tracked } = require('@core/keystone/plugins')

const { ORGANIZATION_OWNED_FIELD, SENDER_FIELD, DV_FIELD } = require('../_common')
const { rules } = require('../../access')
const { DV_UNKNOWN_VERSION_ERROR } = require('../../constants/errors')
const { hasRequestAndDbFields, hasOneOfFields } = require('../../utils/validation.utils')

const OrganizationEmployee = new GQLListSchema('OrganizationEmployee', {
    schemaDoc: 'B2B customer employees',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        organization: { ...ORGANIZATION_OWNED_FIELD, ref: 'Organization.employees' },

        user: {
            schemaDoc: 'If user exists => invite is matched by email/phone (user can reject or accept it)',
            type: Relationship,
            ref: 'User',
            isRequired: false,
            knexOptions: { isNotNullable: false }, // Relationship only!
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
            access: {
                read: true,
                update: access.userIsAdmin,
                create: access.userIsAdmin,
            },
        },

        inviteCode: {
            schemaDoc: 'Secret invite code (used for accept invite verification)',
            type: Uuid,
            defaultValue: () => uuid(),
            kmigratorOptions: { null: true, unique: true },
            access: {
                read: access.userIsAdmin,
                update: access.userIsAdmin,
                create: access.userIsAdmin,
            },
        },

        name: {
            factory: () => faker.fake('{{name.suffix}} {{name.firstName}} {{name.lastName}}'),
            type: Text,
        },
        email: {
            factory: () => faker.internet.exampleEmail().toLowerCase(),
            type: Text,
            isRequired: false,
            kmigratorOptions: { null: true },
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['email'] && resolvedData['email'].toLowerCase()
                },
            },
        },
        phone: {
            type: Text,
            isRequired: false,
            kmigratorOptions: { null: true },
            hooks: {
                resolveInput: async ({ resolvedData }) => {
                    return resolvedData['phone'] && resolvedData['phone'].toLowerCase().replace(/\D/g, '')
                },
            },
        },

        role: {
            type: Relationship,
            ref: 'OrganizationEmployeeRole',
            isRequired: true,
            knexOptions: { isNotNullable: false }, // Relationship only!
            kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
        },

        isAccepted: {
            type: Checkbox,
            defaultValue: false,
            knexOptions: { isNotNullable: false },
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
        isRejected: {
            type: Checkbox,
            defaultValue: false,
            knexOptions: { isNotNullable: false },
            access: {
                read: true,
                create: access.userIsAdmin,
                update: access.userIsAdmin,
            },
        },
    },
    plugins: [versioned(), tracked(), historical()],
    access: {
        read: rules.canReadEmployees,
        create: rules.canManageEmployees,
        update: rules.canManageEmployees,
        delete: rules.canManageEmployees,
        auth: true,
    },
    hooks: {
        validateInput: ({ resolvedData, existingItem, addValidationError }) => {
            if (!hasRequestAndDbFields(['dv', 'sender'], ['organization'], resolvedData, existingItem, addValidationError)) return
            if (!hasOneOfFields(['email', 'name', 'phone'], resolvedData, existingItem, addValidationError)) return
            const { dv } = resolvedData
            if (dv === 1) {
                // NOTE: version 1 specific translations. Don't optimize this logic
            } else {
                return addValidationError(`${DV_UNKNOWN_VERSION_ERROR}dv] Unknown \`dv\``)
            }
        },
    },
})

module.exports = {
    OrganizationEmployee,
}