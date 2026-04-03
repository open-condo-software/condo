const dayjs = require('dayjs')
const get = require('lodash/get')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx, itemsQuery } = require('@open-condo/keystone/schema')

const { SUBSCRIPTION_PAYMENT_BUFFER_DAYS, SUBSCRIPTION_CONTEXT_STATUS } = require('@condo/domains/subscription/constants')
const { SUBSCRIPTION_PLAN_TYPE_SERVICE, SUBSCRIPTION_PLAN_TYPE_FEATURE } = require('@condo/domains/subscription/constants/plans')
const { SubscriptionPaymentAdapter } = require('@condo/domains/subscription/tasks/utils/SubscriptionPaymentAdapter')
const { registerSubscriptionContext, SubscriptionContext } = require('@condo/domains/subscription/utils/serverSchema')

const logger = getLogger('processRecurrentSubscriptionPayments')

async function processRecurrentSubscriptionPayments () {
    const { keystone } = getSchemaCtx('SubscriptionContext')
    const context = await keystone.createContext({ skipAccessControl: true })

    const today = dayjs().format('YYYY-MM-DD')
    const bufferDate = dayjs().subtract(SUBSCRIPTION_PAYMENT_BUFFER_DAYS, 'days').format('YYYY-MM-DD')

    logger.info({ msg: 'searching for subscription contexts to renew', data: { today, bufferDate } })

    const contexts = await itemsQuery('SubscriptionContext', {
        where: {
            bindingId_not: null,
            status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
            endAt_gte: bufferDate,
            endAt_lte: today,
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
                endAt,
            } = subscriptionContext

            const [latestContext] = await itemsQuery('SubscriptionContext', {
                where: {
                    organization: { id: organization },
                    subscriptionPlan: { id: subscriptionPlan },
                    status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                    deletedAt: null,
                },
                sortBy: ['endAt_DESC'],
                first: 1,
            })

            if (!latestContext) {
                logger.info({ msg: 'subscription context is not the latest, skipping', data: { subscriptionContextId: id } })
                continue
            }

            const [plan] = await itemsQuery('SubscriptionPlan', {
                where: {
                    id: subscriptionPlan,
                    deletedAt: null,
                },
                first: 1,
            })

            if (!plan) {
                logger.warn({ msg: 'subscription plan not found, skipping', data: { subscriptionContextId: id, subscriptionPlanId: subscriptionPlan } })
                continue
            }

            if (plan.planType === SUBSCRIPTION_PLAN_TYPE_FEATURE) {
                const hasActiveServiceSubscription = await itemsQuery('SubscriptionContext', {
                    where: {
                        organization: { id: organization },
                        subscriptionPlan: { planType: SUBSCRIPTION_PLAN_TYPE_SERVICE },
                        status: SUBSCRIPTION_CONTEXT_STATUS.DONE,
                        startAt_lte: today,
                        endAt_gt: today,
                        deletedAt: null,
                    },
                    first: 1,
                })

                if (hasActiveServiceSubscription.length === 0) {
                    logger.info({ 
                        msg: 'no active service subscription found, canceling feature subscription renewal', 
                        data: { subscriptionContextId: id, organizationId: organization, featurePlanId: subscriptionPlan },
                    })
                    await SubscriptionContext.update(context, id, {
                        dv: 1,
                        sender: { dv: 1, fingerprint: 'processRecurrentSubscriptionPayments' },
                        status: SUBSCRIPTION_CONTEXT_STATUS.ERROR,
                    })
                    continue
                }
            }

            logger.info({ msg: 'processing subscription context renewal', data: { subscriptionContextId: id, organizationId: organization } })

            const sender = { dv: 1, fingerprint: 'processRecurrentSubscriptionPayments' }

            const result = await registerSubscriptionContext(context, {
                sender,
                organization: { id: organization },
                subscriptionPlanPricingRule: { id: subscriptionPlanPricingRule },
                isTrial: false,
            })
            const newContext = result.subscriptionContext
            const directPaymentUrl = result.directPaymentUrl

            logger.info({ msg: 'registered subscription context', data: { newContextId: newContext.id, invoiceId: newContext.invoice, status: newContext.status } })

            if (!directPaymentUrl || !newContext.invoice) {
                logger.warn({ msg: 'no directPaymentUrl or invoice for payment', data: { subscriptionContextId: newContext.id } })
                await SubscriptionContext.update(context, newContext.id, {
                    status: SUBSCRIPTION_CONTEXT_STATUS.ERROR,
                    sender,
                })
                continue
            }

            const isLastBufferDay = !dayjs(endAt).isAfter(dayjs(bufferDate))
            const errorStatus = isLastBufferDay 
                ? SUBSCRIPTION_CONTEXT_STATUS.ERROR 
                : SUBSCRIPTION_CONTEXT_STATUS.PENDING

            try {
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
                            isLastBufferDay,
                            willSetStatus: errorStatus,
                        },
                    })
                    
                    await SubscriptionContext.update(context, newContext.id, {
                        dv: 1,
                        sender,
                        status: errorStatus,
                    })
                }
            } catch (paymentError) {
                logger.error({ 
                    msg: 'payment processing error', 
                    err: paymentError, 
                    data: { 
                        subscriptionContextId: newContext.id,
                        isLastBufferDay,
                        willSetStatus: errorStatus,
                    },
                })
                
                await SubscriptionContext.update(context, newContext.id, {
                    dv: 1,
                    sender,
                    status: errorStatus,
                })
            }
        } catch (error) {
            logger.error({ msg: 'failed to process subscription context', err: error, data: { subscriptionContextId: subscriptionContext.id } })
        }
    }

    logger.info({ msg: 'processing recurrent subscription payments end' })
}

module.exports = {
    processRecurrentSubscriptionPayments,
}
