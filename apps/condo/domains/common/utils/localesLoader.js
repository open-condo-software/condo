const path = require('path')
const fs = require('fs')
const process = require('process')
const isEmpty = require('lodash/isEmpty')
const conf = require('@core/config')

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