const dayjs = require('dayjs')
const get = require('lodash/get')


const isPostponedNewsItem = (newsItem, sendingDelaySec) => {
    const publishedAt = get(newsItem, 'publishedAt', null)
    const sendAt = get(newsItem, 'sendAt', null)

    if (!publishedAt || !sendAt) return false
    return dayjs(sendAt).diff(dayjs(publishedAt), 'second') > sendingDelaySec
}

module.exports = {
    isPostponedNewsItem,
}
