const { Text, Select } = require('@keystonejs/fields')

const { COMMON_AND_ORGANIZATION_OWNED_FIELD } = require('../_common')
const { GQLListSchema } = require('@core/keystone/schema')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')

const { SENDER_FIELD, DV_FIELD } = require('../_common')

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
            options: 'mobile_app, web_app, organization_site, call, visit, email, social_network, messenger, remote_system, other',
        },
        name: {
            type: Text,
            isRequired: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    // TODO(Dimitreee):use access check from access.js
    access: READ_ONLY_ACCESS,
})

module.exports = {
    TicketSource,
}