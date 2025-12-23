const dayjs = require('dayjs')

const { GQLError, GQLErrorCode: { BAD_USER_INPUT } } = require('@open-condo/keystone/errors')
const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')
const {
    WEBHOOK_PAYLOAD_STATUSES,
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_TTL_DAYS,
    WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH,
} = require('@open-condo/webhooks/constants')
const access = require('@open-condo/webhooks/schema/access/WebhookPayload')
const { encryptionManager } = require('@open-condo/webhooks/utils/encryption')
const { validateEventType } = require('@open-condo/webhooks/utils/validation')

const ERRORS = {
    INVALID_EVENT_TYPE: {
        code: BAD_USER_INPUT,
        type: 'INVALID_EVENT_TYPE',
        message: 'Invalid event type format',
    },
}

const WebhookPayload = new GQLListSchema('WebhookPayload', {
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
            schemaDoc: 'Type of event that triggered this webhook. Use dot-notation format: "{resource}.{action}" or "{resource}.{sub-resource}.{action}". Examples: "payment.created", "payment.status.changed", "invoice.paid", "user.deleted". Use lowercase with dots as separators.',
            type: 'Text',
            isRequired: true,
            hooks: {
                validateInput: ({ resolvedData, fieldPath, context }) => {
                    const value = resolvedData[fieldPath]
                    if (value) {
                        const { isValid, error } = validateEventType(value)
                        if (!isValid) {
                            throw new GQLError({ ...ERRORS.INVALID_EVENT_TYPE, message: error }, context)
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

        status: {
            schemaDoc: 'Sending status: pending (waiting to send/retry), success (sent successfully), failed (permanently failed after TTL expired)',
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
                        return dayjs().add(WEBHOOK_PAYLOAD_TTL_DAYS, 'day').toISOString()
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
    plugins: [uuided(), versioned(), tracked(), softDeleted(), dvAndSender(), historical()],
    access: {
        read: access.canReadWebhookPayloads,
        create: access.canManageWebhookPayloads,
        update: access.canManageWebhookPayloads,
        delete: false,
        auth: true,
    },
})

module.exports = {
    WebhookPayload,
}
