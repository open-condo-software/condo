const dayjs = require('dayjs')
const { v4: uuid } = require('uuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
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
    sendTomorrowPaymentNotificationSafely,
    sendTomorrowPaymentLimitExceedNotificationSafely,
    isLimitExceedForBillingReceipts,
} = require('@condo/domains/acquiring/utils/taskSchema')
const { getStartDates } = require('@condo/domains/common/utils/date')
const { processArrayOf } = require('@condo/domains/common/utils/parallel')

const dvAndSender = { dv: 1, sender: { dv: 1, fingerprint: 'recurrent-payments-seeking-for-new-receipt' } }
const logger = getLogger('recurrent-payments-seeking-for-new-receipt')
const REDIS_LAST_DATE_KEY = 'LAST_RECURRENT_PAYMENT_SEEKING_RECEIPTS_CREATED_AT'
const redisClient = getRedisClient()

async function scanBillingReceiptsForRecurrentPaymentContext (context, recurrentPaymentContext, periods, lastDt) {
    // prepare vars
    const { serviceConsumer, billingCategory } = recurrentPaymentContext
    const startOfTheMonth = dayjs().startOf('month')
    const tomorrowMidnight = dayjs().add(1, 'days').startOf('day')
    const receiptsWhere = {
        period_in: periods,
        createdAt_gt: dayjs(lastDt).toISOString(),
        deletedAt: null,
    }

    // get billing receipts
    const billingReceipts = await getReceiptsForServiceConsumer(
        context,
        startOfTheMonth,
        serviceConsumer,
        billingCategory,
        receiptsWhere,
    )

    // no receipts == no payment tasks
    if (billingReceipts.length === 0) {
        return
    }

    // create payment proceeding tasks
    const recurrentPayment = await RecurrentPayment.create(context, {
        ...dvAndSender,
        tryCount: 0,
        state: {},
        payAfter: tomorrowMidnight.toISOString(),
        billingReceipts: billingReceipts.map(receipt => ({ id: receipt.id })),
        recurrentPaymentContext: { connect: { id: recurrentPaymentContext.id } },
    })

    // check limits
    const { isExceed, totalAmount } = await isLimitExceedForBillingReceipts(
        context,
        recurrentPaymentContext,
        billingReceipts
    )

    if (isExceed) {
        return await sendTomorrowPaymentLimitExceedNotificationSafely(context, recurrentPaymentContext, totalAmount)
    } else {
        return await sendTomorrowPaymentNotificationSafely(context, recurrentPaymentContext, recurrentPayment)
    }
}

async function createRecurrentPaymentForNewBillingReceipt () {
    const taskId = this.id || uuid()
    logger.info({ msg: 'Start processing new billing receipts for recurrentPaymentContext tasks', taskId })

    // prepare context
    const { keystone } = await getSchemaCtx('RecurrentPaymentContext')
    const context = await keystone.createContext({ skipAccessControl: true })

    // prepare vars
    const { pageSize } = paginationConfiguration
    let offset = 0
    let hasMorePages = true
    const { prevMonthStart, thisMonthStart } = getStartDates()
    const periods = [prevMonthStart, thisMonthStart]

    // prepare filter values
    const lastDt = await redisClient.get(REDIS_LAST_DATE_KEY) || thisMonthStart
    logger.info({ msg: `Seeking for new billing receipts at ${lastDt}`, taskId })

    // retrieve BillingReceipts page by page
    while (hasMorePages) {
        logger.info({ msg: `Processing recurrentPaymentContext page #${Math.floor(offset / pageSize)}`, taskId })

        // get page (can be empty)
        const extraArgs = {
            paymentDay: null,
            autoPayReceipts: true,
        }
        const page = await getAllReadyToPayRecurrentPaymentContexts(context, dayjs(), pageSize, offset, extraArgs)

        // process each page in parallel
        await processArrayOf(page).inParallelWith(async (recurrentPaymentContext) => {
            try {
                await scanBillingReceiptsForRecurrentPaymentContext(context, recurrentPaymentContext, periods, lastDt)
            } catch (err) {
                logger.error({ msg: 'Process recurrentPaymentContext error', err, taskId })
            }
        })

        hasMorePages = page.length > 0
        offset += pageSize
    }

    // update watermark value
    await redisClient.set(REDIS_LAST_DATE_KEY, dayjs().toISOString())

    logger.info({ msg: 'End processing new billing receipts for recurrentPaymentContext tasks', taskId })
}

module.exports = {
    scanBillingReceiptsForRecurrentPaymentContext,
    createRecurrentPaymentForNewBillingReceipt,
}