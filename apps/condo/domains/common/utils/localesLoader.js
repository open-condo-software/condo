const path = require('path')
const fs = require('fs')
const process = require('process')
const conf = require('@core/config')
const { get, template, isEmpty } = require('lodash')

const VARIABLE_REGEXP = /{([\s\S]+?)}/g

let translations = {}

const loadTranslations = () => {
    const translationsDir = path.join(process.cwd(), 'lang')
    const localeFolders = fs.readdirSync(translationsDir)
    translations = localeFolders
        .map(languageCode => ({
            [languageCode]: require(path.join(translationsDir, `${languageCode}/${languageCode}.json`)),
        }))
        .reduce((prev, curr) => ({ ...prev, ...curr }))
}

const maybeLoadTranslations = () => {
    if (isEmpty(translations)) {
        loadTranslations()
    }
}

const getTranslations = (lang = conf.DEFAULT_LOCALE) => {
    maybeLoadTranslations()
    return translations[lang] || translations[conf.DEFAULT_LOCALE]
}

const getAvailableLocales = () => {
    maybeLoadTranslations()
    return Object.keys(translations)
}

/**
 * @param {string} code - the translation code written in en.json, ru.json, ...
 * @param {string} locale - the language code
 * @param {Object} meta - variables passing to the translation string
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
const i18n = (code, { locale = conf.DEFAULT_LOCALE, meta = {} } = {}) => {
    maybeLoadTranslations()
    return template(get(translations, [locale, code], code), { interpolate: VARIABLE_REGEXP })(meta)
}

module.exports = {
    getTranslations,
    getAvailableLocales,
    i18n,
}
