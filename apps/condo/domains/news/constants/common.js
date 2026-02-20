const get = require('lodash/get')

const conf = require('@open-condo/config')

const SENDING_DELAY_SEC = Number(get(conf, 'NEWS_ITEMS_SENDING_DELAY_SEC', 15))
const NEWS_SENDING_TTL_IN_SEC = Number(get(conf, 'NEWS_ITEM_SENDING_TTL_SEC', 60 * 30))

const MESSAGE_TITLE_MAX_LEN = 50
const MESSAGE_BODY_MAX_LEN = 150

module.exports = {
    SENDING_DELAY_SEC,
    NEWS_SENDING_TTL_IN_SEC,
    MESSAGE_TITLE_MAX_LEN,
    MESSAGE_BODY_MAX_LEN,
}
