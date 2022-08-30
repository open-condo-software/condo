const { uniq, isEmpty } = require('lodash')
const dayjs = require('dayjs')

const { getSchemaCtx } = require('@condo/keystone/schema')
const { createTask } = require('@condo/keystone/tasks')

const { RU_LOCALE } = require('@condo/domains/common/constants/countries')

const { MarketingMessage, sendMessage } = require('@condo/domains/notification/utils/serverSchema')

const { User } = require('@condo/domains/user/utils/serverSchema')

const {
    MARKETING_MESSAGE_CREATED_STATUS,
    MARKETING_MESSAGE_PROCESSING_STATUS,
    MARKETING_MESSAGE_FAILED_STATUS,
    MARKETING_MESSAGE_DONE_STATUS,
    SMS_TRANSPORT, EMAIL_TRANSPORT, PUSH_TRANSPORT,
    CUSTOM_CONTENT_MESSAGE_TYPE,
} = require('../constants/constants')

const CHUNK_SIZE = 20
const DATE_FORMAT = 'YYYY-MM-DD'

const selectTarget = (transportType, user) => {
    if (transportType === SMS_TRANSPORT) return { phone: user.phone }
    if (transportType === EMAIL_TRANSPORT) return { email: user.email }

    return { user: { id: user.id } }
}

const getUniqKey = (batchId, date) => `${batchId}:${date}`

async function sendMarketingMessages (batchId) {
    const { keystone: context } = await getSchemaCtx('MarketingMessage')
    const batch = await MarketingMessage.getOne(context, { id: batchId })

    if (batch.id !== batchId) throw new Error('get batch by id has wrong result')
    // Skip batches that are already have been processed
    if (batch.status !== MARKETING_MESSAGE_CREATED_STATUS) return 'batch already processed'

    const baseAttrs = {
        dv: batch.dv,
        sender: batch.sender,
    }

    await MarketingMessage.update(context, batch.id, {
        ...baseAttrs,
        status: MARKETING_MESSAGE_PROCESSING_STATUS,
    })

    const ids = uniq(batch.idList)
    const userWhere = {
        id_in: ids,
        deletedAt: null,
    }

    if (batch.transportType === SMS_TRANSPORT) userWhere.phone_not = null
    if (batch.transportType === EMAIL_TRANSPORT) userWhere.email_not = null

    const usersCount = await User.count(context, userWhere)
    const today = dayjs().format(DATE_FORMAT)
    let skip = 0

    if (usersCount < 1) {
        await MarketingMessage.update(context, batch.id, {
            ...baseAttrs,
            status: MARKETING_MESSAGE_FAILED_STATUS,
        })

        return
    }

    while (skip < usersCount) {
        const users = await User.getAll(context, userWhere, { sortBy: ['createdAt_ASC'], first: CHUNK_SIZE, skip })

        if (isEmpty(users)) break

        skip += users.length

        for (const user of users) {
            await sendMessage(context, {
                lang: RU_LOCALE,
                to: selectTarget(batch.transportType, user),
                type: CUSTOM_CONTENT_MESSAGE_TYPE,
                meta: {
                    dv: 1,
                    title: batch.title,
                    body: batch.message,
                    data: {
                        userId: user.id,
                        url: batch.deepLink,
                        marketingMessageId: batch.id,
                    },
                },
                uniqKey: getUniqKey(batch.id, today),
                sender: batch.sender,
            })
        }
    }

    await MarketingMessage.update(context, batch.id, {
        ...baseAttrs,
        status: MARKETING_MESSAGE_DONE_STATUS,
    })
}

const sendMarketingMessagesTask = createTask('sendMarketingMessages', sendMarketingMessages, { priority: 3 })

module.exports = {
    DATE_FORMAT,
    getUniqKey,
    selectTarget,
    sendMarketingMessages,
    sendMarketingMessagesTask,
}