const { Select } = require('@keystonejs/fields')

const LocalizedText = require('@core/keystone/fields/LocalizedText')
const { GQLListSchema } = require('@core/keystone/schema')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const { SENDER_FIELD, DV_FIELD } = require('@condo/domains/common/schema/fields')
const { COMMON_AND_ORGANIZATION_OWNED_FIELD } = require('@condo/domains/organization/schema/fields')

const { TICKET_SOURCE_TYPES } = require('@condo/domains/ticket/constants/common')

const READ_ONLY_ACCESS = {
    read: true,
    create: false,
    update: false,
    delete: false,
    auth: false,
}

const TicketSource = new GQLListSchema('TicketSource', {
    schemaDoc: 'Ticket source. Income call, mobile app, external system, ...',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        organization: COMMON_AND_ORGANIZATION_OWNED_FIELD,

        type: {
            type: Select,
            isRequired: true,
            options: Object.values(TICKET_SOURCE_TYPES),
        },

        name: {
            schemaDoc: 'Localized Ticket source name',
            type: LocalizedText,
            isRequired: true,
            template: 'ticket.source.*.name',
        },

    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    // TODO(Dimitreee):use access check from access.js
    access: READ_ONLY_ACCESS,
})

module.exports = {
    TicketSource,
}