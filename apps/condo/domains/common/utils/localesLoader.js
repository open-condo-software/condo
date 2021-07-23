const path = require('path')
const fs = require('fs')
const process = require('process')
const { defaultLocale } = require('./locales')
const { isEmpty } = require('lodash')
function loadTranslations() {
    const translationsDir = path.join(process.cwd(), 'lang')
    const localeFiles = fs.readdirSync(translationsDir)
    const translations = localeFiles.map(x => ({
        [x.split('.json')[0]]: require(path.join(translationsDir, x)),
    })).reduce((prev, curr) => ({ ...prev, ...curr }))
    return translations
}
let translations = {}
const getTranslations = (lang = defaultLocale) => {
    if (isEmpty(translations)) {
        translations = loadTranslations()
    }
    return translations[lang] || translations[defaultLocale]
}
module.exports = {
    loadTranslations,
    getTranslations,
}