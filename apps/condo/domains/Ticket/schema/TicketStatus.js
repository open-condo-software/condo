const { GQLListSchema } = require('@core/keystone/schema')
const { historical, versioned, uuided, tracked, softDeleted } = require('@core/keystone/plugins')
const { Text, Select } = require('@keystonejs/fields')

const { SENDER_FIELD, DV_FIELD } = require('../../../schema/_common')
const { COMMON_AND_ORGANIZATION_OWNED_FIELD } = require('../../../schema/_common')

const READ_ONLY_ACCESS = {
    read: true,
    create: false,
    update: false,
    delete: false,
    auth: false,
}

const TicketStatus = new GQLListSchema('TicketStatus', {
    schemaDoc: 'Ticket status. We have a organization specific statuses',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        organization: COMMON_AND_ORGANIZATION_OWNED_FIELD,

        type: {
            type: Select,
            isRequired: true,
            options: 'new_or_reopened, processing, canceled, completed, deferred',
            schemaDoc: 'Ticket status. You should also increase `statusReopenedCounter` if you want to reopen ticket',
            // DEFERRED Отложена + Дата возвращения заявки в работу + deferment_by
            // MORE EXAMPLES: 'inModeration', 'assigned', 'accepted', 'reopened', 'onRoad', 'inWork', 'completed', 'checking', 'closed'
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
    TicketStatus,
}