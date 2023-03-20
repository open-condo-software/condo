const { get } = require('lodash')
const { v4: uuid } = require('uuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const {
    PAYMENT_ERROR_UNKNOWN_CODE,
    PAYMENT_ERROR_CARD_TOKEN_NOT_VALID_CODE,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const {
    paginationConfiguration,
} = require('@condo/domains/acquiring/tasks/utils/constants')
const {
    PaymentAdapter,
} = require('@condo/domains/acquiring/tasks/utils/PaymentAdapter')
const {
    getReadyForProcessingPaymentsPage,
    registerMultiPayment,
    setRecurrentPaymentAsFailed,
    setRecurrentPaymentAsSuccess,
} = require('@condo/domains/acquiring/tasks/utils/queries')
const {
    RecurrentPaymentContext,
} = require('@condo/domains/acquiring/utils/serverSchema')
const { processArrayOf } = require('@condo/domains/common/utils/parallel')

const logger = getLogger('recurrent-payment-context-processing')

async function processRecurrentPayment (context, recurrentPayment, paymentAdapter) {
    // prepare vars
    const { recurrentPaymentContext: { id: recurrentContextId } } = recurrentPayment
    const { settings: { cardId } } = await RecurrentPaymentContext.getOne(context, {
        id: recurrentContextId,
    })

    // check card token validity
    const cardTokenValidity = await paymentAdapter.checkCardToken(cardId)
    if (!cardTokenValidity) {
        return setRecurrentPaymentAsFailed(
            context,
            recurrentPayment,
            `Provided card token id is not valid ${cardId}`,
            PAYMENT_ERROR_CARD_TOKEN_NOT_VALID_CODE,
        )
    }

    // proceed payment
    const { paid, errorMessage, errorCode } = await paymentAdapter.proceedPayment(cardId)

    // update status
    if (paid) {
        return await setRecurrentPaymentAsSuccess(context, recurrentPayment)
    } else {
        return await setRecurrentPaymentAsFailed(context, recurrentPayment, errorMessage, errorCode)
    }
}

async function process () {
    const taskId = this.id || uuid()
    logger.info({ msg: 'Start processing recurrent payment tasks', taskId })

    // prepare context
    const { keystone } = await getSchemaCtx('RecurrentPaymentContext')
    const context = await keystone.createContext({ skipAccessControl: true })

    // prepare vars
    const { pageSize } = paginationConfiguration
    let offset = 0
    let hasMorePages = true

    // retrieve RecurrentPaymentContext page by page
    while (hasMorePages) {
        logger.info({ msg: `Processing recurrent payment page #${Math.floor(offset / pageSize)}`, taskId })
        // get page (can be empty)
        const page = await getReadyForProcessingPaymentsPage(context, pageSize, offset)

        // process each page in parallel
        await processArrayOf(page).inParallelWith(async (recurrentPayment) => {
            try {
                // first step create multi payment
                const {
                    registered,
                    errorCode,
                    errorMessage,
                    multiPaymentId,
                    directPaymentUrl,
                    getCardTokensUrl,
                } = await registerMultiPayment(context, recurrentPayment)

                // there can be a case when all receipts already paid
                if (registered) {
                    // then create payment adapter to work with acquiring integration
                    const adapter = new PaymentAdapter({
                        multiPaymentId,
                        directPaymentUrl,
                        getCardTokensUrl,
                    })

                    // then proceed payment logic
                    await processRecurrentPayment(context, recurrentPayment, adapter)
                } else if (errorCode) {
                    // error at registration
                    // - disabled recurrent payment context
                    // - exceed limit
                    await setRecurrentPaymentAsFailed(context, recurrentPayment, errorMessage, errorCode)
                } else {
                    // nothing to pay case
                    await setRecurrentPaymentAsSuccess(context, recurrentPayment)
                }
            } catch (err) {
                const message = get(err, 'errors[0].message') || get(err, 'message') || JSON.stringify(err)
                logger.error({ msg: 'Process recurrent payment error', err, taskId })
                await setRecurrentPaymentAsFailed(
                    context,
                    recurrentPayment,
                    message,
                    PAYMENT_ERROR_UNKNOWN_CODE,
                )
            }
        })

        hasMorePages = page.length > 0
        offset += pageSize
    }
    logger.info({ msg: 'End processing recurrent payment', taskId })
}

module.exports = {
    process,
    processRecurrentPayment,
    recurrentPaymentsProcessingCron: createCronTask('recurrentPaymentsProcessing', '0 * * * *', process),
}