const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, itemsQuery } = require('@open-condo/keystone/schema')

const { SUBSCRIPTION_PAYMENT_BUFFER_DAYS, SUBSCRIPTION_CONTEXT_STATUS } = require('@condo/domains/subscription/constants')
const { SubscriptionPaymentAdapter } = require('@condo/domains/subscription/tasks/utils/SubscriptionPaymentAdapter')
const { registerSubscriptionContext, SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')

const logger = getLogger('processRecurrentSubscriptionPayments')

async function processRecurrentSubscriptionPayments () {
    const { keystone } = getSchemaCtx('SubscriptionContext')
    const context = await keystone.createContext({ skipAccessControl: true })

    const yesterday = dayjs().subtract(1, 'day').format('YYYY-MM-DD')
    const bufferDate = dayjs().subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS, 'days').format('YYYY-MM-DD')

    logger.info({ msg: 'searching for subscription contexts to renew', data: { yesterday, bufferDate } })

    const contexts = await itemsQuery('SubscriptionContext', {
        where: {
            bindingId_not: null,
            status_in: [SUBSCRIPTION_CONTEXT_STATUS.DONE, SUBSCRIPTION_CONTEXT_STATUS.ERROR],
            endAt_gte: bufferDate,
            endAt_lte: yesterday,
            deletedAt: null,
        },
        sortBy: ['endAt_DESC'],
    })

    logger.info({ msg: 'found subscription contexts', count: contexts.length })

    for (const subscriptionContext of contexts) {
        try {
            const {
                id,
                organization,
                subscriptionPlan,
                subscriptionPlanPricingRule,
                bindingId,
            } = subscriptionContext

            if (!bindingId) {
                logger.info({ msg: 'subscription context does not have binding for auto-payment', data: { subscriptionContextId: id } })
                continue
            }
            const latestContexts = await itemsQuery('SubscriptionContext', {
                where: {
                    organization: { id: organization },
                    subscriptionPlan: { id: subscriptionPlan },
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

            logger.info({ msg: 'processing subscription context renewal', data: { subscriptionContextId: id, organizationId: organization } })

            const sender = { dv: 1, fingerprint: 'processRecurrentSubscriptionPayments' }

            const { subscriptionContext: newContext, directPaymentUrl } = await registerSubscriptionContext(context, {
                sender,
                organization: { id: organization },
                subscriptionPlanPricingRule: { id: subscriptionPlanPricingRule },
                isTrial: false,
            })

            logger.info({ msg: 'created new subscription context', data: { newContextId: newContext.id, invoiceId: newContext.invoice } })

            if (directPaymentUrl && newContext.invoice) {
                const paymentResult = await SubscriptionPaymentAdapter.proceedPayment({
                    directPaymentUrl,
                    cardTokenId: bindingId,
                })

                const { status: paymentStatus, paid, errorMessage, cancellationDetails } = paymentResult

                if (paid) {
                    logger.info({ msg: 'payment succeeded', data: { subscriptionContextId: newContext.id, invoiceId: newContext.invoice } })
                } else {
                    logger.error({ 
                        msg: 'payment failed', 
                        data: { 
                            subscriptionContextId: newContext.id, 
                            invoiceId: newContext.invoice, 
                            paymentStatus, 
                            errorMessage,
                            cancellationDetails,
                        },
                    })
                    
                    await SubscriptionContext.update(context, newContext.id, {
                        dv: 1,
                        sender,
                        status: SUBSCRIPTION_CONTEXT_STATUS.ERROR,
                    })
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
