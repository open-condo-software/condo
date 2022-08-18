const { GQLListSchema } = require('@condo/keystone/schema')
const { ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')
const { uuided, versioned, tracked, softDeleted, historical } = require('@condo/keystone/plugins')
const { dvAndSender } = require('@condo/domains/common/schema/plugins/dvAndSender')
const access = require('@condo/domains/ticket/access/TicketOrganizationSetting')
const { generateTicketDefaultDeadlineFields } = require('@condo/domains/ticket/schema/fields/TicketOrganizationSetting')

const TicketOrganizationSetting = new GQLListSchema('TicketOrganizationSetting', {
    schemaDoc: 'Ticket settings rules for each organization',
    fields: {
        organization: {
            ...ORGANIZATION_OWNED_FIELD,
            kmigratorOptions: {
                ...ORGANIZATION_OWNED_FIELD.kmigratorOptions,
                unique: true,
            },
        },
        ...generateTicketDefaultDeadlineFields(),
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    access: {
        read: access.canReadTicketOrganizationSetting,
        create: false,
        update: access.canUpdateTicketOrganizationSetting,
        delete: false,
        auth: true,
    },
})

module.exports = {
    TicketOrganizationSetting,
}