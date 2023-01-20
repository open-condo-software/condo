const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')
const access = require('@open-condo/webhooks/schema/access/Webhook')

const Webhook = new GQLListSchema('Webhook', {
    schemaDoc: 'Webhooks are a way that the APP can send automated web callback with some messages ' +
        'to other apps or system to inform them about any updates. ' +
        'How does it work: ' +
        '1. When objects are created or changed, we make requests to the GraphQL API to get data on behalf of the specified user; ' +
        '2. Then we send the data to remote url. ' +
        'Webhook model contains basic configuration of integration, such as external server url, name, encryption parameters and so on.',
    fields: {
        name: {
            schemaDoc: 'Short name used to distinguish this hook from others. Usually it\'s the name of the integration',
            type: 'Text',
            isRequired: true,
        },
        description: {
            schemaDoc: 'Any other details that reveal the purpose of this hook',
            type: 'Text',
            isRequired: false,
        },
        url: {
            schemaDoc: 'Webhook target URL to which requests will be sent',
            type: 'Url',
            isRequired: true,
        },
        user: {
            schemaDoc: 'The user on whose behalf a request is being made to the GraphQL API to prepare webhook data',
            type: 'Relationship',
            ref: 'User',
            isRequired: true,
            knexOptions: { isNotNullable: true }, // Relationship only!
            kmigratorOptions: { null: false, on_delete: 'models.PROTECT' },
        },
    },
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    access: {
        read: access.canReadWebhooks,
        create: access.canManageWebhooks,
        update: access.canManageWebhooks,
        delete: false,
        auth: true,
    },
})

module.exports = {
    Webhook,
}