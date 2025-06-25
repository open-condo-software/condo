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
    CRM_IMPORT: 'crm_import',
}

const MIN_TICKET_DEADLINE_DURATION = 'P' // 0 days
const MAX_TICKET_DEADLINE_DURATION = 'P45D' // 45 days
const DEFAULT_TICKET_DEADLINE_DURATION = 'P8D' // 8 days
const TICKET_DEFAULT_DEADLINE_DURATION_FIELDS = ['defaultDeadlineDuration', 'paidDeadlineDuration', 'emergencyDeadlineDuration', 'warrantyDeadlineDuration']

const INACCESSIBLE_TICKET_FIELDS_FOR_MANAGE_BY_STAFF = ['feedbackValue', 'feedbackComment', 'feedbackAdditionalOptions']
const INACCESSIBLE_TICKET_FIELDS_FOR_MANAGE_BY_RESIDENT = ['qualityControlValue', 'qualityControlComment', 'qualityControlAdditionalOptions']
const AVAILABLE_TICKET_FIELDS_FOR_UPDATE_BY_RESIDENT = [
    'dv', 'status', 'sender',
    // TODO(DOMA-5833): should delete 'reviewValue' and 'reviewComment' when the mobile app will use 'feedback*' fields
    'reviewValue', 'reviewComment',
    'feedbackValue', 'feedbackComment', 'feedbackAdditionalOptions',
]

const GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE = 'generateCommentTipClosed'

module.exports = {
    GENERATE_COMMENT_TOUR_STEP_CLOSED_COOKIE,
    MAX_TICKET_REPORT_COUNT,
    PDF_REPORT_WIDTH,
    DATE_DISPLAY_FORMAT,
    TICKET_REPORT_DAY_GROUP_STEPS,
    TICKET_REPORT_TABLE_MAIN_GROUP,
    REQUIRED_TICKET_FIELDS,
    TICKET_SOURCE_TYPES,
    TICKET_SOURCE_PREFIX,
    MIN_TICKET_DEADLINE_DURATION,
    MAX_TICKET_DEADLINE_DURATION,
    DEFAULT_TICKET_DEADLINE_DURATION,
    TICKET_DEFAULT_DEADLINE_DURATION_FIELDS,
    INACCESSIBLE_TICKET_FIELDS_FOR_MANAGE_BY_STAFF,
    INACCESSIBLE_TICKET_FIELDS_FOR_MANAGE_BY_RESIDENT,
    AVAILABLE_TICKET_FIELDS_FOR_UPDATE_BY_RESIDENT,
}
