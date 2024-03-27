const dayjs = require('dayjs')
const get = require('lodash/get')

const { SENDING_DELAY_SEC } = require('@condo/domains/news/constants/common')


const isPostponedNewsItem = (newsItem) => {
    const publishedAt = get(newsItem, 'publishedAt', null)
    const sendAt = get(newsItem, 'sendAt', null)

    if (!publishedAt || !sendAt) return false
    return dayjs(sendAt).diff(dayjs(publishedAt), 'second') <= SENDING_DELAY_SEC
}

module.exports = {
    isPostponedNewsItem,
}
