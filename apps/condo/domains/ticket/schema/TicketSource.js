const { Select } = require('@keystonejs/fields')

const { LocalizedText } = require('@open-condo/keystone/fields')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')

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
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    // TODO(Dimitreee):use access check from access.js
    access: READ_ONLY_ACCESS,
    escapeSearch: true,
})

module.exports = {
    TicketSource,
}