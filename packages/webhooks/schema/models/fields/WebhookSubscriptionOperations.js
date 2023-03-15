const Ajv = require('ajv')

const { Json } = require('@open-condo/keystone/fields')


const render = (fields) => (
    Object.keys(fields).reduce((acc, key) => (
        acc + `${key}: ${fields[key]}\n`
    ), '')
)

const getValidator = (compiledSchema) => {
    return function validateInput ({ resolvedData, fieldPath, addFieldValidationError }) {
        if (!compiledSchema(resolvedData[fieldPath])) {
            compiledSchema.errors.forEach(error => {
                addFieldValidationError(`${fieldPath} field validation error. JSON not in the correct format - path:${error.instancePath} msg:${error.message}`)
            })
        }
    }
}


const ajv = new Ajv()

const WEBHOOK_SUBSCRIPTION_OPERATIONS_TYPE_NAME = 'WebhookSubscriptionOperations'
const WEBHOOK_SUBSCRIPTION_OPERATIONS_INPUT_NAME = 'WebhookSubscriptionOperationsInput'

const WebhookSubscriptionOperationsFields = {
    create: 'Boolean',
    update: 'Boolean',
    delete: 'Boolean',
}

const WEBHOOK_SUBSCRIPTION_OPERATIONS_TYPES = `
    type ${WEBHOOK_SUBSCRIPTION_OPERATIONS_TYPE_NAME} {
        ${render(WebhookSubscriptionOperationsFields)}
    }
    
    input ${WEBHOOK_SUBSCRIPTION_OPERATIONS_INPUT_NAME} {
        ${render(WebhookSubscriptionOperationsFields)}
    }
`

const WebhookSubscriptionOperationsSchema = {
    type: ['object', 'null'],
    properties: {
        create: { type: 'boolean' },
        update: { type: 'boolean' },
        delete: { type: 'boolean' },
    },
    required: ['create', 'update', 'delete'],
    additionalProperties: false,
}

const webhookSubscriptionOperationsValidator = getValidator(ajv.compile(WebhookSubscriptionOperationsSchema))

const WEBHOOK_SUBSCRIPTION_OPERATIONS_FIELD = {
    schemaDoc: 'The operations that the webhook is subscribed to.. ' +
        'Subscribed to all updates by default. ' +
        'But you can specify the ones you need (create, update, delete). ' +
        '(The "update" operation includes creating and deleting.) ' +
        'If nothing is specified, then subscribes to all operations.',
    type: Json,
    isRequired: false,
    kmigratorOptions: { null: true },
    graphQLInputType: WEBHOOK_SUBSCRIPTION_OPERATIONS_INPUT_NAME,
    graphQLReturnType: WEBHOOK_SUBSCRIPTION_OPERATIONS_TYPE_NAME,
    graphQLAdminFragment: '{ create update delete }',
    extendGraphQLTypes: [WEBHOOK_SUBSCRIPTION_OPERATIONS_TYPES],
    hooks: {
        validateInput: webhookSubscriptionOperationsValidator,
    },
}

module.exports = {
    WEBHOOK_SUBSCRIPTION_OPERATIONS_FIELD,
}
