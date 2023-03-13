const dayjs = require('dayjs')
const { get } = require('lodash')

const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const {
    paginationConfiguration,
} = require('@condo/domains/acquiring/tasks/utils/constants')
const {
    getReadyForProcessingContextPage,
    sendTomorrowPaymentNotificationSafely,
} = require('@condo/domains/acquiring/tasks/utils/queries')
const { processArrayOf } = require('@condo/domains/common/utils/parallel')

const logger = getLogger('recurrent-payment-context-notification')

async function process () {
    logger.info({ msg: 'Start processing recurrent payment notifications tasks' })

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
        logger.info({ msg: `Processing recurrent payment notification page #${Math.floor(offset / pageSize)}` })

        // get page (can be empty)
        const page = await getReadyForProcessingContextPage(context, tomorrowDate, pageSize, offset)

        // process each page in parallel
        await processArrayOf(page).inParallelWith(async (recurrentPaymentContext) => {
            try {
                await sendTomorrowPaymentNotificationSafely(context, recurrentPaymentContext)
            } catch (error) {
                const message = get(error, 'errors[0].message') || get(error, 'message') || JSON.stringify(error)
                logger.error({ msg: 'Process recurrent payment notification error', message })
            }
        })

        hasMorePages = page.length > 0
        offset += pageSize
    }
    logger.info({ msg: 'End processing recurrent payment notifications' })
}

module.exports = {
    process,
}