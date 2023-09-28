const dayjs = require('dayjs')

const { getLogger } = require('@open-condo/keystone/logging')
const { getRedisClient } = require('@open-condo/keystone/redis')
const { getSchemaCtx } = require('@open-condo/keystone/schema')

const { BillingAccount } = require('@condo/domains/billing/utils/serverSchema')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'discoverServiceConsumersCronTask' } }
const logger = getLogger('discoverServiceConsumersLastDate')
const redisClient = getRedisClient('discoverServiceConsumersCronTask')
const REDIS_KEY = 'discoverServiceConsumersLastDate'

/**
 * @returns {Promise<void>}
 */
async function discoverServiceConsumersLastDate () {
    const lastDate = await redisClient.get(REDIS_KEY)
    if (!lastDate) {
        const msg = `No last date in redis. Please set the ${REDIS_KEY} key with date (for example, "set ${REDIS_KEY} ${dayjs().toISOString()}")`
        logger.warn({ msg })
        throw new Error(msg)
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
        logger.info({ msg: 'Done', result })
        redisClient.set(REDIS_KEY, dayjs(maxDate).toISOString())
    } catch (err) {
        logger.error({ msg: 'Error', err })
    }
}

module.exports = {
    REDIS_KEY,
    discoverServiceConsumersLastDate,
}
