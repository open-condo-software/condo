const fs = require('fs')

const conf = require('@open-condo/config')
const { i18n } = require('@open-condo/locales/loader')

const { STATUS_IDS } = require('@condo/domains/ticket/constants/statusTransitions')

const EXPORT_TYPE_PAYMENTS = 'payments'
const EXPORT_TYPE_CONTACTS = 'contacts'
const EXPORT_TYPE_METERS = 'meters'
const EXPORT_TYPE_BUILDINGS = 'buildings'
const EXPORT_TYPE_TICKETS = 'tickets'
const EXPORT_TYPE_PROPERTY_SCOPES = 'propertyScopes'
const EXPORT_TYPE_INCIDENTS = 'incidents'
const EXPORT_TYPE_NEWS_RECIPIENTS = 'newsRecipients'

const TICKETS_REPORTS_PREFIX = 'ticketReport'
const TICKET_REPORT_PROPERTY_STATUS = 'PropertyStatus'
const TICKET_REPORT_STATUS_ASSIGNEE = 'StatusAssignee'
const TICKET_REPORT_STATUS_CATEGORY_CLASSIFIER = 'StatusCategoryClassifier'
const TICKET_REPORT_STATUS_DAY_GROUP = 'StatusDayGroup'
const TICKET_REPORT_STATUS_EXECUTOR = 'StatusExecutor'
const TICKET_REPORT_STATUS_PROPERTY = 'StatusProperty'

const EXCEL_TEMPLATES_HEADERS = {
    [EXPORT_TYPE_PAYMENTS]: ['date', 'account', 'address', 'unitName', 'type', 'transaction', 'order', 'status', 'amount'],
    [EXPORT_TYPE_CONTACTS]: ['name', 'address', 'unitName', 'unitType', 'phone', 'email', 'role', 'isVerified'],
    [EXPORT_TYPE_METERS]: [
        'date', 'address', 'unitName', 'unitType', 'accountNumber', 'resource',
        'number', 'place', 'value1', 'value2', 'value3', 'value4', 'clientName', 'source',
    ],
    [EXPORT_TYPE_BUILDINGS]: ['organization', 'address', 'unitsCount', 'uninhabitedUnitsCount', 'ticketsInWork', 'ticketsClosed'],
    [EXPORT_TYPE_TICKETS]: [
        'number', 'source', 'organization', 'property', 'unitName', 'unitType', 'entranceName', 'floorName', 'clientName', 'contact', 'clientPhone',
        'details', 'isEmergency', 'isWarranty', 'isPaid', 'place', 'category', 'description',
        'createdAt', 'updatedAt', 'inworkAt', 'completedAt', 'closedAt', 'status', 'operator', 'executor', 'assignee',
        'organizationComments', 'residentComments', 'deadline', 'deferredUntil', 'statusReopenedCounter',
        'feedbackValue', 'feedbackComment', 'feedbackAdditionalOptions', 'feedbackUpdatedAt',
        'qualityControlValue', 'qualityControlComment', 'qualityControlAdditionalOptions', 'qualityControlUpdatedAt', 'qualityControlUpdatedBy',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_PROPERTY_STATUS}`]: [
        'address', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'newOrReopened',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_STATUS_ASSIGNEE}`]: [
        'assignee', 'address', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'newOrReopened',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_STATUS_CATEGORY_CLASSIFIER}`]: [
        'categoryClassifier', 'address', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'newOrReopened',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_STATUS_DAY_GROUP}`]: [
        'address', 'date', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'newOrReopened',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_STATUS_EXECUTOR}`]: [
        'executor', 'address', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'newOrReopened',
    ],
    [`${TICKETS_REPORTS_PREFIX}${TICKET_REPORT_STATUS_PROPERTY}`]: [
        'address', 'processing', 'completed', 'canceled', 'deferred', 'closed', 'newOrReopened',
    ],
    [EXPORT_TYPE_PROPERTY_SCOPES]: [
        'name', 'properties', 'employees',
    ],
    [EXPORT_TYPE_INCIDENTS]: [
        'number', 'addresses', 'classifiers', 'details', 'textForResident', 'status', 'workStart', 'workFinish',
        'organization', 'createdBy', 'createdAt', 'workType',
    ],
    [EXPORT_TYPE_NEWS_RECIPIENTS]: [
        'address', 'unitName', 'hasResident',
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

/**
 * Should be used in all export operations to make file compatible with Excel
 * @param filename
 * @returns {WriteStream}
 */
const createWriteStreamForExport = (filename) => {
    const writeStream = fs.createWriteStream(filename, { encoding: 'utf8' })
    // Excel does not recognizes UTF-8 encoding without BOM (Byte Order Mark).
    // This mark should be inserted into beginning of file stream
    const BYTE_ORDER_MARKER = '\ufeff'
    writeStream.write(BYTE_ORDER_MARKER)
    return writeStream
}

module.exports = {
    EXPORT_TYPE_PAYMENTS,
    EXPORT_TYPE_CONTACTS,
    EXPORT_TYPE_METERS,
    EXPORT_TYPE_BUILDINGS,
    EXPORT_TYPE_TICKETS,
    EXPORT_TYPE_INCIDENTS,
    EXPORT_TYPE_NEWS_RECIPIENTS,
    TICKETS_REPORTS_PREFIX,
    TICKET_REPORT_PROPERTY_STATUS,
    TICKET_REPORT_STATUS_ASSIGNEE,
    TICKET_REPORT_STATUS_CATEGORY_CLASSIFIER,
    TICKET_REPORT_STATUS_DAY_GROUP,
    TICKET_REPORT_STATUS_EXECUTOR,
    TICKET_REPORT_STATUS_PROPERTY,
    EXCEL_TEMPLATES_HEADERS,
    EXPORT_TYPE_PROPERTY_SCOPES,
    getHeadersTranslations,
    translationStringKeyForExcelExportHeader,
    ticketStatusesTranslations,
    createWriteStreamForExport,
}
