const { isNil } = require('lodash')

const { getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    RECURRENT_PAYMENT_INIT_STATUS,
    RECURRENT_PAYMENT_ERROR_NEED_RETRY_STATUS,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const { RecurrentPaymentContext, RecurrentPayment } = require('@condo/domains/acquiring/utils/serverSchema')

/**
 * Remove orphans recurrent payment contexts
 * @param context (context)
 * @param userId (id, optional)
 * @param residentId (id, optional)
 * @param serviceConsumerId (id, optional)
 * @param dv
 * @param sender
 * @returns {Promise<void>}
 */
const removeOrphansRecurrentPaymentContexts = async ({ userId, residentId, serviceConsumerId, dv, sender }) => {
    if (isNil(userId) &&  isNil(residentId) && isNil(serviceConsumerId)) throw new Error('Can not removeOrphansRecurrentPaymentContexts for empty parent ids')
    if (isNil(dv) ||  isNil(sender)) throw new Error('Can not removeOrphansRecurrentPaymentContexts with empty dv and sender params')

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
 * Remove out dated recurrent payments (for change recurrent payment context configuration)
 * @param context (context)
 * @param recurrentPaymentContextId (id)
 * @param dv
 * @param sender
 * @returns {Promise<void>}
 */
const removeOutdatedRecurrentPayments = async ({ recurrentPaymentContextId, dv, sender }) => {
    if (isNil(recurrentPaymentContextId)) throw new Error('Can not removeOutdatedRecurrentPayments for empty context id')
    if (isNil(dv) ||  isNil(sender)) throw new Error('Can not removeOutdatedRecurrentPayments with empty dv and sender params')

    const { keystone: context } = await getSchemaCtx('RecurrentPayment')

    // get all RecurrentPayments
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