const dayjs = require('dayjs')
const get = require('lodash/get')

const { count } = require('@open-condo/keystone/schema')

const { AbstractHooks } = require('./AbstractMessageTypesHooks')

class NewsItemCommonHooks extends AbstractHooks {

    async shouldSend () {
        const userId = get(this.messageAttrs, ['user', 'connect', 'id'])
        const messageType = get(this.messageAttrs, 'type')

        if (!userId || !messageType) {
            return true
        }

        const messagesCount = await count('Message', {
            user: { id: userId },
            type: messageType,
            createdAt_gte: dayjs().subtract(1, 'hour').toISOString(),
        })

        return messagesCount === 0
    }
}

module.exports = { NewsItemCommonHooks }
