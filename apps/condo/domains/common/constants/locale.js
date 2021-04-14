const RU = require('date-fns/locale/ru')
const EN = require('date-fns/locale/en-US')

const getLocalize = (locale) => {
    if (Reflect.has(locale, 'localize')) {
        return locale
    }
    if (Reflect.has(locale, 'default') && Reflect.has(locale.default, 'localize')) {
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
