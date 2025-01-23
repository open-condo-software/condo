const DE = require('dayjs/locale/de')
const EN = require('dayjs/locale/en')
const ES = require('dayjs/locale/es')
const FR = require('dayjs/locale/fr')
const PO = require('dayjs/locale/pt')
const RU = require('dayjs/locale/ru')
const SL = require('dayjs/locale/sl')
const UZ = require('dayjs/locale/uz')

const RU_LOCALE = 'ru'
const EN_LOCALE = 'en'
const UZ_LOCALE = 'uz'
const FR_LOCALE = 'fr'
const SL_LOCALE = 'sl'
const DE_LOCALE = 'de'
const ES_LOCALE = 'es'
const PO_LOCALE = 'pt'

/** @deprecated don't use this hardcode const! use conf.DEFAULT_LOCALE */
const DEFAULT_LOCALE = RU_LOCALE
const LOCALES = {
    [RU_LOCALE]: RU,
    [EN_LOCALE]: EN,
    [UZ_LOCALE]: UZ,
    [FR_LOCALE]: FR,
    [SL_LOCALE]: SL,
    [DE_LOCALE]: DE,
    [ES_LOCALE]: ES,
    [PO_LOCALE]: PO,
}

// TODO(pahaz): we also have a LANG. We need to check the locale usage and refactor it to locale or lang
module.exports = {
    RU_LOCALE,
    EN_LOCALE,
    UZ_LOCALE,
    FR_LOCALE,
    SL_LOCALE,
    DE_LOCALE,
    ES_LOCALE,
    PO_LOCALE,
    DEFAULT_LOCALE,
    LOCALES,
}
