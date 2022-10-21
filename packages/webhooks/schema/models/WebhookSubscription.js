const { Relationship, DateTimeUtc, Select, Text } = require('@keystonejs/fields')
const { Json } = require('@condo/keystone/fields')
const { uuided, versioned, tracked, softDeleted, dvAndSender, historical } = require('@condo/keystone/plugins')
const { GQLListSchema } = require('@condo/keystone/schema')
const access = require('@condo/webhooks/schema/access/WebhookSubscription')
const { WebHookModelValidator } = require('@condo/webhooks/model-validator')

function getWebhookSubscriptionModel (modelValidator) {
    return new GQLListSchema('WebhookSubscription', {
        schemaDoc: 'Determines which models the WebHook will be subscribed to. When model changes subscription task will be triggered to resolve changed data and send a webhook',
        fields: {
            webhook: {
                schemaDoc: 'Link to a webhook containing information about integration',
                type: Relationship,
                ref: 'Webhook',
                isRequired: true,
                knexOptions: { isNotNullable: true },
                kmigratorOptions: { null: false, on_delete: 'models.CASCADE' },
            },
            url: {
                schemaDoc: 'Webhook target URL to which requests will be sent. Overrides url from webhook relation. ' +
                    'Used in case when you need to send specific model to a separate url',
                type: 'Url',
                isRequired: false,
            },
            syncedAt: {
                schemaDoc: 'The time was the data was last synced. At the next synchronization, only objects that have changed since that time will be sent.',
                type: DateTimeUtc,
                isRequired: true,
            },
            model: {
                schemaDoc: 'The data model (schema) that the webhook is subscribed to',
                type: Select,
                dataType: 'string',
                isRequired: true,
                options: modelValidator.models,
            },
            fields: {
                schemaDoc: 'String representing list of model fields in graphql-query format. ' +
                    'Exactly the fields specified here will be sent by the webhook. ' +
                    'Correct examples: "field1 field2 { subfield }", "{ field1 relation { subfield } }"',
                type: Text,
                isRequired: true,
                hooks: {
                    resolveInput: ({ resolvedData, fieldPath }) => {
                        if (!resolvedData[fieldPath]) return resolvedData[fieldPath]
                        return WebHookModelValidator.normalizeFieldsString(resolvedData[fieldPath])
                    },
                    validateInput: ({ resolvedData, fieldPath, existingItem, addFieldValidationError }) => {
                        const newItem = { ...existingItem, ...resolvedData }
                        const { isValid, errors } = modelValidator.validateFields(newItem.model, resolvedData[fieldPath])
                        if (!isValid) {
                            const errorMessage = errors.map(error => {
                                if (typeof error === 'string') {
                                    return `"${error}"`
                                } else {
                                    return JSON.stringify(error)
                                }
                            }).join(', ')
                            return addFieldValidationError(`Invalid fields for model "${newItem.model}" was provided. Details: [${errorMessage}]`)
                        }
                    },
                },
            },
            filters: {
                schemaDoc: 'Filters which is stored in JSON and used to filter models sent by the webhook. ' +
                    'Examples of filters can be found in ModelWhereInput GQL type, ' +
                    'where Model is name of your model',
                type: Json,
                isRequired: true,
                kmigratorOptions: { null: false },
                hooks: {
                    validateInput: ({ resolvedData, fieldPath, existingItem, addFieldValidationError }) => {
                        const newItem = { ...existingItem, ...resolvedData }
                        const { isValid, errors } = modelValidator.validateFilters(newItem.model, resolvedData[fieldPath])
                        if (!isValid) {
                            return addFieldValidationError(`Invalid filters for model "${newItem.model}" was provided. Details: ${JSON.stringify(errors)}`)
                        }
                    },
                },
            },
        },
        plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
        access: {
            read: access.canReadWebhookSubscriptions,
            create: access.canManageWebhookSubscriptions,
            update: access.canManageWebhookSubscriptions,
            delete: false,
            auth: true,
        },
    })
}

module.exports = {
    getWebhookSubscriptionModel,
}
