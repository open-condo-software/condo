const RU = require('dayjs/locale/ru')
const EN = require('dayjs/locale/en')


const RU_LOCALE = 'ru'
const EN_LOCALE = 'en'
const LOCALES = {
    [RU_LOCALE]: RU,
    [EN_LOCALE]: EN,
}

// TODO(pahaz): we also have a LANG. We need to check the locale usage and refactor it to locale or lang
module.exports = {
    RU_LOCALE, EN_LOCALE,
    LOCALES,
}
