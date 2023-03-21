const dayjs = require('dayjs')
const { get } = require('lodash')
const { v4: uuid } = require('uuid')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const {
    paginationConfiguration,
} = require('@condo/domains/acquiring/constants/recurrentPaymentTask')
const {
    getAllReadyToPayRecurrentPaymentContexts,
    sendTomorrowPaymentNotificationSafely,
} = require('@condo/domains/acquiring/utils/taskSchema')
const { processArrayOf } = require('@condo/domains/common/utils/parallel')

const logger = getLogger('recurrent-payment-context-notification')

async function process () {
    const taskId = this.id || uuid()
    logger.info({ msg: 'Start processing recurrent payment notifications tasks', taskId })

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
        logger.info({ msg: `Processing recurrent payment notification page #${Math.floor(offset / pageSize)}`, taskId })

        // get page (can be empty)
        const page = await getAllReadyToPayRecurrentPaymentContexts(context, tomorrowDate, pageSize, offset)

        // process each page in parallel
        await processArrayOf(page).inParallelWith(async (recurrentPaymentContext) => {
            try {
                await sendTomorrowPaymentNotificationSafely(context, recurrentPaymentContext)
            } catch (err) {
                logger.error({ msg: 'Process recurrent payment notification error', err, taskId })
            }
        })

        hasMorePages = page.length > 0
        offset += pageSize
    }
    logger.info({ msg: 'End processing recurrent payment notifications' })
}

module.exports = {
    process,
    recurrentPaymentsNotificationCron: createCronTask('recurrentPaymentsNotification', '0 * * * *', process),
}