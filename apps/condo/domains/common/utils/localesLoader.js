const path = require('path')
const fs = require('fs')
const process = require('process')
const isEmpty = require('lodash/isEmpty')
const conf = require('@core/config')

let translations = {}

const loadTranslations = () => {
    const translationsDir = path.join(process.cwd(), 'lang')
    const localeFiles = fs.readdirSync(translationsDir)
    translations = localeFiles
        .map((x) => {
            const languageCode = x.split('.json')[0]
            return {
                [languageCode]: require(path.join(translationsDir, x)),
            }
        })
        .reduce((prev, curr) => ({ ...prev, ...curr }))
}

const getTranslations = (lang = conf.DEFAULT_LOCALE) => {
    if (isEmpty(translations)) {
        loadTranslations()
    }
    return translations[lang] || translations[conf.DEFAULT_LOCALE]
}

const getAvailableLocales = () => {
    if (isEmpty(translations)) {
        loadTranslations()
    }
    return Object.keys(translations)
}

module.exports = {
    loadTranslations,
    getTranslations,
    getAvailableLocales,
}
