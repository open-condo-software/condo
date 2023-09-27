const { isNil } = require('lodash')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    RECURRENT_PAYMENT_INIT_STATUS,
    RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const { RecurrentPaymentContext, RecurrentPayment } = require('@condo/domains/acquiring/utils/serverSchema')

/**
 * Remove orphaned recurrent RecurrentPaymentContext records
 * RecurrentPaymentContext is considered as orphaned in case when related service consumer/resident/user was removed
 */
const removeOrphansRecurrentPaymentContexts = async ({ userId, residentId, serviceConsumerId, dv, sender }) => {
    if (isNil(userId) &&  isNil(residentId) && isNil(serviceConsumerId)) throw new Error('Cannot removeOrphansRecurrentPaymentContexts for empty parent ids')
    if (isNil(dv) ||  isNil(sender)) throw new Error('Cannot removeOrphansRecurrentPaymentContexts with empty dv and sender params')

    const { keystone: context } = await getSchemaCtx('RecurrentPaymentContext')

    let parentCondition = null
    if (!isNil(serviceConsumerId)) {
        parentCondition = { serviceConsumer: { id: serviceConsumerId } }
    } else if (!isNil(residentId)) {
        parentCondition = { serviceConsumer: { resident: { id: residentId } } }
    } else {
        parentCondition = { serviceConsumer: { resident: { user: { id: userId } } } }
    }

    // get all RecurrentPaymentContexts
    const recurrentContexts = await RecurrentPaymentContext.getAll(context, {
        ...parentCondition,
        deletedAt: null,
    })

    // remove item by item
    for (const recurrentContext of recurrentContexts) {
        await RecurrentPaymentContext.softDelete(context, recurrentContext.id, { dv, sender })
    }
}

/**
 * Remove outdated RecurrentPayment (for change RecurrentPayment context configuration)
 * RecurrentPayment is considered outdated in case when its context was updated
 */
const removeOutdatedRecurrentPayments = async ({ recurrentPaymentContextId, dv, sender }) => {
    if (isNil(recurrentPaymentContextId)) throw new Error('Cannot removeOutdatedRecurrentPayments for empty context id')
    if (isNil(dv) ||  isNil(sender)) throw new Error('Cannot removeOutdatedRecurrentPayments with empty dv and sender params')

    const { keystone: context } = await getSchemaCtx('RecurrentPayment')

    const recurrentPayments = await RecurrentPayment.getAll(context, {
        recurrentPaymentContext: { id: recurrentPaymentContextId },
        status_in: [RECURRENT_PAYMENT_INIT_STATUS, RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS],
        deletedAt: null,
    })

    // remove item by item
    for (const recurrentPayment of recurrentPayments) {
        await RecurrentPayment.softDelete(context, recurrentPayment.id, { dv, sender })
    }
}

module.exports = {
    removeOrphansRecurrentPaymentContexts,
    removeOutdatedRecurrentPayments,
}