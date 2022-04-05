const { i18n } = require('@condo/domains/common/utils/localesLoader')
const conf = require('@core/config')

const EXCEL_TEMPLATES_HEADERS = {
    payments: ['date', 'account', 'address', 'unitName', 'type', 'transaction', 'amount'],
    contacts: ['name', 'address', 'unitName', 'phone', 'email'],
}

/**
 * Builds translation key using template `excelExport.headers.${registry}.${column}`
 * @param {string} registry
 * @param {string} column
 * @returns {string}
 */
function translationStringKeyForExcelExportHeader (registry, column) {
    return `excelExport.headers.${registry}.${column}`
}

/**
 * @param {string} registry
 * @param {string} locale
 * @returns {Object<string, string>}
 */
function getHeadersTranslations (registry, locale = conf.DEFAULT_LOCALE) {
    return EXCEL_TEMPLATES_HEADERS[registry].reduce((acc, curr) => {
        return { ...acc, [curr]: i18n(translationStringKeyForExcelExportHeader(registry, curr), { locale }) }
    }, {})
}

module.exports = {
    EXCEL_TEMPLATES_HEADERS,
    getHeadersTranslations,
    translationStringKeyForExcelExportHeader,
}
