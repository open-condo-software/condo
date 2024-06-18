const dayjs = require('dayjs')
const { v4: uuid } = require('uuid')

const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { SEND_DAILY_STATISTICS_TASK } = require('@condo/domains/common/constants/featureflags')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { STAFF } = require('@condo/domains/user/constants/common')
const { UserAdmin } = require('@condo/domains/user/utils/serverSchema')

const { sendDailyMessageToUserSafely } = require('./helpers/sendDailyStatistics')


const appLogger = getLogger('condo')
const logger = appLogger.child({ module: 'task/sendDailyStatistics' })


const sendDailyStatistics = async () => {
    const taskId = this.id || uuid()
    const currentDate = dayjs().toISOString()

    try {
        logger.info({ msg: 'Start sendDailyStatistics', taskId, data: { currentDate } })
        const { keystone: context } = getSchemaCtx('User')

        const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(context, SEND_DAILY_STATISTICS_TASK)
        if (!isFeatureEnabled) {
            logger.info({ msg: 'sendDailyStatistics is disabled', taskId, data: { currentDate } })
            return 'disabled'
        }

        await loadListByChunks({
            context,
            list: UserAdmin,
            chunkSize: 50,
            where: {
                deletedAt: null,
                isSupport: false,
                isAdmin: false,
                rightsSet_is_null: true,
                type: STAFF,
                AND: [
                    { email_not_contains: '@doma.ai' },
                    { email_not: null },
                ],
                // isEmailVerified: true,
            },
            /**
             * @param {User[]} chunk
             * @returns {User[]}
             */
            chunkProcessor: async (chunk) => {
                for (const user of chunk) {
                    await sendDailyMessageToUserSafely(context, logger, user, currentDate, taskId, {
                        // We collect statistics only for organizations that were created more than a month ago.
                        createdAt_lte: dayjs(currentDate).subtract(1, 'month').toISOString(),
                    })
                }
                return []
            },
        })
    } catch (error) {
        logger.error({ msg: 'Sending emails ended with an error', taskId, data: { currentDate } })
        throw error
    }
}

module.exports = {
    // At 06:00
    sendDailyStatisticsTask: createCronTask('sendDailyStatistics', '0 6 * * *', sendDailyStatistics),
}
