const { DEFAULT_STATUS_TRANSITIONS } = require('@condo/domains/ticket/constants/statusTransitions')
const { Text, Checkbox } = require('@keystonejs/fields')
const { GQLListSchema } = require('@core/keystone/schema')
const { historical, versioned, uuided, tracked } = require('@core/keystone/plugins')
const { ORGANIZATION_OWNED_FIELD, SENDER_FIELD, DV_FIELD } = require('../../../schema/_common')
const { rules } = require('../../../access')
const { Json } = require('@core/keystone/fields')
const { hasValidJsonStructure } = require('@condo/domains/common/utils/validation.utils')

const OrganizationEmployeeRole = new GQLListSchema('OrganizationEmployeeRole', {
    schemaDoc: 'Employee role name and access permissions',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        organization: ORGANIZATION_OWNED_FIELD,

        name: {
            type: Text,
            isRequired: true,
        },

        statusTransitions: {
            schemaDoc: 'Employee status transitions map',
            type: Json,
            required: true,
            defaultValue: DEFAULT_STATUS_TRANSITIONS,
            hooks: {
                validateInput: (args) => {
                    return hasValidJsonStructure(args, true, 1, {})
                },
            },
            access: {
                update: rules.canUpdateTicketStatusTransitions,
                create: rules.canUpdateTicketStatusTransitions,
                read: true,
            },
        },

        canManageOrganization: { type: Checkbox, defaultValue: false },
        canManageEmployees: { type: Checkbox, defaultValue: false },
        canManageRoles: { type: Checkbox, defaultValue: false },
        canManageIntegrations: { type: Checkbox, defaultValue: false },
    },
    plugins: [uuided(), versioned(), tracked(), historical()],
    access: {
        read: rules.canReadRoles,
        create: rules.canManageRoles,
        update: rules.canManageRoles,
        delete: rules.canManageRoles,
        auth: true,
    },
})

module.exports = {
    OrganizationEmployeeRole,
}