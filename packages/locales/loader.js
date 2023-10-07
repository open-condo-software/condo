// TODO (DOMA-3868) Move this package to app/condo, remove this package and redeclare functions used in other packages locally
const fs = require('fs')
const path = require('path')
const process = require('process')

const { get, template, isEmpty } = require('lodash')

const conf = require('@open-condo/config')

const VARIABLE_REGEXP = /{([\s\S]+?)}/g

let translations = {}

const loadTranslations = () => {
    const translationsDir = path.join(process.cwd(), 'lang')
    const availableLocales = fs.readdirSync(translationsDir, { withFileTypes: true })

    translations = Object.assign({}, ...availableLocales.map(dirent => {
        if (dirent.isDirectory()) {
            const locale = dirent.name
            return { [locale]: require(path.join(translationsDir, locale, `${locale}.json`)) }
        } else if (dirent.isFile() && dirent.name.endsWith('.json')) {
            const locale = dirent.name.split('.')[0]
            return { [locale]: require(path.join(translationsDir, dirent.name)) }
        } else {
            throw new Error('Unsupported locale config. Must be [lang].json or [lang]/[lang].json file')
        }
    }))
}

const maybeLoadTranslations = () => {
    if (isEmpty(translations)) loadTranslations()
}

const getTranslations = (lang = conf.DEFAULT_LOCALE) => {
    maybeLoadTranslations()

    return translations[lang] || translations[conf.DEFAULT_LOCALE]
}

const getAvailableLocales = () => {
    maybeLoadTranslations()

    return Object.keys(translations)
}

const getLocalized = (lang, key) => {
    const translations = getTranslations(lang)

    return get(translations, key, key)
}


/**
 * @param {string} code - the translation code written in en.json, ru.json, ...
 * @param {{locale: string?, meta: Object?}?} options
 * @param {string?} options.locale - the language code
 * @param {Object?} options.meta - variables passing to the translation string
 * @returns {string} translated string
 * @example
 * // en.json:
 * {
 *   ...,
 *   "greeting": "Hello, {name}!",
 *   ...,
 * }
 *
 * i18n('greeting', { meta: { name: 'World' } })
 * // => "Hello, World!"
 */
const i18n = (code, options = { locale: conf.DEFAULT_LOCALE, meta: {} }) => {
    const { locale, meta } = options

    maybeLoadTranslations()

    return template(get(translations, [locale, code], code), { interpolate: VARIABLE_REGEXP })(meta)
}


module.exports = {
    getTranslations,
    getAvailableLocales,
    getLocalized,
    i18n,
}
