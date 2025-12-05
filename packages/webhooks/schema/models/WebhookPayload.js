const dayjs = require('dayjs')

const { historical, versioned, uuided, tracked, softDeleted, dvAndSender } = require('@open-condo/keystone/plugins')
const { GQLListSchema } = require('@open-condo/keystone/schema')
const {
    WEBHOOK_PAYLOAD_STATUSES,
    WEBHOOK_PAYLOAD_STATUS_PENDING,
    WEBHOOK_PAYLOAD_TTL_DAYS,
    WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH,
} = require('@open-condo/webhooks/constants')
const access = require('@open-condo/webhooks/schema/access/WebhookPayload')


const WebhookPayload = new GQLListSchema('WebhookPayload', {
    schemaDoc: 'Stores webhook payloads for delivery. Contains ready-to-send payload, URL, and secret. Tracks delivery status, retries, and responses from external servers.',
    fields: {

        payload: {
            schemaDoc: 'Ready-to-send JSON payload for the webhook',
            type: 'Json',
            isRequired: true,
        },

        url: {
            schemaDoc: 'Target URL for webhook delivery',
            type: 'Url',
            isRequired: true,
        },

        secret: {
            schemaDoc: 'Secret key for HMAC-SHA256 signature generation',
            type: 'Text',
            isRequired: true,
        },

        eventType: {
            schemaDoc: 'Type of event that triggered this webhook (e.g., "payment.status.changed")',
            type: 'Text',
            isRequired: true,
        },

        modelName: {
            schemaDoc: 'Name of the model that triggered this webhook (e.g., "Payment")',
            type: 'Text',
            isRequired: false,
        },

        itemId: {
            schemaDoc: 'ID of the record that triggered this webhook',
            type: 'Text',
            isRequired: false,
        },

        status: {
            schemaDoc: 'Delivery status: pending (waiting for delivery/retry), success (delivered successfully), failed (permanently failed after TTL expired)',
            type: 'Select',
            dataType: 'string',
            options: WEBHOOK_PAYLOAD_STATUSES,
            defaultValue: WEBHOOK_PAYLOAD_STATUS_PENDING,
            isRequired: true,
        },

        attempt: {
            schemaDoc: 'Number of delivery attempts made (starts at 0)',
            type: 'Integer',
            defaultValue: 0,
            isRequired: true,
        },

        lastHttpStatusCode: {
            schemaDoc: 'HTTP status code from the last delivery attempt',
            type: 'Integer',
            isRequired: false,
        },

        lastResponseBody: {
            schemaDoc: `Response body from the last delivery attempt (truncated to ${WEBHOOK_PAYLOAD_MAX_RESPONSE_LENGTH} chars)`,
            type: 'Text',
            isRequired: false,
        },

        lastErrorMessage: {
            schemaDoc: 'Error message from the last delivery attempt',
            type: 'Text',
            isRequired: false,
        },

        expiresAt: {
            schemaDoc: 'Timestamp after which no more delivery attempts will be made',
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
            schemaDoc: 'Timestamp for the next delivery attempt',
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
            schemaDoc: 'Timestamp of the last delivery attempt',
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
