const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    dvAndSender,
    paginationConfiguration,
} = require('@condo/domains/acquiring/tasks/utils/constants')
const {
    getReadyForProcessingContextPage,
    getReceiptsForServiceConsumer,
} = require('@condo/domains/acquiring/tasks/utils/queries')
const {
    RecurrentPayment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const { processArrayOf } = require('@condo/domains/common/utils/parallel')

const logger = getLogger('recurrent-payment-context-processing')

async function processContext (context, date, recurrentPaymentContext) {
    // prepare vars
    const { serviceConsumer, billingCategory } = recurrentPaymentContext
    const previousMonthDate = date.startOf('month').subtract(1, 'days')

    // get billing receipts
    const billingReceipts = await getReceiptsForServiceConsumer(
        context,
        previousMonthDate,
        serviceConsumer,
        billingCategory,
    )

    // no receipts == no payment tasks
    if (billingReceipts.length === 0) {
        return
    }

    // create payment proceeding tasks
    return await RecurrentPayment.create(context, {
        ...dvAndSender,
        tryCount: 0,
        state: {},
        billingReceipts: billingReceipts.map(receipt => ({ id: receipt.id })),
        recurrentPaymentContext: { connect: { id: recurrentPaymentContext.id } },
    })
}

async function process () {
    logger.info({ msg: 'Start processing recurrent payment context' })

    // prepare context
    const { keystone: context } = await getSchemaCtx('RecurrentPaymentContext')

    // prepare vars
    const date = dayjs()
    const { pageSize } = paginationConfiguration
    let offset = 0
    let hasMorePages = true

    // retrieve RecurrentPaymentContext page by page
    while (hasMorePages) {
        logger.info({ msg: `Processing recurrent payment context page #${Math.floor(offset / pageSize)}` })
        // get page (can be empty)
        const page = await getReadyForProcessingContextPage(context, date, pageSize, offset)

        // process each page in parallel
        await processArrayOf(page).inParallelWith(async (recurrentPaymentContext) => {
            try {
                await processContext(context, date, recurrentPaymentContext)
            } catch (error) {
                logger.error({ msg: 'Process recurrent payment context error', error })
            }
        })

        hasMorePages = page.length > 0
        offset += pageSize
    }
    logger.info({ msg: 'End processing recurrent payment context' })
}

module.exports = {
    process,
    processContext,
}