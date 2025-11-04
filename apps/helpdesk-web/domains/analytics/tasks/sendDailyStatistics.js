const dayjs = require('dayjs')

const conf = require('@open-condo/config')
const { featureToggleManager } = require('@open-condo/featureflags/featureToggleManager')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask, removeCronTask } = require('@open-condo/keystone/tasks')

const { RETENTION_LOOPS_ENABLED } = require('@condo/domains/common/constants/featureflags')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { STAFF } = require('@condo/domains/user/constants/common')
const { User } = require('@condo/domains/user/utils/serverSchema')

const { sendDailyMessageToUserSafely } = require('./helpers/sendDailyStatistics')


const logger = getLogger()


const IGNORED_EMAIL_MASKS_FOR_DAILY_STATISTICS = conf.IGNORED_EMAIL_MASKS_FOR_DAILY_STATISTICS
    ? JSON.parse(conf.IGNORED_EMAIL_MASKS_FOR_DAILY_STATISTICS)
    : []

/**
 * Mailing of letters occurs for each user with the type "staff".
 *
 * Only one letter is sent every day.
 *
 * Mailing logic:
 * For each "staff" user who has an email:
 *  1) We find out which organizations he is a member of and has right "canManageOrganization"
 *  2) And for each such organization we get statistics
 *  3) After that we form a letter (data for all user organizations at once) and send it to user email
 */
const sendDailyStatistics = async () => {
    const currentDate = dayjs().toISOString()

    try {
        logger.info({ msg: 'start sendDailyStatistics', data: { currentDate } })

        const isFeatureEnabled = await featureToggleManager.isFeatureEnabled(null, RETENTION_LOOPS_ENABLED)
        if (!isFeatureEnabled) {
            logger.info({ msg: 'sendDailyStatistics is disabled', data: { currentDate } })
            return 'disabled'
        }

        const { keystone: context } = getSchemaCtx('User')
        await loadListByChunks({
            context,
            list: User,
            chunkSize: 50,
            where: {
                deletedAt: null,
                isSupport: false,
                isAdmin: false,
                rightsSet_is_null: true,
                type: STAFF,
                AND: [
                    ...IGNORED_EMAIL_MASKS_FOR_DAILY_STATISTICS.map(mask => ({ email_not_contains: mask })),
                    { email_not: null },
                ],
                // NOTE: We don't have a process for email verification, so it's not used yet.
                // isEmailVerified: true,
            },
            fields: 'id locale email',
            /**
             * @param {User[]} chunk
             * @returns {User[]}
             */
            chunkProcessor: async (chunk) => {
                for (const user of chunk) {
                    await sendDailyMessageToUserSafely(context, user, currentDate, {
                        // We collect statistics only for organizations that were created more than a month ago.
                        createdAt_lte: dayjs(currentDate).subtract(1, 'month').toISOString(),
                    })
                }
                return []
            },
        })
        logger.info({ msg: 'successfully finished sendDailyStatistics', data: { currentDate } })
    } catch (err) {
        logger.error({ msg: 'sending emails ended with an error', data: { currentDate }, err })
        throw err
    }
}


removeCronTask('sendDailyStatistics', '0 6 * * *')

module.exports = {
    // At 06:00 on every day-of-week from Monday through Friday.
    sendDailyStatisticsTask: createCronTask('sendDailyStatistics', '0 6 * * 1-5', sendDailyStatistics),
}
