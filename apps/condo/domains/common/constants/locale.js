const RU = require('date-fns/locale/ru')
const EN = require('date-fns/locale/en-US')
const { has } = require('lodash')

const getLocalize = (locale) => {
    if (has(locale, 'localize')) {
        return locale
    }
    if (has(locale, ['default', 'localize'])) {
        return locale.default
    }
    throw new Error('Something wrong with locales in date-fns again')
}

const RU_LOCALE = 'ru'
const EN_LOCALE = 'en'
const LOCALES = {
    [RU_LOCALE]: getLocalize(RU),
    [EN_LOCALE]: getLocalize(EN),
}

// TODO(pahaz): we also have a LANG. We need to check the locale usage and refactor it to locale or lang
module.exports = {
    RU_LOCALE, EN_LOCALE,
    LOCALES,
}
