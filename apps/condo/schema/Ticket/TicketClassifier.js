const { Text, Relationship, Virtual } = require('@keystonejs/fields')

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

const TicketClassifier = new GQLListSchema('TicketClassifier', {
    schemaDoc: 'Ticket typification/classification. We have a organization specific classification. We check the ticket attrs differently depending on the classifier',
    fields: {
        dv: DV_FIELD,
        sender: SENDER_FIELD,

        organization: COMMON_AND_ORGANIZATION_OWNED_FIELD,

        parent: {
            schemaDoc: 'Multi level classification support',
            type: Relationship,
            ref: 'TicketClassifier',
            kmigratorOptions: { null: true, on_delete: 'models.PROTECT' },
        },
        fullName: {
            schemaDoc: 'Multi level name',
            type: Virtual,
            resolver: item => `${item.parent} -- ${item.name}`,
        },
        name: {
            schemaDoc: 'This level name',
            type: Text,
            isRequired: true,
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), historical()],
    access: READ_ONLY_ACCESS,
})

module.exports = {
    TicketClassifier,
}
