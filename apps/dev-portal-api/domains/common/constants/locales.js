const conf = require('@open-condo/config')

const RU_LOCALE = 'ru'
const EN_LOCALE = 'en'

const SUPPORTED_LOCALES = [
    RU_LOCALE,
    EN_LOCALE,
]

const DEFAULT_LOCALE = conf['DEFAULT_LOCALE'] || EN_LOCALE

module.exports = {
    RU_LOCALE,
    EN_LOCALE,
    SUPPORTED_LOCALES,
    DEFAULT_LOCALE,
}