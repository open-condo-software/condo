const dayjs = require('dayjs')
const get = require('lodash/get')

const { getRedisClient } = require('@open-condo/keystone/redis')

const { ONE_COMMON_NEWS_ITEM_PER_HOUR_THROTTLING } = require('@condo/domains/notification/constants/errors')

const { AbstractHooksSet } = require('./AbstractHooksSet')


class NewsItemCommonHooksSet extends AbstractHooksSet {

    constructor (message) {
        super(message)
        this.cacheClient = getRedisClient('NewsItemCommonHooksSet', 'throttleCommonNewsItemsNotifications')
    }

    getCacheKey () {
        return `user:${get(this.message, ['meta', 'data', 'userId'])}:lastSending`
    }

    async shouldSend () {
        // Throttle common news items. 1 message per hour for user.
        const throttlingCacheKey = this.getCacheKey()
        const lastCommonNewsItemSentDate = await this.cacheClient.get(throttlingCacheKey)

        const ret = { shouldSend: !lastCommonNewsItemSentDate }

        if (!ret.shouldSend) {
            ret.why = ONE_COMMON_NEWS_ITEM_PER_HOUR_THROTTLING
        }

        return ret
    }

    async afterSend () {
        await this.cacheClient.set(this.getCacheKey(), dayjs().toISOString(), 'EX', 3600)
    }
}

module.exports = { NewsItemCommonHooksSet }
