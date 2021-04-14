const RU = require('date-fns/locale/ru')
const EN = require('date-fns/locale/en-US')

const LOCALES = {
    ru: typeof RU.localize === 'function' ? RU : RU.default,
    en: typeof EN.localize === 'function' ? EN : EN.default,
}

module.exports = {
    LOCALES,
}
