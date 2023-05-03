const { get } = require('lodash')

const conf = require('@open-condo/config')

const SENDING_DELAY_SEC = Number(get(conf, 'NEWS_ITEMS_SENDING_DELAY_SEC', 15))

module.exports = {
    SENDING_DELAY_SEC,
}
