const { get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    RECURRENT_PAYMENT_PROCESS_ERROR_UNKNOWN_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
    RECURRENT_PAYMENT_PROCESS_ERROR_NO_RECEIPTS_TO_PROCEED_CODE,
} = require('@condo/domains/acquiring/constants/recurrentPayment')
const {
    paginationConfiguration,
} = require('@condo/domains/acquiring/constants/recurrentPaymentTask')
const {
    PaymentAdapter,
} = require('@condo/domains/acquiring/tasks/utils/PaymentAdapter')
const {
    RecurrentPaymentContext,
} = require('@condo/domains/acquiring/utils/serverSchema')
const {
    getReadyForProcessingPaymentsPage,
    filterNotPayablePayment,
    registerMultiPayment,
    setRecurrentPaymentAsFailed,
    setRecurrentPaymentAsSuccess,
} = require('@condo/domains/acquiring/utils/taskSchema')
const { processArrayOf } = require('@condo/domains/common/utils/parallel')

const logger = getLogger()

async function chargeByRecurrentPaymentAndPaymentAdapter (context, recurrentPayment, paymentAdapter) {
    // prepare vars
    const { recurrentPaymentContext: { id: recurrentContextId } } = recurrentPayment
    const { settings: { cardId } } = await RecurrentPaymentContext.getOne(context, {
        id: recurrentContextId,
    }, 'settings { cardId }')

    // check card token validity
    const cardTokenValidity = await paymentAdapter.checkCardToken(cardId)
    if (!cardTokenValidity) {
        return setRecurrentPaymentAsFailed(
            context,
            recurrentPayment,
            `Provided card token id is not valid ${cardId}`,
            RECURRENT_PAYMENT_PROCESS_ERROR_CARD_TOKEN_NOT_VALID_CODE,
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

async function chargeRecurrentPayments () {
    logger.info({ msg: 'start processing recurrent payment tasks' })

    // prepare context
    const { keystone } = getSchemaCtx('RecurrentPaymentContext')
    const context = await keystone.createContext({ skipAccessControl: true })

    // prepare vars
    const { pageSize } = paginationConfiguration
    let offset = 0
    let hasMorePages = true

    // retrieve RecurrentPaymentContext page by page
    while (hasMorePages) {
        logger.info({ msg: 'processing recurrent payments page', data: { page: Math.floor(offset / pageSize) } })
        // get page (can be empty)
        const page = await getReadyForProcessingPaymentsPage(context, pageSize, offset)
        const itemsWithPayableStatus = await filterNotPayablePayment(page)

        // process each page in parallel
        await processArrayOf(itemsWithPayableStatus).inParallelWith(async (recurrentPayment) => {
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
                    await chargeByRecurrentPaymentAndPaymentAdapter(context, recurrentPayment, adapter)
                } else if (errorCode) {
                    // error at registration
                    // - disabled recurrent payment context
                    // - exceed limit
                    await setRecurrentPaymentAsFailed(context, recurrentPayment, errorMessage, errorCode)
                } else {
                    // nothing to pay case
                    await setRecurrentPaymentAsFailed(
                        context,
                        recurrentPayment,
                        'No receipts to proceed',
                        RECURRENT_PAYMENT_PROCESS_ERROR_NO_RECEIPTS_TO_PROCEED_CODE,
                    )
                }
            } catch (err) {
                const message = get(err, 'errors[0].message') || get(err, 'message') || JSON.stringify(err)
                logger.error({ msg: 'process recurrent payment error', err })
                await setRecurrentPaymentAsFailed(
                    context,
                    recurrentPayment,
                    message,
                    RECURRENT_PAYMENT_PROCESS_ERROR_UNKNOWN_CODE,
                )
            }
        })

        hasMorePages = page.length > 0
        offset += pageSize
    }
    logger.info({ msg: 'processing recurrent payment end' })
}

module.exports = {
    chargeByRecurrentPaymentAndPaymentAdapter,
    chargeRecurrentPayments,
}