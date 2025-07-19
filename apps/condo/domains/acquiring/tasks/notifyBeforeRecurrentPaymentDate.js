const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    paginationConfiguration,
} = require('@condo/domains/acquiring/constants/recurrentPaymentTask')
const {
    getAllReadyToPayRecurrentPaymentContexts,
    sendTomorrowPaymentNotificationSafely,
    sendTomorrowPaymentNoReceiptsNotificationSafely,
    sendTomorrowPaymentLimitExceedNotificationSafely,
    getReceiptsForServiceConsumer,
    filterPaidBillingReceipts,
    isLimitExceedForBillingReceipts,
} = require('@condo/domains/acquiring/utils/taskSchema')
const { processArrayOf } = require('@condo/domains/common/utils/parallel')

const logger = getLogger()

async function notifyRecurrentPaymentContext (context, date, recurrentPaymentContext) {
    // prepare vars
    const { serviceConsumer, billingCategory } = recurrentPaymentContext
    const startOfTheMonth = date.startOf('month')

    // get billing receipts
    const billingReceipts = await getReceiptsForServiceConsumer(
        context,
        startOfTheMonth,
        serviceConsumer,
        billingCategory,
    )

    // filter receipts if they are already paid
    const unpaidBillingReceipts = await filterPaidBillingReceipts(context, billingReceipts)

    // send notification - no payable receipts
    if (unpaidBillingReceipts.length === 0) {
        return await sendTomorrowPaymentNoReceiptsNotificationSafely(context, recurrentPaymentContext)
    }

    // check limits
    const { isExceed, totalAmount } = await isLimitExceedForBillingReceipts(
        context,
        recurrentPaymentContext,
        unpaidBillingReceipts
    )

    if (isExceed) {
        return await sendTomorrowPaymentLimitExceedNotificationSafely(context, recurrentPaymentContext, totalAmount)
    } else {
        return await sendTomorrowPaymentNotificationSafely(context, recurrentPaymentContext)
    }
}

async function notifyBeforeRecurrentPaymentDate () {
    logger.info({ msg: 'start processing recurrent payment notifications tasks' })

    // prepare context
    const { keystone } = await getSchemaCtx('RecurrentPaymentContext')
    const context = await keystone.createContext({ skipAccessControl: true })

    // prepare vars
    const { pageSize } = paginationConfiguration
    let offset = 0
    let hasMorePages = true
    const tomorrowDate = dayjs().add(1, 'days')

    // retrieve RecurrentPaymentContext page by page
    while (hasMorePages) {
        logger.info({ msg: 'processing recurrent payment notification page', data: { page: Math.floor(offset / pageSize) } })

        // get page (can be empty)
        const page = await getAllReadyToPayRecurrentPaymentContexts(context, tomorrowDate, pageSize, offset)

        // process each page in parallel
        await processArrayOf(page).inParallelWith(async (recurrentPaymentContext) => {
            try {
                await notifyRecurrentPaymentContext(context, tomorrowDate, recurrentPaymentContext)
            } catch (err) {
                logger.error({ msg: 'process recurrent payment notification error', err })
            }
        })

        hasMorePages = page.length > 0
        offset += pageSize
    }
    logger.info({ msg: 'end processing recurrent payment notifications' })
}

module.exports = {
    notifyBeforeRecurrentPaymentDate,
    notifyRecurrentPaymentContext,
}
