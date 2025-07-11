const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    paginationConfiguration,
} = require('@condo/domains/acquiring/constants/recurrentPaymentTask')
const {
    RecurrentPayment,
} = require('@condo/domains/acquiring/utils/serverSchema')
const {
    getAllReadyToPayRecurrentPaymentContexts,
    getReceiptsForServiceConsumer,
    sendNoReceiptsToProceedNotificationSafely,
} = require('@condo/domains/acquiring/utils/taskSchema')
const { processArrayOf } = require('@condo/domains/common/utils/parallel')

const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'recurrent-payment-context-processing' } }
const logger = getLogger()

async function createRecurrentPaymentForRecurrentPaymentContext (context, date, recurrentPaymentContext) {
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

    // no receipts == no payment tasks + notification to end user
    if (billingReceipts.length === 0) {
        return await sendNoReceiptsToProceedNotificationSafely(context, recurrentPaymentContext)
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

async function createRecurrentPaymentForReadyToPayRecurrentPaymentContexts () {
    logger.info({ msg: 'start processing recurrent payment context' })

    // prepare context
    const { keystone } = getSchemaCtx('RecurrentPaymentContext')
    const context = await keystone.createContext({ skipAccessControl: true })

    // prepare vars
    const date = dayjs()
    const { pageSize } = paginationConfiguration
    let offset = 0
    let hasMorePages = true

    // retrieve RecurrentPaymentContext page by page
    while (hasMorePages) {
        logger.info({ msg: 'processing recurrent payment context page', data: { page: Math.floor(offset / pageSize) } })

        // get page (can be empty)
        const page = await getAllReadyToPayRecurrentPaymentContexts(context, date, pageSize, offset)

        // process each page in parallel
        await processArrayOf(page).inParallelWith(async (recurrentPaymentContext) => {
            try {
                await createRecurrentPaymentForRecurrentPaymentContext(context, date, recurrentPaymentContext)
            } catch (err) {
                logger.error({ msg: 'process recurrent payment context error', err })
            }
        })

        hasMorePages = page.length > 0
        offset += pageSize
    }
    logger.info({ msg: 'end processing recurrent payment context' })
}

module.exports = {
    createRecurrentPaymentForReadyToPayRecurrentPaymentContexts,
    createRecurrentPaymentForRecurrentPaymentContext,
}