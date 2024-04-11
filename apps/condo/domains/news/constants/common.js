const { get } = require('lodash')

const conf = require('@open-condo/config')

const SENDING_DELAY_SEC = Number(get(conf, 'NEWS_ITEMS_SENDING_DELAY_SEC', 15))
const NEWS_SENDING_TTL_IN_SEC = Number(get(conf, 'NEWS_ITEM_SENDING_TTL_SEC', 60 * 30))
const LOAD_RESIDENTS_CHUNK_SIZE = 20

module.exports = {
    SENDING_DELAY_SEC,
    LOAD_RESIDENTS_CHUNK_SIZE,
    NEWS_SENDING_TTL_IN_SEC,
}
