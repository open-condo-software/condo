const { ADDRESS_SEARCH_STOP_WORDS_RU } = require('./stopWords')


// NOTE: If you really need, you can add stop words for other languages
const ADDRESS_SEARCH_STOP_WORDS = [
    ...ADDRESS_SEARCH_STOP_WORDS_RU,
]

const SUCCESS_STATUS = 'ok'


module.exports = {
    ADDRESS_SEARCH_STOP_WORDS,
    SUCCESS_STATUS,
}
