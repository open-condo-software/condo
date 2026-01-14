const dayjs = require('dayjs')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')
const {
    WEBHOOK_PAYLOAD_STATUSES,
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_TTL_IN_SEC,
    WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH,
} = require('@open-condo/webhooks/constants')
const { getModelValidator } = require('@open-condo/webhooks/model-validator')
const access = require('@open-condo/webhooks/schema/access/WebhookPayload')
const { encryptionManager } = require('@open-condo/webhooks/utils/encryption')


const ERRORS = {
    INVALID_JSON_PAYLOAD: {
        code: BAD_USER_INPUT,
        type: 'INVALID_JSON_PAYLOAD',
        message: 'Payload must be valid JSON',
    },
    INVALID_EVENT_TYPE: {
        code: BAD_USER_INPUT,
        type: 'INVALID_EVENT_TYPE',
        message: 'Invalid event type',
    },
}

/**
 * Creates a WebhookPayload model with validation for event types
 * @param {Array<string>} [appWebhooksEventsTypes] - Array of event types supported by the application
 * @returns {GQLListSchema} WebhookPayload model
 */
function getWebhookPayloadModel (appWebhooksEventsTypes = []) {
    // Build documentation for eventType field
    const customEventsDoc = appWebhooksEventsTypes.length > 0
        ? `Custom events: ${appWebhooksEventsTypes.join(', ')}.`
        : ''
    const autoEventsDoc = 'Auto-generated events from models with webHooked() plugin: ModelName.created, ModelName.updated, ModelName.deleted (e.g., Payment.created, Ticket.updated).'

    return new GQLListSchema('WebhookPayload', {
        schemaDoc: 'Stores webhook payloads for sending. Contains ready-to-send payload, URL, and secret. Tracks sending status, retries, and responses from external servers.',
        fields: {

            url: {
                schemaDoc: 'Where to send the webhook',
                type: 'Url',
                isRequired: true,
            },

            payload: {
                schemaDoc: 'JSON data to send. Stored encrypted in database.',
                type: 'EncryptedText',
                encryptionManager,
                isRequired: true,
                access: {
                    create: true,
                    read: true,
                    update: false,
                },
                hooks: {
                    validateInput: ({ resolvedData, fieldPath, context }) => {
                        const value = resolvedData[fieldPath]

                        if (!value) {
                            throw new GQLError(ERRORS.INVALID_JSON_PAYLOAD, context)
                        }

                        try {
                            JSON.parse(value)
                        } catch (e) {
                            throw new GQLError(ERRORS.INVALID_JSON_PAYLOAD, context)
                        }
                    },
                },
            },

            secret: {
                schemaDoc: 'Secret key for signing requests (HMAC). Stored encrypted in database.',
                type: 'EncryptedText',
                encryptionManager,
                isRequired: true,
                access: {
                    create: true,
                    read: true,
                    update: false,
                },
            },

            eventType: {
                schemaDoc: `Type of event that triggered this webhook. ${customEventsDoc} ${autoEventsDoc}`,
                type: 'Text',
                isRequired: true,
                hooks: {
                    validateInput: ({ resolvedData, fieldPath, context }) => {
                        const value = resolvedData[fieldPath]
                        if (value) {
                            // At this point, all models are loaded and registered
                            const validator = getModelValidator()
                            
                            // Check if it's a custom event type
                            if (appWebhooksEventsTypes.includes(value)) {
                                return // Valid custom event
                            }
                            
                            // Generate valid event types on the fly for validation
                            const validModelEvents = validator && validator.models.length > 0
                                ? validator.models.flatMap(model => [
                                    `${model}.created`,
                                    `${model}.updated`,
                                    `${model}.deleted`,
                                ])
                                : []
                            
                            // Check if the event type is valid
                            if (!validModelEvents.includes(value)) {
                                const availableModels = validator && validator.models.length > 0
                                    ? validator.models.join(', ')
                                    : 'none'
                                const customEvents = appWebhooksEventsTypes.length > 0
                                    ? appWebhooksEventsTypes.join(', ')
                                    : 'none'
                                throw new GQLError({
                                    ...ERRORS.INVALID_EVENT_TYPE,
                                    message: `Invalid event type "${value}". Must be either a custom event (${customEvents}) or a model event from models with webHooked() plugin (${availableModels}).`,
                                }, context)
                            }
                        }
                    },
                },
            },

            modelName: {
                schemaDoc: 'Name of the model that triggered this webhook (e.g., "Payment")',
                type: 'Text',
                isRequired: false,
            },

            itemId: {
                schemaDoc: 'ID of the record that triggered this webhook',
                type: 'Uuid',
                isRequired: false,
            },

            webhookSubscription: {
                schemaDoc: 'Optional reference to WebhookSubscription that triggered this webhook (for debugging)',
                type: 'Relationship',
                ref: 'WebhookSubscription',
                isRequired: false,
                knexOptions: { isNotNullable: false },
                kmigratorOptions: { null: true, on_delete: 'models.SET_NULL' },
            },

            status: {
                schemaDoc: `Sending status. Possible values: ${WEBHOOK_PAYLOAD_STATUSES.join(', ')}`,
                type: 'Select',
                dataType: 'string',
                options: WEBHOOK_PAYLOAD_STATUSES,
                defaultValue: WEBHOOK_PAYLOAD_STATUS_PENDING,
                isRequired: true,
            },

            attempt: {
                schemaDoc: 'Number of send attempts made (starts at 0)',
                type: 'Integer',
                defaultValue: 0,
                isRequired: true,
            },

            lastHttpStatusCode: {
                schemaDoc: 'HTTP status code from the last send attempt',
                type: 'Integer',
                isRequired: false,
            },

            lastResponseBody: {
                schemaDoc: `Response body from the last send attempt (truncated to ${WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH} chars)`,
                type: 'Text',
                isRequired: false,
            },

            lastErrorMessage: {
                schemaDoc: 'Error message from the last send attempt',
                type: 'Text',
                isRequired: false,
            },

            expiresAt: {
                schemaDoc: 'Timestamp after which no more send attempts will be made',
                type: 'DateTimeUtc',
                isRequired: true,
                hooks: {
                    resolveInput: ({ resolvedData, operation, fieldPath }) => {
                        if (operation === 'create' && !resolvedData[fieldPath]) {
                            return dayjs().add(WEBHOOK_PAYLOAD_TTL_IN_SEC, 'second').toISOString()
                        }
                        return resolvedData[fieldPath]
                    },
                },
            },

            nextRetryAt: {
                schemaDoc: 'Timestamp for the next send attempt',
                type: 'DateTimeUtc',
                isRequired: true,
                hooks: {
                    resolveInput: ({ resolvedData, operation, fieldPath }) => {
                        if (operation === 'create' && !resolvedData[fieldPath]) {
                            return dayjs().toISOString()
                        }
                        return resolvedData[fieldPath]
                    },
                },
            },

            lastSentAt: {
                schemaDoc: 'Timestamp of the last send attempt',
                type: 'DateTimeUtc',
                isRequired: false,
            },

        },
        kmigratorOptions: {
            indexes: [
                {
                    type: 'BTreeIndex',
                    fields: ['status', 'nextRetryAt'],
                    name: 'webhookPayload_status_nxtRetryAt',
                },
            ],
        },
        plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender()],
        access: {
            read: access.canReadWebhookPayloads,
            create: access.canManageWebhookPayloads,
            update: access.canManageWebhookPayloads,
            delete: false,
            auth: true,
        },
    })
}

module.exports = {
    getWebhookPayloadModel,
}
