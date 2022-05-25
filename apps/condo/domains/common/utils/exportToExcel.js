const conf = require('@core/config')
const { i18n } = require('@condo/domains/common/utils/localesLoader')
const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')

const EXPORT_TYPE_PAYMENTS = 'payments'
const EXPORT_TYPE_CONTACTS = 'contacts'
const EXPORT_TYPE_METERS = 'meters'
const EXPORT_TYPE_BUILDINGS = 'buildings'
const EXPORT_TYPE_TICKETS = 'tickets'

const TICKETS_REPORTS_PREFIX = 'ticket_report_'
const TICKET_REPORT_PROPERTY_STATUS = 'property_status'
const TICKET_REPORT_STATUS_ASSIGNEE = 'status_assignee'
const TICKET_REPORT_STATUS_CATEGORY_CLASSIFIER = 'status_categoryClassifier'
const TICKET_REPORT_STATUS_DAY_GROUP = 'status_dayGroup'
const TICKET_REPORT_STATUS_EXECUTOR = 'status_executor'
const TICKET_REPORT_STATUS_PROPERTY = 'status_property'

const EXCEL_TEMPLATES_HEADERS = {
    [EXPORT_TYPE_PAYMENTS]: ['date', 'account', 'address', 'unitName', 'type', 'transaction', 'amount'],
    [EXPORT_TYPE_CONTACTS]: ['name', 'address', 'unitName', 'unitType', 'phone', 'email'],
    [EXPORT_TYPE_METERS]: [
        'date', 'address', 'unitName', 'unitType', 'accountNumber', 'resource',
        'number', 'place', 'value1', 'value2', 'value3', 'value4', 'clientName', 'source',
    ],
    [EXPORT_TYPE_BUILDINGS]: ['organization', 'address', 'unitsCount', 'uninhabitedUnitsCount', 'ticketsInWork', 'ticketsClosed'],
    [EXPORT_TYPE_TICKETS]: [
        'number', 'organization', 'property', 'unitName', 'entranceName', 'floorName', 'clientName', 'clientPhone',
        'details', 'isEmergency', 'isWarranty', 'isPaid', 'classifier', 'place', 'category', 'description',
        'createdAt', 'updatedAt', 'inworkAt', 'completedAt', 'status', 'operator', 'executor', 'assignee',
        'organizationComments', 'residentComments', 'source', 'deadline', 'reviewValue', 'reviewComment', 'statusReopenedCounter',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_PROPERTY_STATUS}`]: [
        'address', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'new_or_reopened',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_STATUS_ASSIGNEE}`]: [
        'assignee', 'address', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'new_or_reopened',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_STATUS_CATEGORY_CLASSIFIER}`]: [
        'categoryClassifier', 'address', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'new_or_reopened',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_STATUS_DAY_GROUP}`]: [
        'address', 'date', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'new_or_reopened',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_STATUS_EXECUTOR}`]: [
        'executor', 'address', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'new_or_reopened',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_STATUS_PROPERTY}`]: [
        'address', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'new_or_reopened',
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
    TICKETS_REPORTS_PREFIX,
    TICKET_REPORT_PROPERTY_STATUS,
    TICKET_REPORT_STATUS_ASSIGNEE,
    TICKET_REPORT_STATUS_CATEGORY_CLASSIFIER,
    TICKET_REPORT_STATUS_DAY_GROUP,
    TICKET_REPORT_STATUS_EXECUTOR,
    TICKET_REPORT_STATUS_PROPERTY,
    EXCEL_TEMPLATES_HEADERS,
    getHeadersTranslations,
    translationStringKeyForExcelExportHeader,
    ticketStatusesTranslations,
}
