const MAX_TICKET_REPORT_COUNT = 1000
const PDF_REPORT_WIDTH = 1600
const DATE_DISPLAY_FORMAT = 'DD.MM.YYYY'
const TICKET_REPORT_DAY_GROUP_STEPS = ['day', 'week']
const TICKET_REPORT_TABLE_MAIN_GROUP = ['categoryClassifier', 'executor', 'assignee']
const REQUIRED_TICKET_FIELDS = ['property', 'details', 'placeClassifier', 'categoryClassifier', 'deadline']

module.exports = {
    MAX_TICKET_REPORT_COUNT,
    PDF_REPORT_WIDTH,
    DATE_DISPLAY_FORMAT,
    TICKET_REPORT_DAY_GROUP_STEPS,
    TICKET_REPORT_TABLE_MAIN_GROUP,
    REQUIRED_TICKET_FIELDS,
}
