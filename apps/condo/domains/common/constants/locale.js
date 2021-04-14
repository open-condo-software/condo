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


const LOCALES = {
    ru: getLocalize(RU),
    en: getLocalize(EN),
}

module.exports = {
    LOCALES,
}
