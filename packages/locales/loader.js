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

                const translationsPath = path.join(translationsDir, locale, `${locale}.json`)
                const translationsContent = JSON.parse(fs.readFileSync(translationsPath, 'utf8'))

                const customTranslationsPath = path.join(translationsDir, locale, `${locale}.custom.json`)
                const customTranslationsContent = fs.existsSync(customTranslationsPath) ? JSON.parse(fs.readFileSync(customTranslationsPath, 'utf8')) : {}

                return { [locale]: { ...translationsContent, ...customTranslationsContent } }
            } else if (dirent.isFile() && dirent.name.endsWith('.json')) {
                const locale = dirent.name.split('.')[0]

                const isCustomTranslation = dirent.name.endsWith('custom.json')
                if (isCustomTranslation) {
                    throw new Error('Custom translations should be inside of folder, like this: [lang]/[lang].custom.json')
                }

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

const i18n = (code, options = { locale: conf.DEFAULT_LOCALE, meta: {} }) => {
    const { locale, meta } = options
    maybeLoadTranslations()
    const translation = get(translations, [locale, code].join('.'), code)
    return template(translation, { interpolate: VARIABLE_REGEXP })(meta)
}

module.exports = {
    getTranslations,
    getAvailableLocales,
    getLocalized,
    i18n,
}