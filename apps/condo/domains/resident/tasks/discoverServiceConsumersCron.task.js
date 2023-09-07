const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { BillingAccount } = require('@condo/domains/billing/utils/serverSchema')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'discoverServiceConsumersCronTask' } }
const logger = getLogger('discoverServiceConsumersCronTask')
const redisClient = getRedisClient('discoverServiceConsumersCronTask')
const REDIS_KEY = 'discoverServiceConsumersLastDate'

/**
 * @returns {Promise<void>}
 */
async function discoverServiceConsumersCronTask () {
    const lastDate = await redisClient.get(REDIS_KEY)
    if (!lastDate) {
        const message = `No last date in redis. Please set the ${REDIS_KEY} key with date (for example, "set ${REDIS_KEY} ${dayjs().toISOString()}")`
        logger.warn({ message })
        throw new Error(message)
    }

    const { keystone: context } = getSchemaCtx('BillingAccount')

    const billingAccountsIds = new Set()
    let maxDate = dayjs(lastDate)

    await loadListByChunks({
        context,
        list: BillingAccount,
        chunkSize: 50,
        where: {
            createdAt_gt: dayjs(lastDate).toISOString(),
            deletedAt: null,
        },
        sortBy: ['createdAt_ASC'],
        /**
         * @param {BillingAccount[]} chunk
         * @returns {BillingAccount[]}
         */
        chunkProcessor: (chunk) => {
            chunk.forEach((billingAccount) => {
                billingAccountsIds.add(billingAccount.id)
                const createdAt = dayjs(billingAccount.createdAt)
                maxDate = createdAt.isAfter(maxDate) ? createdAt : maxDate
            })

            return []
        },
    })

    /**
     * @type {DiscoverServiceConsumersInput}
     */
    const data = {
        ...DV_SENDER,
        billingAccountsIds: Array.from(billingAccountsIds),
    }

    try {
        const result = await discoverServiceConsumers(context, data)
        logger.info({ message: 'discoverServiceConsumersCronTask done', result })
        redisClient.set(REDIS_KEY, dayjs(maxDate).toISOString())
    } catch (err) {
        logger.error({ message: 'discoverServiceConsumersCronTask fail', err })
    }
}

module.exports = {
    REDIS_KEY,
    discoverServiceConsumersCronTask: createCronTask('discoverServiceConsumersCronTask', '13 * * * *', discoverServiceConsumersCronTask, { priority: 10 }),
}
