const { TicketSourceTypeType } = require('@app/condo/schema')

const MAX_TICKET_REPORT_COUNT = 1000
const PDF_REPORT_WIDTH = 1600
const DATE_DISPLAY_FORMAT = 'DD.MM.YYYY'
const TICKET_REPORT_DAY_GROUP_STEPS = ['day', 'week']
const TICKET_REPORT_TABLE_MAIN_GROUP = ['categoryClassifier', 'executor', 'assignee']
const REQUIRED_TICKET_FIELDS = ['property', 'details', 'placeClassifier', 'categoryClassifier', 'deadline']

const TICKET_SOURCE_PREFIX = 'ticket.source.'
const TICKET_SOURCE_TYPES = {
    EMAIL: 'email',
    MOBILE_APP: 'mobile_app',
    REMOTE_SYSTEM: 'remote_system',
    CALL: 'call',
    OTHER: 'other',
    VISIT: 'visit',
    WEB_APP: 'web_app',
    ORGANIZATION_SITE: 'organization_site',
    MESSENGER: 'messenger',
    SOCIAL_NETWORK: 'social_network',
    MOBILE_APP_STAFF: 'mobile_app_staff',
    MOBILE_APP_RESIDENT: 'mobile_app_resident',
}

const VISIBLE_TICKET_SOURCE_TYPES = [TicketSourceTypeType.Call, TicketSourceTypeType.MobileApp]

module.exports = {
    MAX_TICKET_REPORT_COUNT,
    PDF_REPORT_WIDTH,
    DATE_DISPLAY_FORMAT,
    TICKET_REPORT_DAY_GROUP_STEPS,
    TICKET_REPORT_TABLE_MAIN_GROUP,
    REQUIRED_TICKET_FIELDS,
    TICKET_SOURCE_TYPES,
    TICKET_SOURCE_PREFIX,
    VISIBLE_TICKET_SOURCE_TYPES,
}
