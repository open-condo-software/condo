const conf = require('@open-condo/config')


const EN_LOCALE = 'en'
const RU_LOCALE = 'ru'
const DEFAULT_LOCALE = conf['DEFAULT_LOCALE'] || RU_LOCALE

const LOCALES = [
    EN_LOCALE,
    RU_LOCALE,
]

module.exports = {
    DEFAULT_LOCALE,
    LOCALES,
    EN_LOCALE,
    RU_LOCALE,
}
