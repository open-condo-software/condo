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
        try {
            if (dirent.isDirectory()) {
                const locale = dirent.name

                // translationsDir is obtained from process.cwd(), so it is not a user input

                // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
                const translationsPath = path.join(translationsDir, locale, `${locale}.json`)
                const translationsContent = JSON.parse(fs.readFileSync(translationsPath, 'utf8'))

                // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
                const customTranslationsPath = path.join(translationsDir, locale, `${locale}.custom.json`)
                const customTranslationsContent = fs.existsSync(customTranslationsPath) ? JSON.parse(fs.readFileSync(customTranslationsPath, 'utf8')) : {}

                return { [locale]: { ...translationsContent, ...customTranslationsContent } }
            } else if (dirent.isFile() && dirent.name.endsWith('.json')) {
                const locale = dirent.name.split('.')[0]

                const isCustomTranslation = dirent.name.endsWith('custom.json')
                if (isCustomTranslation) {
                    throw new Error('Custom translations should be inside of folder, like this: [lang]/[lang].custom.json')
                }

                // nosemgrep: javascript.lang.security.audit.path-traversal.path-join-resolve-traversal.path-join-resolve-traversal
                const filePath = path.join(translationsDir, dirent.name)
                const content = JSON.parse(fs.readFileSync(filePath, 'utf8'))

                return { [locale]: content }
            }
            throw new Error('Found unsupported locale config. Translations must look like [lang].json/[lang].custom.json or [lang]/[lang].json/[lang]/[lang].custom.json')
        } catch (err) {
            throw new Error(`Failed to load translations for ${dirent.name}: ${err.message}`)
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
    const { locale = conf.DEFAULT_LOCALE, meta } = options

    maybeLoadTranslations()

    return template(get(translations, [locale, code], code), { interpolate: VARIABLE_REGEXP })(meta)
}

module.exports = {
    getTranslations,
    getAvailableLocales,
    getLocalized,
    i18n,
}