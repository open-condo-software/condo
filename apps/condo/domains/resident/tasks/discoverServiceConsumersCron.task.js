const dayjs = require('dayjs')

const { getKVClient } = require('@open-condo/keystone/kv')
const { getLogger } = require('@open-condo/keystone/logging')
const { getSchemaCtx } = require('@open-condo/keystone/schema')
const { createCronTask } = require('@open-condo/keystone/tasks')

const { BillingAccount } = require('@condo/domains/billing/utils/serverSchema')
const { loadListByChunks } = require('@condo/domains/common/utils/serverSchema')
const { discoverServiceConsumers } = require('@condo/domains/resident/utils/serverSchema')

const logger = getLogger()
const redisClient = getKVClient('discoverServiceConsumersCronTask')

const REDIS_KEY = 'discoverServiceConsumersLastDate'
const DV_SENDER = { dv: 1, sender: { dv: 1, fingerprint: 'discoverServiceConsumersCronTask' } }

// Make a limited number of tries of processing of each chunk of billing accounts
const RETRIES_PER_CHUNK = 3

/**
 * @returns {Promise<void>}
 */
async function discoverServiceConsumersCronTask () {
    const lastDate = await redisClient.get(REDIS_KEY)
    if (!lastDate) {
        // NOTE: keep message static
        const message = `No last date in redis. Please set the ${REDIS_KEY} key with date (for example, "set ${REDIS_KEY} 2025-07-10T13:10:49.799Z")`
        logger.warn(message)
        throw new Error(message)
    }

    const { keystone: context } = getSchemaCtx('BillingAccount')

    let maxDate = dayjs(lastDate)

    await loadListByChunks({
        context,
        list: BillingAccount,
        chunkSize: 20,
        where: {
            createdAt_gt: dayjs(lastDate).toISOString(),
            deletedAt: null,
        },
        sortBy: ['createdAt_ASC'],
        fields: 'id createdAt',
        /**
         * @param {BillingAccount[]} chunk
         * @returns {BillingAccount[]}
         */
        chunkProcessor: async (chunk) => {
            let retryNumber = 0
            const billingAccountsIds = []

            // Gather ids and calculate max date
            chunk.forEach((billingAccount) => {
                billingAccountsIds.push(billingAccount.id)
                const createdAt = dayjs(billingAccount.createdAt)
                maxDate = createdAt.isAfter(maxDate) ? createdAt : maxDate
            })

            do {
                retryNumber++
                try {
                    const result = await discoverServiceConsumers(context, { ...DV_SENDER, billingAccountsIds })
                    logger.info({
                        msg: 'discoverServiceConsumersCronTask chunk done',
                        data: {
                            billingAccountsIds,
                            result,
                            retryNumber,
                        },
                    })
                    // Save date to cache to prevent double processing
                    await redisClient.set(REDIS_KEY, dayjs(maxDate).toISOString())

                    // interrupt tries after success
                    retryNumber = RETRIES_PER_CHUNK
                    break
                } catch (err) {
                    logger.error({
                        msg: 'discoverServiceConsumersCronTask chunk fail',
                        data: {
                            billingAccountsIds,
                            retryNumber,
                        },
                        err,
                    })
                }
                // Try to process every chunk a number of times
                // If all tries were fail, so be it: the resident should add account manually
            } while (retryNumber < RETRIES_PER_CHUNK)

            return []
        },
    })
}

module.exports = {
    REDIS_KEY,
    discoverServiceConsumersCronTask: createCronTask('discoverServiceConsumersCronTask', '13 */4 * * *', discoverServiceConsumersCronTask),
}
