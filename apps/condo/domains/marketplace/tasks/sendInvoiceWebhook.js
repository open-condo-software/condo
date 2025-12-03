const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, getById } = require('@open-condo/keystone/schema')
const { createTask } = require('@open-condo/keystone/tasks')

const {
    INVOICE_WEBHOOK_DELIVERY_STATUS_PENDING,
    INVOICE_WEBHOOK_DELIVERY_STATUS_SUCCESS,
    INVOICE_WEBHOOK_DELIVERY_STATUS_FAILED,
} = require('@condo/domains/marketplace/constants')
const { InvoiceWebhookDelivery } = require('@condo/domains/marketplace/utils/serverSchema')
const {
    tryDeliverWebhook,
    calculateNextRetryAt,
} = require('@condo/domains/marketplace/utils/serverSchema/webhookDelivery')


const logger = getLogger()

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'sendInvoiceWebhook' } }

/**
 * Sends a webhook for an invoice status change
 * Handles delivery, retries with exponential backoff, and expiration
 * @param {string} deliveryId - ID of the InvoiceWebhookDelivery record
 */
async function sendInvoiceWebhook (deliveryId) {
    const { keystone: context } = getSchemaCtx('InvoiceWebhookDelivery')

    const delivery = await getById('InvoiceWebhookDelivery', deliveryId)
    if (!delivery) {
        logger.error({ msg: 'Delivery record not found', data: { deliveryId } })
        return
    }

    // Skip if already completed
    if (delivery.status !== INVOICE_WEBHOOK_DELIVERY_STATUS_PENDING) {
        logger.info({ msg: 'Delivery already processed', data: { deliveryId, status: delivery.status } })
        return
    }

    const now = dayjs()

    // Check if expired
    if (now.isAfter(delivery.expiresAt)) {
        logger.warn({ msg: 'Delivery expired', data: { now, deliveryId, expiresAt: delivery.expiresAt } })
        await InvoiceWebhookDelivery.update(context, deliveryId, {
            status: INVOICE_WEBHOOK_DELIVERY_STATUS_FAILED,
            errorMessage: 'Delivery expired after TTL',
            ...DV_SENDER,
        })
        return
    }

    // Attempt delivery
    const result = await tryDeliverWebhook(delivery)
    const newAttempt = delivery.attempt + 1

    if (result.success) {
        // Success - mark as delivered
        await InvoiceWebhookDelivery.update(context, deliveryId, {
            status: INVOICE_WEBHOOK_DELIVERY_STATUS_SUCCESS,
            httpStatusCode: result.statusCode,
            responseBody: result.body,
            sentAt: now.toISOString(),
            attempt: newAttempt,
            errorMessage: null,
            ...DV_SENDER,
        })
        logger.info({ msg: 'Webhook delivered successfully', data: { deliveryId, attempt: newAttempt } })
    } else {
        // Failure - calculate next retry
        const nextRetryAt = calculateNextRetryAt(newAttempt)
        const nextRetryTime = dayjs(nextRetryAt)

        // Check if next retry would be after expiration
        if (nextRetryTime.isAfter(delivery.expiresAt)) {
            // Mark as permanently failed
            await InvoiceWebhookDelivery.update(context, deliveryId, {
                status: INVOICE_WEBHOOK_DELIVERY_STATUS_FAILED,
                httpStatusCode: result.statusCode || null,
                responseBody: result.body || null,
                errorMessage: result.error,
                sentAt: now.toISOString(),
                attempt: newAttempt,
                ...DV_SENDER,
            })
            logger.warn({
                msg: 'Webhook delivery permanently failed (next retry after expiration)',
                data: { deliveryId, attempt: newAttempt, error: result.error },
            })
        } else {
            // Schedule retry
            await InvoiceWebhookDelivery.update(context, deliveryId, {
                status: INVOICE_WEBHOOK_DELIVERY_STATUS_PENDING,
                httpStatusCode: result.statusCode || null,
                responseBody: result.body || null,
                errorMessage: result.error,
                sentAt: now.toISOString(),
                nextRetryAt,
                attempt: newAttempt,
                ...DV_SENDER,
            })
            logger.info({
                msg: 'Webhook delivery failed, scheduled retry',
                data: { deliveryId, attempt: newAttempt, nextRetryAt, error: result.error },
            })
        }
    }
}

module.exports = {
    sendInvoiceWebhook: createTask('sendInvoiceWebhook', sendInvoiceWebhook),
}
