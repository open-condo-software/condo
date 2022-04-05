const { i18n } = require('@condo/domains/common/utils/localesLoader')
const conf = require('@core/config')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')

const EXPORT_TYPE_PAYMENTS = 'payments'
const EXPORT_TYPE_CONTACTS = 'contacts'
const EXPORT_TYPE_METERS = 'meters'
const EXPORT_TYPE_BUILDINGS = 'buildings'
const EXPORT_TYPE_TICKETS = 'tickets'

const EXCEL_TEMPLATES_HEADERS = {
    [EXPORT_TYPE_PAYMENTS]: ['date', 'account', 'address', 'unitName', 'type', 'transaction', 'amount'],
    [EXPORT_TYPE_CONTACTS]: ['name', 'address', 'unitName', 'phone', 'email'],
    [EXPORT_TYPE_METERS]: [
        'date', 'address', 'unitName', 'accountNumber', 'resource',
        'number', 'place', 'value1', 'value2', 'value3', 'value4', 'clientName', 'source',
    ],
    [EXPORT_TYPE_BUILDINGS]: ['organization', 'address', 'unitsCount', 'uninhabitedUnitsCount', 'ticketsInWork', 'ticketsClosed'],
    [EXPORT_TYPE_TICKETS]: [
        'number', 'organization', 'property', 'unitName', 'entranceName', 'floorName', 'clientName', 'clientPhone',
        'details', 'isEmergency', 'isWarranty', 'isPaid', 'classifier', 'place', 'category', 'description',
        'createdAt', 'updatedAt', 'inworkAt', 'completedAt', 'status', 'operator', 'executor', 'assignee',
        'comments', 'source', 'deadline', 'reviewValue', 'reviewComment', 'statusReopenedCounter',
    ],
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

/**
 * @param {string} locale
 * @returns {Object<string, string>}
 */
function ticketStatusesTranslations (locale) {
    return Object.keys(STATUS_IDS).reduce((acc, curr) => {
        return {
            ...acc,
            [curr]: i18n(`ticket.status.${curr}.name`, { locale }),
        }
    }, {})
}

module.exports = {
    EXPORT_TYPE_PAYMENTS,
    EXPORT_TYPE_CONTACTS,
    EXPORT_TYPE_METERS,
    EXPORT_TYPE_BUILDINGS,
    EXPORT_TYPE_TICKETS,
    EXCEL_TEMPLATES_HEADERS,
    getHeadersTranslations,
    translationStringKeyForExcelExportHeader,
    ticketStatusesTranslations,
}
