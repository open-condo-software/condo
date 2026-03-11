const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, itemsQuery } = require('@open-condo/keystone/schema')

const { PaymentAdapter } = require('@condo/domains/acquiring/tasks/utils/PaymentAdapter')
const { SUBSCRIPTION_PAYMENT_BUFFER_DAYS, SUBSCRIPTION_CONTEXT_STATUS } = require('@condo/domains/subscription/constants')
const { registerSubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')

const logger = getLogger('processRecurrentSubscriptionPayments')

async function processRecurrentSubscriptionPayments () {
    logger.info({ msg: 'start processing recurrent subscription payments' })

    const { keystone } = getSchemaCtx('SubscriptionContext')
    const context = await keystone.createContext({ skipAccessControl: true })

    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    const bufferDate = dayjs().subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS, 'days').format('YYYY-MM-DD')

    logger.info({ msg: 'searching for subscription contexts to renew', data: { yesterday, bufferDate } })

    const contexts = await itemsQuery('SubscriptionContext', {
        where: {
            recurrentPaymentEnabled: true,
            status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
            endAt_gte: bufferDate,
            endAt_lte: yesterday,
            deletedAt: null,
        },
        sortBy: ['endAt_DESC'],
    })

    logger.info({ msg: 'found subscription contexts', data: { count: contexts.length } })

    for (const subscriptionContext of contexts) {
        try {
            const { id, organization, subscriptionPlanPricingRule, settings } = subscriptionContext
            const paymentMethodId = get(settings, 'paymentMethod.id')

            if (!paymentMethodId) {
                logger.warn({ msg: 'subscription context has no payment method', data: { subscriptionContextId: id } })
                continue
            }

            const latestContexts = await itemsQuery('SubscriptionContext', {
                where: {
                    organization: { id: organization.id },
                    subscriptionPlanPricingRule: { id: subscriptionPlanPricingRule.id },
                    status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                    deletedAt: null,
                },
                sortBy: ['endAt_DESC'],
                first: 1,
            })

            if (latestContexts.length === 0 || latestContexts[0].id !== id) {
                logger.info({ msg: 'subscription context is not the latest, skipping', data: { subscriptionContextId: id } })
                continue
            }

            logger.info({ msg: 'processing subscription context renewal', data: { subscriptionContextId: id, organizationId: organization.id } })

            const sender = { dv: 1, fingerprint: 'processRecurrentSubscriptionPayments' }

            const { subscriptionContext: newContext, directPaymentUrl, multiPayment } = await registerSubscriptionContext(context, {
                sender,
                organization: { id: organization.id },
                subscriptionPlanPricingRule: { id: subscriptionPlanPricingRule.id },
                isTrial: false,
            })

            logger.info({ msg: 'created new subscription context', data: { newContextId: newContext.id, invoiceId: newContext.invoice } })

            if (directPaymentUrl && newContext.invoice) {
                const adapter = new PaymentAdapter({
                    multiPaymentId: multiPayment.id,
                    directPaymentUrl,
                    getCardTokensUrl: null,
                })

                const { paid, errorMessage, errorCode } = await adapter.proceedPayment(paymentMethodId)

                if (paid) {
                    logger.info({ msg: 'payment succeeded', data: { subscriptionContextId: newContext.id, invoiceId: newContext.invoice } })
                } else {
                    logger.error({ msg: 'payment failed', data: { subscriptionContextId: newContext.id, invoiceId: newContext.invoice, errorMessage, errorCode } })
                }
            } else {
                logger.warn({ msg: 'no directPaymentUrl or invoice for payment', data: { subscriptionContextId: newContext.id } })
            }
        } catch (error) {
            const message = get(error, 'errors[0].message') || get(error, 'message') || JSON.stringify(error)
            logger.error({ msg: 'failed to process subscription context', err: error, data: { subscriptionContextId: subscriptionContext.id, message } })
        }
    }

    logger.info({ msg: 'processing recurrent subscription payments end' })
}

module.exports = {
    processRecurrentSubscriptionPayments,
}
