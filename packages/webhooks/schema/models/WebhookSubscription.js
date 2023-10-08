const { Relationship, DateTimeUtc, Select, Text, Integer } = require('@keystonejs/fields')

const conf = require('@open-condo/config')
const { Json } = require('@open-condo/keystone/fields')
const { uuided, versioned, tracked, softDeleted, dvAndSender, historical } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')
const { DEFAULT_MAX_PACK_SIZE, DEFAULT_UNAVAILABILITY_THRESHOLD } = require('@open-condo/webhooks/constants')
const { WebHookModelValidator, getModelValidator, setModelValidator } = require('@open-condo/webhooks/model-validator')
const access = require('@open-condo/webhooks/schema/access/WebhookSubscription')

const UNAVAILABILITY_THRESHOLD = (typeof conf['WEBHOOK_BLOCK_THRESHOLD'] === 'number' && conf['WEBHOOK_BLOCK_THRESHOLD'] > 0)
    ? conf['WEBHOOK_BLOCK_THRESHOLD']
    : DEFAULT_UNAVAILABILITY_THRESHOLD

function getWebhookSubscriptionModel (schemaPath) {
    if (!getModelValidator()) {
        setModelValidator(new WebHookModelValidator(schemaPath))
    }

    const validator = getModelValidator()

    const validateFields = ({ resolvedData, existingItem, addFieldValidationError }) => {
        const newItem = { ...existingItem, ...resolvedData }

        if (!validator) {
            return addFieldValidationError(`Invalid fields for model "${newItem.model}" was provided. Details: ["Validator for this model is not specified!"]`)
        }

        const { isValid, errors } = validator.validateFields(newItem.model, newItem['fields'])
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
    }

    const validateFilters = ({ resolvedData, existingItem, addFieldValidationError }) => {
        const newItem = { ...existingItem, ...resolvedData }

        if (!validator) {
            return addFieldValidationError(`Invalid filters for model "${newItem.model}" was provided. Details: ["Validator for this model is not specified!"]`)
        }

        const { isValid, errors } = validator.validateFilters(newItem.model, newItem['filters'])
        if (!isValid) {
            return addFieldValidationError(`Invalid filters for model "${newItem.model}" was provided. Details: ${JSON.stringify(errors)}`)
        }
    }


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
            syncedAmount: {
                schemaDoc: 'The number of objects successfully delivered by webhooks. ' +
                    'On successful synchronization, the syncedAt field is updated and syncedAmount becomes 0. ' +
                    'If the remote server fails, syncedAt will not be updated, and syncedAmount will increment to the number of successfully delivered objects.',
                type: Integer,
                isRequired: true,
                defaultValue: 0,
                hooks: {
                    resolveInput: ({ resolvedData, fieldPath }) => {
                        if (resolvedData['syncedAt'] && !resolvedData[fieldPath]) {
                            return 0
                        } else {
                            return resolvedData[fieldPath]
                        }
                    },
                },
            },
            failuresCount: {
                schemaDoc: 'The number of consecutive failures to send webhooks to a remote server. ' +
                    'Field value is automatically incremented when the specified url is unavailable or the server response was not ok, ' +
                    'but no more than once per hour. ' +
                    'Field value is automatically reset to 0 when the remote server is successfully reached (syncedAt or syncedAmount changed), ' +
                    'or can be manually reset by support. ' +
                    `As soon as the counter reaches the value ${UNAVAILABILITY_THRESHOLD}, which is interpreted ` +
                    `as the unavailability of the external service for at least ${UNAVAILABILITY_THRESHOLD} hours, ` +
                    'the webhook will stop being sent to this url. ' +
                    'In this case, you will need to manually reset the counter via support to resume sending.',
                type: Integer,
                isRequired: true,
                defaultValue: 0,
                hooks: {
                    resolveInput: ({ resolvedData, fieldPath }) => {
                        if ((resolvedData['syncedAt'] || resolvedData['syncedAmount']) && !resolvedData[fieldPath]) {
                            return 0
                        } else {
                            return resolvedData[fieldPath]
                        }
                    },
                },
            },
            model: {
                schemaDoc: 'The data model (schema) that the webhook is subscribed to',
                type: Select,
                dataType: 'string',
                isRequired: true,
                options: validator.models,
                hooks: {
                    validateInput: (args) => {
                        validateFields(args)
                        validateFilters(args)
                    },
                },
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
                    validateInput: validateFields,
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
                    validateInput: validateFilters,
                },
            },
            maxPackSize: {
                schemaDoc: 'The maximum number of objects that the server can send in one request. ' +
                    `The default is ${DEFAULT_MAX_PACK_SIZE}, and maxPackSize cannot be set beyond this value. ` +
                    'In most cases, you do not need to override this field, but it is recommended to lower this value ' +
                    'for requests with a large number of related fields ' +
                    'or in case of external restrictions of the server accepting webhooks.',
                type: Integer,
                isRequired: false,
                hooks: {
                    validateInput: ({ resolvedData, fieldPath, addFieldValidationError }) => {
                        if (typeof resolvedData[fieldPath] !== 'number') {
                            return
                        }
                        if (resolvedData[fieldPath] <= 0 || resolvedData[fieldPath] > DEFAULT_MAX_PACK_SIZE) {
                            return addFieldValidationError(`Invalid maxPackSize value. The correct value must be in the range [1; ${DEFAULT_MAX_PACK_SIZE}]`)
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
